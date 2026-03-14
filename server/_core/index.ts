import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import crypto from "crypto";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { logger } from "../logger";
import { ENV } from "./env";
import { getOrderByOrderNumber, updateOrderPayment, updateOrderStatus } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Let Vite handle CSP in dev
    crossOriginEmbedderPolicy: false, // Allow image loading from external CDNs
  }));

  // Body parser with reasonable size limit (base64 images ~7MB raw = ~10MB encoded)
  // Exclude webhook route from JSON parsing (it needs raw body for signature verification)
  app.use((req, res, next) => {
    if (req.path === "/api/payments/webhook") return next();
    express.json({ limit: "10mb" })(req, res, next);
  });
  app.use((req, res, next) => {
    if (req.path === "/api/payments/webhook") return next();
    express.urlencoded({ limit: "10mb", extended: true })(req, res, next);
  });

  // CSRF protection: require custom header on state-changing API requests
  app.use("/api/trpc", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
      const csrfHeader = req.headers["x-trpc-source"];
      if (!csrfHeader) {
        res.status(403).json({ error: "Missing CSRF header" });
        return;
      }
    }
    next();
  });

  // Request logging (non-static routes only)
  app.use("/api", (req, _res, next) => {
    logger.debug("API request", { method: req.method, path: req.path });
    next();
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ─── Paystack Payment Routes ───

  // Initialize a Paystack transaction
  app.post("/api/payments/initialize", async (req, res) => {
    try {
      const { orderId, email, amount, phone, metadata } = req.body;

      if (!orderId || !amount) {
        res.status(400).json({ error: "orderId and amount are required" });
        return;
      }

      // Amount comes in cedis, Paystack expects pesewas (multiply by 100)
      const amountInPesewas = Math.round(parseFloat(amount) * 100);

      const callbackUrl = ENV.appUrl
        ? `${ENV.appUrl}/checkout?reference={reference}`
        : undefined;

      const payload: Record<string, unknown> = {
        email: email || "customer@voom.gh",
        amount: amountInPesewas,
        currency: "GHS",
        reference: `VOM-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        metadata: {
          orderId,
          phone,
          ...metadata,
        },
        channels: ["mobile_money", "card"],
      };

      if (callbackUrl) {
        payload.callback_url = callbackUrl;
      }

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.status) {
        logger.error("Paystack initialize failed", { data });
        res.status(400).json({ error: data.message || "Payment initialization failed" });
        return;
      }

      // Store the reference on the order
      const order = await getOrderByOrderNumber(orderId);
      if (order) {
        await updateOrderPayment(order.id, { paymentReference: data.data.reference });
      }

      res.json({
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
        access_code: data.data.access_code,
      });
    } catch (error) {
      logger.error("Payment initialization error", { error: String(error) });
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  });

  // Paystack webhook — verify signature with HMAC SHA-512
  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      if (!signature) {
        res.status(400).json({ error: "No signature" });
        return;
      }

      const body = typeof req.body === "string" ? req.body : req.body.toString();
      const hash = crypto
        .createHmac("sha512", ENV.paystackSecretKey)
        .update(body)
        .digest("hex");

      if (hash !== signature) {
        logger.warn("Paystack webhook signature mismatch");
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      const event = JSON.parse(body);

      if (event.event === "charge.success") {
        const { reference, metadata } = event.data;
        const orderId = metadata?.orderId;

        if (orderId) {
          const order = await getOrderByOrderNumber(orderId);
          if (order) {
            await updateOrderPayment(order.id, {
              paymentStatus: "paid",
              paymentReference: reference,
            });
            // Auto-confirm the order when payment is received
            if (order.status === "pending") {
              await updateOrderStatus(order.id, "confirmed");
            }
            logger.info("Payment confirmed via webhook", { orderId, reference });
          }
        }
      }

      res.sendStatus(200);
    } catch (error) {
      logger.error("Webhook processing error", { error: String(error) });
      res.sendStatus(500);
    }
  });

  // Verify a Paystack transaction
  app.get("/api/payments/verify/:reference", async (req, res) => {
    try {
      const { reference } = req.params;

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          Authorization: `Bearer ${ENV.paystackSecretKey}`,
        },
      });

      const data = await response.json();

      if (!data.status) {
        res.status(400).json({ error: data.message || "Verification failed" });
        return;
      }

      const txData = data.data;
      const orderId = txData.metadata?.orderId;

      if (orderId && txData.status === "success") {
        const order = await getOrderByOrderNumber(orderId);
        if (order) {
          await updateOrderPayment(order.id, {
            paymentStatus: "paid",
            paymentReference: reference,
          });
          if (order.status === "pending") {
            await updateOrderStatus(order.id, "confirmed");
          }
        }
      }

      res.json({
        status: txData.status,
        reference: txData.reference,
        amount: txData.amount / 100, // Convert back from pesewas to cedis
        currency: txData.currency,
        paidAt: txData.paid_at,
        channel: txData.channel,
        orderId,
      });
    } catch (error) {
      logger.error("Payment verification error", { error: String(error) });
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    logger.info("Server started", { port, env: process.env.NODE_ENV || "development" });
  });
}

startServer().catch((err) => {
  logger.error("Server failed to start", { error: String(err) });
  process.exit(1);
});
