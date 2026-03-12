import { COOKIE_NAME } from "@shared/const";
import { isValidStatusTransition, isValidGhanaPhone } from "@shared/marketplace";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { storagePut } from "./storage";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return next({ ctx });
});

const vendorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const vendor = await db.getVendorByUserId(ctx.user.id);
  if (!vendor || vendor.status !== "approved") {
    throw new Error("Forbidden: approved vendor access required");
  }
  return next({ ctx: { ...ctx, vendor } });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    requestOtp: publicProcedure.input(z.object({
      phone: z.string().min(1, "Phone number is required"),
      name: z.string().min(1, "Name is required").max(255),
    })).mutation(async ({ input }) => {
      // Normalize phone: ensure it has country code format for storage
      const cleanPhone = input.phone.replace(/[\s\-()]/g, "");
      if (!isValidGhanaPhone(cleanPhone)) {
        throw new Error("Please enter a valid Ghana phone number (e.g. 0241234567)");
      }

      // Find or create user
      let user = await db.getUserByPhone(cleanPhone);
      let isNewUser = false;
      if (!user) {
        user = await db.createPhoneUser(cleanPhone, input.name);
        isNewUser = true;
      }
      if (!user) throw new Error("Failed to create account");

      // Generate OTP — for MVP, use "1234" (real SMS in Phase 2)
      const otp = "1234";
      await db.saveOtp(user.id, otp);

      // In production, send SMS here via Hubtel/Arkesel
      console.log(`[OTP] Code for ${cleanPhone}: ${otp}`);

      return { success: true, message: "OTP sent to your phone", isNewUser };
    }),
    verifyOtp: publicProcedure.input(z.object({
      phone: z.string().min(1),
      otp: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const cleanPhone = input.phone.replace(/[\s\-()]/g, "");
      const valid = await db.verifyOtp(cleanPhone, input.otp);
      if (!valid) throw new Error("Invalid or expired OTP");

      const user = await db.getUserByPhone(cleanPhone);
      if (!user) throw new Error("User not found");

      // Create session token using the user's openId
      const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return { success: true, user };
    }),
    updateProfile: protectedProcedure.input(z.object({
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().max(320).optional(),
      phone: z.string().max(20).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (input.phone && !isValidGhanaPhone(input.phone)) {
        throw new Error("Please enter a valid Ghana phone number");
      }
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
  }),

  // ─── File Upload ───
  upload: router({
    image: protectedProcedure.input(z.object({
      base64: z.string().min(1),
      fileName: z.string().min(1).max(255),
      contentType: z.string().refine(
        (v) => v.startsWith("image/"),
        { message: "Only image files are allowed" }
      ),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      // Max 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error("Image must be less than 5MB");
      }
      const ext = input.fileName.split(".").pop() || "jpg";
      const key = `products/${ctx.user.id}/${nanoid(12)}.${ext}`;
      const result = await storagePut(key, buffer, input.contentType);
      return { url: result.url };
    }),
  }),

  // ─── Categories ───
  category: router({
    list: publicProcedure.query(async () => {
      return db.getCategories();
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(100),
      icon: z.string().max(50).optional(),
      parentId: z.number().positive().optional(),
    })).mutation(async ({ input }) => {
      await db.createCategory(input);
      return { success: true };
    }),
  }),

  // ─── Vendors ───
  vendor: router({
    register: protectedProcedure.input(z.object({
      businessName: z.string().min(1).max(255),
      description: z.string().max(2000).optional(),
      phone: z.string().min(1).max(20),
      whatsapp: z.string().max(20).optional(),
      email: z.string().email().max(320).optional(),
      address: z.string().max(500).optional(),
      city: z.string().max(100).optional(),
      region: z.string().max(100).optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const existing = await db.getVendorByUserId(ctx.user.id);
      if (existing) throw new Error("You already have a vendor profile");

      // Validate Ghana phone
      if (!isValidGhanaPhone(input.phone)) {
        throw new Error("Please enter a valid Ghana phone number (e.g. 0241234567)");
      }

      // Auto-approve vendors for MVP — they can start listing immediately
      const result = await db.createVendor({ ...input, userId: ctx.user.id, status: "approved" });
      // Update user role to vendor
      await db.updateUserRole(ctx.user.id, "vendor");
      return { success: true, vendorId: result?.id, status: "approved" as const };
    }),
    me: protectedProcedure.query(async ({ ctx }) => {
      return db.getVendorByUserId(ctx.user.id);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getVendorById(input.id);
    }),
    list: publicProcedure.query(async () => {
      return db.getApprovedVendors();
    }),
    update: protectedProcedure.input(z.object({
      businessName: z.string().min(1).max(255).optional(),
      description: z.string().max(2000).optional(),
      phone: z.string().max(20).optional(),
      whatsapp: z.string().max(20).optional(),
      email: z.string().email().max(320).optional(),
      address: z.string().max(500).optional(),
      city: z.string().max(100).optional(),
      region: z.string().max(100).optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      logoUrl: z.string().url().optional(),
      coverUrl: z.string().url().optional(),
    })).mutation(async ({ ctx, input }) => {
      const vendor = await db.getVendorByUserId(ctx.user.id);
      if (!vendor) throw new Error("Vendor profile not found");

      if (input.phone && !isValidGhanaPhone(input.phone)) {
        throw new Error("Please enter a valid Ghana phone number");
      }

      await db.updateVendor(vendor.id, input);
      return { success: true };
    }),
  }),

  // ─── Products ───
  product: router({
    create: vendorProcedure.input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(5000).optional(),
      price: z.string().min(1).refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        { message: "Price must be a positive number" }
      ),
      categoryId: z.number().positive().optional(),
      sku: z.string().max(100).optional(),
      brand: z.string().max(100).optional(),
      condition: z.enum(["new", "used", "refurbished"]).optional(),
      vehicleMake: z.string().max(100).optional(),
      vehicleModel: z.string().max(100).optional(),
      yearFrom: z.number().min(1900).max(2100).optional(),
      yearTo: z.number().min(1900).max(2100).optional(),
      oemPartNumber: z.string().max(100).optional(),
      quantity: z.number().min(0).default(0),
      minOrderQty: z.number().min(1).optional(),
      images: z.array(z.string().url()).max(10).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (input.yearFrom && input.yearTo && input.yearFrom > input.yearTo) {
        throw new Error("yearFrom must be less than or equal to yearTo");
      }
      const result = await db.createProduct({ ...input, vendorId: ctx.vendor.id });
      return { success: true, productId: result?.id };
    }),
    update: vendorProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(5000).optional(),
      price: z.string().refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        { message: "Price must be a positive number" }
      ).optional(),
      categoryId: z.number().positive().optional(),
      sku: z.string().max(100).optional(),
      brand: z.string().max(100).optional(),
      condition: z.enum(["new", "used", "refurbished"]).optional(),
      vehicleMake: z.string().max(100).optional(),
      vehicleModel: z.string().max(100).optional(),
      yearFrom: z.number().min(1900).max(2100).optional(),
      yearTo: z.number().min(1900).max(2100).optional(),
      oemPartNumber: z.string().max(100).optional(),
      quantity: z.number().min(0).optional(),
      minOrderQty: z.number().min(1).optional(),
      images: z.array(z.string().url()).max(10).optional(),
      status: z.enum(["active", "inactive", "out_of_stock"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const product = await db.getProductById(input.id);
      if (!product || product.vendorId !== ctx.vendor.id) throw new Error("Product not found");
      const { id, ...data } = input;
      await db.updateProduct(id, data);
      return { success: true };
    }),
    delete: vendorProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const product = await db.getProductById(input.id);
      if (!product || product.vendorId !== ctx.vendor.id) throw new Error("Product not found");
      await db.deleteProduct(input.id);
      return { success: true };
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const product = await db.getProductById(input.id);
      if (!product) return null;
      const vendor = await db.getVendorById(product.vendorId);
      return { ...product, vendor };
    }),
    myProducts: vendorProcedure.query(async ({ ctx }) => {
      return db.getVendorProducts(ctx.vendor.id);
    }),
    search: publicProcedure.input(z.object({
      search: z.string().max(200).optional(),
      categoryId: z.number().optional(),
      vendorId: z.number().optional(),
      vehicleMake: z.string().max(100).optional(),
      vehicleModel: z.string().max(100).optional(),
      yearFrom: z.number().optional(),
      yearTo: z.number().optional(),
      condition: z.string().optional(),
      minPrice: z.number().min(0).optional(),
      maxPrice: z.number().min(0).optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    })).query(async ({ input }) => {
      return db.searchProducts(input);
    }),
    featured: publicProcedure.query(async () => {
      return db.getFeaturedProducts();
    }),
    latest: publicProcedure.query(async () => {
      return db.getLatestProducts();
    }),
    makes: publicProcedure.query(async () => {
      return db.getDistinctMakes();
    }),
    models: publicProcedure.input(z.object({ make: z.string() })).query(async ({ input }) => {
      return db.getDistinctModels(input.make);
    }),
  }),

  // ─── Cart ───
  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCartItems(ctx.user.id);
    }),
    add: protectedProcedure.input(z.object({
      productId: z.number(),
      quantity: z.number().min(1).max(999).default(1),
    })).mutation(async ({ ctx, input }) => {
      await db.addToCart(ctx.user.id, input.productId, input.quantity);
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      quantity: z.number().min(1).max(999),
    })).mutation(async ({ ctx, input }) => {
      await db.updateCartItem(input.id, input.quantity, ctx.user.id);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.removeCartItem(input.id, ctx.user.id);
      return { success: true };
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Orders ───
  order: router({
    create: protectedProcedure.input(z.object({
      vendorId: z.number(),
      paymentMethod: z.enum(["pay_on_delivery", "bank_transfer", "mobile_money"]).default("pay_on_delivery"),
      shippingAddress: z.string().min(1, "Shipping address is required").max(500),
      shippingCity: z.string().min(1, "City is required").max(100),
      shippingRegion: z.string().min(1, "Region is required").max(100),
      buyerPhone: z.string().min(1, "Phone number is required").max(20),
      buyerName: z.string().min(1, "Name is required").max(255),
      notes: z.string().max(1000).optional(),
      items: z.array(z.object({
        productId: z.number(),
        productName: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.string(),
        totalPrice: z.string(),
      })).min(1, "Order must have at least one item"),
    })).mutation(async ({ ctx, input }) => {
      // Validate phone
      if (!isValidGhanaPhone(input.buyerPhone)) {
        throw new Error("Please enter a valid Ghana phone number");
      }

      // Validate vendor exists and is approved
      const vendor = await db.getVendorById(input.vendorId);
      if (!vendor || vendor.status !== "approved") {
        throw new Error("Vendor is not available");
      }

      const orderNumber = `VOM-${nanoid(8).toUpperCase()}`;
      const { items, ...rest } = input;

      // createOrder now handles inventory validation, price verification, and stock decrement
      const result = await db.createOrder({
        orderNumber,
        userId: ctx.user.id,
        totalAmount: "0", // Will be recalculated server-side
        ...rest,
        items,
      });

      // Clear cart after successful order
      await db.clearCart(ctx.user.id);

      // Get the created order to know the real total
      const createdOrder = result ? await db.getOrderById(result.id) : null;
      const totalAmount = createdOrder?.totalAmount || "0";

      // Notify vendor
      await db.createNotification({
        userId: vendor.userId,
        title: "New Order Received",
        message: `Order ${orderNumber} has been placed. Total: GH₵${totalAmount}. Payment: ${input.paymentMethod.replace(/_/g, " ")}`,
        type: "order",
        link: `/vendor/orders`,
      });

      return { success: true, orderNumber, orderId: result?.id };
    }),
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserOrders(ctx.user.id);
    }),
    vendorOrders: vendorProcedure.query(async ({ ctx }) => {
      return db.getVendorOrders(ctx.vendor.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.id);
      if (!order) throw new Error("Order not found");
      // Authorization: user must own the order, be the vendor, or be admin
      const vendor = await db.getVendorByUserId(ctx.user.id);
      const isOwner = order.userId === ctx.user.id;
      const isVendor = vendor && order.vendorId === vendor.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isVendor && !isAdmin) {
        throw new Error("You do not have access to this order");
      }
      return order;
    }),
    updateStatus: vendorProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled"]),
    })).mutation(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.id);
      if (!order) throw new Error("Order not found");

      // Authorization: vendor must own this order
      if (order.vendorId !== ctx.vendor.id) {
        throw new Error("You do not have access to this order");
      }

      // Validate status transition
      if (!isValidStatusTransition(order.status, input.status)) {
        throw new Error(`Cannot change order status from "${order.status}" to "${input.status}"`);
      }

      // Build status history
      const history = (order.statusHistory as { status: string; at: string; by?: string }[] || []);
      history.push({ status: input.status, at: new Date().toISOString(), by: `vendor:${ctx.vendor.id}` });

      await db.updateOrderStatus(input.id, input.status, history);

      // Restore inventory on cancellation
      if (input.status === "cancelled") {
        await db.restoreInventory(input.id);
      }

      // Track delivery as a sale
      if (input.status === "delivered") {
        await db.incrementVendorSales(ctx.vendor.id);
      }

      // Notify buyer
      await db.createNotification({
        userId: order.userId,
        title: "Order Updated",
        message: `Your order ${order.orderNumber} status has been updated to: ${input.status}`,
        type: "order",
        link: `/orders`,
      });

      return { success: true };
    }),
    // Allow buyer to cancel a pending order
    cancel: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.id);
      if (!order) throw new Error("Order not found");
      if (order.userId !== ctx.user.id) throw new Error("You do not have access to this order");
      if (order.status !== "pending") {
        throw new Error("Only pending orders can be cancelled by the buyer");
      }

      const history = (order.statusHistory as { status: string; at: string; by?: string }[] || []);
      history.push({ status: "cancelled", at: new Date().toISOString(), by: `buyer:${ctx.user.id}` });

      await db.updateOrderStatus(input.id, "cancelled", history);
      await db.restoreInventory(input.id);

      // Notify vendor
      const vendor = await db.getVendorById(order.vendorId);
      if (vendor) {
        await db.createNotification({
          userId: vendor.userId,
          title: "Order Cancelled",
          message: `Order ${order.orderNumber} has been cancelled by the buyer.`,
          type: "order",
          link: `/vendor/orders`,
        });
      }

      return { success: true };
    }),
  }),

  // ─── Notifications ───
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserNotifications(ctx.user.id);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Reviews ───
  review: router({
    create: protectedProcedure.input(z.object({
      vendorId: z.number(),
      productId: z.number().optional(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(3, "Review must be at least 3 characters").max(2000).optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createReview({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
    vendorReviews: publicProcedure.input(z.object({ vendorId: z.number() })).query(async ({ input }) => {
      return db.getVendorReviews(input.vendorId);
    }),
  }),

  // ─── Inquiries ───
  inquiry: router({
    create: protectedProcedure.input(z.object({
      productId: z.number(),
      vendorId: z.number(),
      message: z.string().max(2000).optional(),
      buyerPhone: z.string().max(20).optional(),
      buyerName: z.string().max(255).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (input.buyerPhone && !isValidGhanaPhone(input.buyerPhone)) {
        throw new Error("Please enter a valid Ghana phone number");
      }
      // Validate product exists
      const product = await db.getProductById(input.productId);
      if (!product) throw new Error("Product not found");
      // Validate vendor
      const vendor = await db.getVendorById(input.vendorId);
      if (!vendor || vendor.status !== "approved") throw new Error("Vendor not available");

      const result = await db.createInquiry({
        buyerId: ctx.user.id,
        vendorId: input.vendorId,
        productId: input.productId,
        message: input.message,
        buyerPhone: input.buyerPhone,
        buyerName: input.buyerName,
      });

      // Notify vendor
      await db.createNotification({
        userId: vendor.userId,
        title: "New Inquiry",
        message: `A buyer is interested in "${product.name}". ${input.message ? `Message: ${input.message.slice(0, 100)}` : "Check your inquiries."}`,
        type: "inquiry",
        link: `/vendor/dashboard`,
      });

      return { success: true, inquiryId: result?.id };
    }),
    myInquiries: protectedProcedure.query(async ({ ctx }) => {
      return db.getBuyerInquiries(ctx.user.id);
    }),
    vendorInquiries: vendorProcedure.query(async ({ ctx }) => {
      return db.getVendorInquiries(ctx.vendor.id);
    }),
    updateStatus: vendorProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["responded", "sold", "closed"]),
      vendorNotes: z.string().max(2000).optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateInquiryStatus(input.id, ctx.vendor.id, input.status, input.vendorNotes);
      return { success: true };
    }),
  }),

  // ─── Vehicle Reference Data ───
  vehicle: router({
    makes: publicProcedure.query(async () => {
      return db.getVehicleMakes();
    }),
    models: publicProcedure.input(z.object({ makeId: z.number() })).query(async ({ input }) => {
      return db.getVehicleModelsByMake(input.makeId);
    }),
  }),

  // ─── Admin ───
  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getAdminStats();
    }),
    vendors: adminProcedure.query(async () => {
      return db.getAllVendors();
    }),
    updateVendorStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["approved", "rejected", "suspended"]),
    })).mutation(async ({ input }) => {
      await db.updateVendorStatus(input.id, input.status);
      const vendor = await db.getVendorById(input.id);
      if (vendor) {
        await db.createNotification({
          userId: vendor.userId,
          title: "Vendor Status Updated",
          message: `Your vendor application has been ${input.status}.`,
          type: "vendor",
        });
      }
      return { success: true };
    }),
    orders: adminProcedure.query(async () => {
      return db.getAllOrders();
    }),
    seedCategories: adminProcedure.mutation(async () => {
      const cats = [
        { name: "Engine Parts", slug: "engine-parts", icon: "Cog" },
        { name: "Brake System", slug: "brake-system", icon: "CircleStop" },
        { name: "Suspension", slug: "suspension", icon: "ArrowUpDown" },
        { name: "Electrical", slug: "electrical", icon: "Zap" },
        { name: "Body Parts", slug: "body-parts", icon: "Car" },
        { name: "Transmission", slug: "transmission", icon: "Settings" },
        { name: "Exhaust System", slug: "exhaust-system", icon: "Wind" },
        { name: "Cooling System", slug: "cooling-system", icon: "Thermometer" },
        { name: "Filters & Fluids", slug: "filters-fluids", icon: "Droplets" },
        { name: "Lighting", slug: "lighting", icon: "Lightbulb" },
        { name: "Tires & Wheels", slug: "tires-wheels", icon: "Circle" },
        { name: "Interior", slug: "interior", icon: "Armchair" },
      ];
      for (const cat of cats) {
        try { await db.createCategory(cat); } catch (e) { /* ignore duplicates */ }
      }
      return { success: true, count: cats.length };
    }),
  }),
});

export type AppRouter = typeof appRouter;
