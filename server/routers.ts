import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";

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
  }),

  // ─── Categories ───
  category: router({
    list: publicProcedure.query(async () => {
      return db.getCategories();
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      icon: z.string().optional(),
      parentId: z.number().optional(),
    })).mutation(async ({ input }) => {
      await db.createCategory(input);
      return { success: true };
    }),
  }),

  // ─── Vendors ───
  vendor: router({
    register: protectedProcedure.input(z.object({
      businessName: z.string().min(1),
      description: z.string().optional(),
      phone: z.string().min(1),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const existing = await db.getVendorByUserId(ctx.user.id);
      if (existing) throw new Error("You already have a vendor profile");
      const result = await db.createVendor({ ...input, userId: ctx.user.id });
      return { success: true, vendorId: result?.id };
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
      businessName: z.string().optional(),
      description: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      logoUrl: z.string().optional(),
      coverUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const vendor = await db.getVendorByUserId(ctx.user.id);
      if (!vendor) throw new Error("Vendor profile not found");
      await db.updateVendor(vendor.id, input);
      return { success: true };
    }),
  }),

  // ─── Products ───
  product: router({
    create: vendorProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.string().min(1),
      categoryId: z.number().optional(),
      sku: z.string().optional(),
      brand: z.string().optional(),
      condition: z.enum(["new", "used", "refurbished"]).optional(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      yearFrom: z.number().optional(),
      yearTo: z.number().optional(),
      quantity: z.number().optional(),
      minOrderQty: z.number().optional(),
      images: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createProduct({ ...input, vendorId: ctx.vendor.id });
      return { success: true, productId: result?.id };
    }),
    update: vendorProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.string().optional(),
      categoryId: z.number().optional(),
      sku: z.string().optional(),
      brand: z.string().optional(),
      condition: z.enum(["new", "used", "refurbished"]).optional(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      yearFrom: z.number().optional(),
      yearTo: z.number().optional(),
      quantity: z.number().optional(),
      minOrderQty: z.number().optional(),
      images: z.array(z.string()).optional(),
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
      search: z.string().optional(),
      categoryId: z.number().optional(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      yearFrom: z.number().optional(),
      yearTo: z.number().optional(),
      condition: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
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
      quantity: z.number().min(1).default(1),
    })).mutation(async ({ ctx, input }) => {
      await db.addToCart(ctx.user.id, input.productId, input.quantity);
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      quantity: z.number().min(1),
    })).mutation(async ({ input }) => {
      await db.updateCartItem(input.id, input.quantity);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.removeCartItem(input.id);
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
      shippingAddress: z.string().optional(),
      shippingCity: z.string().optional(),
      shippingRegion: z.string().optional(),
      buyerPhone: z.string().optional(),
      buyerName: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        productName: z.string(),
        quantity: z.number(),
        unitPrice: z.string(),
        totalPrice: z.string(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const orderNumber = `VOM-${nanoid(8).toUpperCase()}`;
      const totalAmount = input.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);
      const { items, ...rest } = input;
      const result = await db.createOrder({
        orderNumber,
        userId: ctx.user.id,
        totalAmount,
        ...rest,
        items,
      });
      // Clear cart after order
      await db.clearCart(ctx.user.id);
      // Notify vendor
      await db.createNotification({
        userId: input.vendorId,
        title: "New Order Received",
        message: `Order ${orderNumber} has been placed. Total: GH₵${totalAmount}`,
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
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getOrderById(input.id);
    }),
    updateStatus: vendorProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled"]),
    })).mutation(async ({ input }) => {
      await db.updateOrderStatus(input.id, input.status);
      const order = await db.getOrderById(input.id);
      if (order) {
        await db.createNotification({
          userId: order.userId,
          title: "Order Updated",
          message: `Your order ${order.orderNumber} status has been updated to: ${input.status}`,
          type: "order",
          link: `/orders`,
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
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
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
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createReview({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
    vendorReviews: publicProcedure.input(z.object({ vendorId: z.number() })).query(async ({ input }) => {
      return db.getVendorReviews(input.vendorId);
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
