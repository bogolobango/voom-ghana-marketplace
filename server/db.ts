import { eq, and, like, desc, asc, sql, or, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users, vendors, InsertVendor, products, InsertProduct,
  categories, cartItems, orders, orderItems, reviews, notifications, inquiries,
  vehicleMakes, vehicleModels,
  type Vendor, type Product, type Category, type Order, type InsertInquiry
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "phone"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    (values as any)[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "vendor") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name?: string; email?: string; phone?: string }) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, any> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.email !== undefined) updateSet.email = data.email;
  if (data.phone !== undefined) updateSet.phone = data.phone;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, userId));
  }
}

// ─── Phone Auth Helpers ───
export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result[0];
}

export async function createPhoneUser(phone: string, name: string) {
  const db = await getDb();
  if (!db) return undefined;
  // Use phone as openId for phone-auth users
  const openId = `phone:${phone}`;
  await db.insert(users).values({
    openId,
    phone,
    name,
    loginMethod: "phone",
    isVerified: false,
  });
  return db.select().from(users).where(eq(users.openId, openId)).limit(1).then(r => r[0]);
}

export async function saveOtp(userId: number, otpCode: string) {
  const db = await getDb();
  if (!db) return;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await db.update(users).set({ otpCode, otpExpiresAt: expiresAt }).where(eq(users.id, userId));
}

export async function verifyOtp(phone: string, otpCode: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const user = await getUserByPhone(phone);
  if (!user) return false;
  if (user.otpCode !== otpCode) return false;
  if (user.otpExpiresAt && new Date(user.otpExpiresAt) < new Date()) return false;
  // Mark verified and clear OTP
  await db.update(users).set({ otpCode: null, otpExpiresAt: null, isVerified: true })
    .where(eq(users.id, user.id));
  return true;
}

// ─── Vehicle Reference Helpers ───
export async function getVehicleMakes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicleMakes).orderBy(asc(vehicleMakes.name));
}

export async function getVehicleModelsByMake(makeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicleModels).where(eq(vehicleModels.makeId, makeId)).orderBy(asc(vehicleModels.name));
}

// ─── Category Helpers ───
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function createCategory(data: { name: string; slug: string; icon?: string; parentId?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(categories).values(data);
}

export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.role, "admin"));
}

// ─── Vendor Helpers ───
export async function createVendor(data: InsertVendor) {
  const db = await getDb();
  if (!db) return;
  const [result] = await db.insert(vendors).values(data).returning({ id: vendors.id });
  return result;
}

export async function getVendorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);
  return result[0];
}

export async function getVendorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  return result[0];
}

export async function getApprovedVendors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendors).where(eq(vendors.status, "approved")).orderBy(desc(vendors.createdAt));
}

export async function getAllVendors(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendors).orderBy(desc(vendors.createdAt)).limit(Math.min(limit, 100)).offset(offset);
}

export async function updateVendorStatus(id: number, status: "pending" | "approved" | "rejected" | "suspended") {
  const db = await getDb();
  if (!db) return;
  await db.update(vendors).set({ status }).where(eq(vendors.id, id));
}

export async function updateVendor(id: number, data: Partial<InsertVendor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(vendors).set(data).where(eq(vendors.id, id));
}

// ─── Product Helpers ───
export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) return;
  const [result] = await db.insert(products).values(data).returning({ id: products.id });
  return result;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  // Soft-delete: set to inactive instead of hard delete, preserving order history
  await db.update(products).set({ status: "inactive" }).where(eq(products.id, id));
}

export async function getVendorProducts(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.vendorId, vendorId)).orderBy(desc(products.createdAt));
}

export async function searchProducts(filters: {
  search?: string;
  categoryId?: number;
  vendorId?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  yearFrom?: number;
  yearTo?: number;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };

  const conditions = [eq(products.status, "active")];

  if (filters.search) {
    conditions.push(
      or(
        like(products.name, `%${filters.search}%`),
        like(products.brand, `%${filters.search}%`),
        like(products.vehicleMake, `%${filters.search}%`),
        like(products.vehicleModel, `%${filters.search}%`),
        like(products.oemPartNumber, `%${filters.search}%`)
      )!
    );
  }
  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters.vendorId) conditions.push(eq(products.vendorId, filters.vendorId));
  if (filters.vehicleMake) conditions.push(eq(products.vehicleMake, filters.vehicleMake));
  if (filters.vehicleModel) conditions.push(eq(products.vehicleModel, filters.vehicleModel));
  if (filters.condition) conditions.push(eq(products.condition, filters.condition as any));
  if (filters.yearFrom) conditions.push(lte(products.yearFrom, filters.yearFrom)); // product fits if its range covers the year
  if (filters.yearTo) conditions.push(gte(products.yearTo, filters.yearTo));
  if (filters.minPrice) conditions.push(gte(products.price, String(filters.minPrice)));
  if (filters.maxPrice) conditions.push(lte(products.price, String(filters.maxPrice)));

  const where = and(...conditions);
  const limit = Math.min(filters.limit || 20, 100); // Cap at 100
  const offset = filters.offset || 0;

  const sortOrder = filters.sortBy === "price_asc"
    ? asc(products.price)
    : filters.sortBy === "price_desc"
    ? desc(products.price)
    : desc(products.createdAt); // default: newest

  const [items, countResult] = await Promise.all([
    db.select().from(products).where(where).orderBy(sortOrder).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products).where(where),
  ]);

  return { products: items, total: Number(countResult[0]?.count || 0) };
}

export async function autocompleteProducts(query: string, limit = 8) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select({ id: products.id, name: products.name, brand: products.brand, vehicleMake: products.vehicleMake })
    .from(products)
    .where(
      and(
        eq(products.status, "active"),
        or(
          like(products.name, `%${query}%`),
          like(products.brand, `%${query}%`),
          like(products.oemPartNumber, `%${query}%`),
          like(products.vehicleMake, `%${query}%`),
          like(products.vehicleModel, `%${query}%`)
        )!
      )
    )
    .limit(limit);
  return results;
}

export async function getFeaturedProducts(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(and(eq(products.status, "active"), eq(products.featured, true)))
    .orderBy(desc(products.createdAt)).limit(limit);
}

export async function getLatestProducts(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(eq(products.status, "active"))
    .orderBy(desc(products.createdAt)).limit(limit);
}

export async function getDistinctMakes() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ make: products.vehicleMake }).from(products)
    .where(and(eq(products.status, "active"), sql`${products.vehicleMake} IS NOT NULL`))
    .orderBy(asc(products.vehicleMake));
  return result.map(r => r.make).filter(Boolean) as string[];
}

export async function getDistinctModels(make: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ model: products.vehicleModel }).from(products)
    .where(and(eq(products.status, "active"), eq(products.vehicleMake, make), sql`${products.vehicleModel} IS NOT NULL`))
    .orderBy(asc(products.vehicleModel));
  return result.map(r => r.model).filter(Boolean) as string[];
}

// ─── Cart Helpers ───
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  if (items.length === 0) return [];
  const productIds = items.map(i => i.productId);
  const prods = await db.select().from(products).where(inArray(products.id, productIds));
  const prodMap = new Map(prods.map(p => [p.id, p]));
  // Fetch vendor info for WhatsApp links in checkout
  const vendorIds = Array.from(new Set(prods.map(p => p.vendorId)));
  const vends = vendorIds.length > 0
    ? await db.select({ id: vendors.id, businessName: vendors.businessName, phone: vendors.phone, whatsapp: vendors.whatsapp })
        .from(vendors).where(inArray(vendors.id, vendorIds))
    : [];
  const vendorMap = new Map(vends.map(v => [v.id, v]));
  return items.map(item => {
    const product = prodMap.get(item.productId);
    return { ...item, product, vendor: product ? vendorMap.get(product.vendorId) : undefined };
  });
}

export async function addToCart(userId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;

  // Validate product exists and is active
  const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product[0]) throw new Error("Product not found");
  if (product[0].status !== "active") throw new Error("Product is not available");

  // Check stock
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))).limit(1);
  const currentQty = existing.length > 0 ? existing[0].quantity : 0;
  const requestedTotal = currentQty + quantity;

  if (requestedTotal > product[0].quantity) {
    throw new Error(`Only ${product[0].quantity} units available in stock`);
  }

  if (product[0].minOrderQty && quantity < product[0].minOrderQty) {
    throw new Error(`Minimum order quantity is ${product[0].minOrderQty}`);
  }

  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: requestedTotal })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }
}

export async function updateCartItem(id: number, quantity: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  // Verify ownership
  const item = await db.select().from(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId))).limit(1);
  if (!item[0]) throw new Error("Cart item not found");

  // Validate stock
  const product = await db.select().from(products).where(eq(products.id, item[0].productId)).limit(1);
  if (!product[0] || product[0].status !== "active") throw new Error("Product is no longer available");
  if (quantity > product[0].quantity) throw new Error(`Only ${product[0].quantity} units available`);

  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
}

export async function removeCartItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  // Only delete if owned by user
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Order Helpers ───
export async function createOrder(data: {
  orderNumber: string; userId: number; vendorId: number; totalAmount: string;
  paymentMethod?: string;
  shippingAddress?: string; shippingCity?: string; shippingRegion?: string;
  buyerPhone?: string; buyerName?: string; notes?: string;
  items: { productId: number; productName: string; quantity: number; unitPrice: string; totalPrice: string }[];
}) {
  const db = await getDb();
  if (!db) return;

  const { items, ...orderData } = data;

  // Validate inventory and compute verified totals
  const productIds = items.map(i => i.productId);
  const prods = await db.select().from(products).where(inArray(products.id, productIds));
  const prodMap = new Map(prods.map(p => [p.id, p]));

  let verifiedTotal = 0;
  const verifiedItems: typeof items = [];

  for (const item of items) {
    const product = prodMap.get(item.productId);
    if (!product) throw new Error(`Product "${item.productName}" is no longer available`);
    if (product.status !== "active") throw new Error(`Product "${product.name}" is not available for purchase`);
    if (item.quantity > product.quantity) {
      throw new Error(`Insufficient stock for "${product.name}": only ${product.quantity} available`);
    }
    if (product.minOrderQty && item.quantity < product.minOrderQty) {
      throw new Error(`Minimum order quantity for "${product.name}" is ${product.minOrderQty}`);
    }

    // Use server-side price (prevent price manipulation)
    const serverUnitPrice = product.price;
    const serverTotalPrice = (parseFloat(serverUnitPrice) * item.quantity).toFixed(2);
    verifiedTotal += parseFloat(serverTotalPrice);
    verifiedItems.push({
      ...item,
      unitPrice: serverUnitPrice,
      totalPrice: serverTotalPrice,
    });
  }

  const serverTotalAmount = verifiedTotal.toFixed(2);
  const statusHistory = [{ status: "pending", at: new Date().toISOString() }];

  // Insert order
  const [result] = await db.insert(orders).values({
    ...orderData,
    totalAmount: serverTotalAmount,
    paymentMethod: (orderData.paymentMethod || "pay_on_delivery") as any,
    statusHistory,
  }).returning({ id: orders.id });

  if (result && verifiedItems.length > 0) {
    // Insert order items
    await db.insert(orderItems).values(verifiedItems.map(item => ({ ...item, orderId: result.id })));

    // Decrement inventory
    for (const item of verifiedItems) {
      await db.update(products)
        .set({ quantity: sql`${products.quantity} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    // Auto-mark out of stock products
    await db.update(products)
      .set({ status: "out_of_stock" })
      .where(and(
        inArray(products.id, productIds),
        lte(products.quantity, 0)
      ));
  }
  return result;
}

export async function getUserOrders(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(Math.min(limit, 100)).offset(offset);
  // Include items for each order
  if (userOrders.length === 0) return [];
  const orderIds = userOrders.map(o => o.id);
  const allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
  const itemsByOrder = new Map<number, typeof allItems>();
  for (const item of allItems) {
    if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
    itemsByOrder.get(item.orderId)!.push(item);
  }
  return userOrders.map(o => ({ ...o, items: itemsByOrder.get(o.id) || [] }));
}

export async function getVendorOrders(vendorId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const vendorOrderList = await db.select().from(orders).where(eq(orders.vendorId, vendorId)).orderBy(desc(orders.createdAt)).limit(Math.min(limit, 100)).offset(offset);
  if (vendorOrderList.length === 0) return [];
  const orderIds = vendorOrderList.map(o => o.id);
  const allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
  const itemsByOrder = new Map<number, typeof allItems>();
  for (const item of allItems) {
    if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
    itemsByOrder.get(item.orderId)!.push(item);
  }
  return vendorOrderList.map(o => ({ ...o, items: itemsByOrder.get(o.id) || [] }));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function updateOrderStatus(id: number, status: string, statusHistory?: { status: string; at: string; by?: string }[]) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, any> = { status: status as any };
  if (statusHistory) updateData.statusHistory = statusHistory;
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function getAllOrders(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(Math.min(limit, 100)).offset(offset);
}

// Restore inventory when an order is cancelled
export async function restoreInventory(orderId: number) {
  const db = await getDb();
  if (!db) return;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    await db.update(products)
      .set({ quantity: sql`${products.quantity} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
    // Re-activate if it was out_of_stock
    await db.update(products)
      .set({ status: "active" })
      .where(and(eq(products.id, item.productId), eq(products.status, "out_of_stock")));
  }
}

// ─── Notification Helpers ───
export async function createNotification(data: { userId: number; title: string; message: string; type?: string; link?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data as any);
}

export async function getUserNotifications(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(Math.min(limit, 100)).offset(offset);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  // Only mark if owned by user
  await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}

// ─── Review Helpers ───
export async function createReview(data: { userId: number; vendorId: number; productId?: number; rating: number; comment?: string }) {
  const db = await getDb();
  if (!db) return;

  // Check if user has purchased from this vendor
  const userOrders = await db.select().from(orders).where(
    and(
      eq(orders.userId, data.userId),
      eq(orders.vendorId, data.vendorId),
      eq(orders.status, "delivered")
    )
  ).limit(1);
  if (userOrders.length === 0) {
    throw new Error("You can only review vendors you have purchased from");
  }

  // Check for duplicate review
  const existingReview = await db.select().from(reviews).where(
    and(
      eq(reviews.userId, data.userId),
      eq(reviews.vendorId, data.vendorId),
      data.productId ? eq(reviews.productId, data.productId) : sql`${reviews.productId} IS NULL`
    )
  ).limit(1);
  if (existingReview.length > 0) {
    throw new Error("You have already reviewed this vendor");
  }

  await db.insert(reviews).values(data);

  // Update vendor rating average
  const allReviews = await db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.vendorId, data.vendorId));
  if (allReviews.length > 0) {
    const avg = (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2);
    await db.update(vendors).set({ rating: avg }).where(eq(vendors.id, data.vendorId));
  }
}

export async function getVendorReviews(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  const vendorReviews = await db.select().from(reviews).where(eq(reviews.vendorId, vendorId)).orderBy(desc(reviews.createdAt));
  if (vendorReviews.length === 0) return [];
  // Include reviewer names
  const userIds = vendorReviews.map(r => r.userId);
  const reviewUsers = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds));
  const userMap = new Map(reviewUsers.map(u => [u.id, u.name]));
  return vendorReviews.map(r => ({ ...r, userName: userMap.get(r.userId) || "Anonymous" }));
}

// ─── Admin Stats ───
export async function getPublicStats() {
  const db = await getDb();
  if (!db) return { totalProducts: 0, totalVendors: 0, totalCategories: 0 };
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
  const [vendorCount] = await db.select({ count: sql<number>`count(*)` }).from(vendors).where(eq(vendors.status, "approved"));
  const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  return {
    totalProducts: Number(productCount?.count || 0),
    totalVendors: Number(vendorCount?.count || 0),
    totalCategories: Number(categoryCount?.count || 0),
  };
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalVendors: 0, totalProducts: 0, totalOrders: 0, totalUsers: 0, pendingVendors: 0, totalRevenue: "0" };
  const [vendorCount] = await db.select({ count: sql<number>`count(*)` }).from(vendors);
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(vendors).where(eq(vendors.status, "pending"));
  const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM("totalAmount"), 0)` }).from(orders);
  return {
    totalVendors: Number(vendorCount?.count || 0),
    totalProducts: Number(productCount?.count || 0),
    totalOrders: Number(orderCount?.count || 0),
    totalUsers: Number(userCount?.count || 0),
    pendingVendors: Number(pendingCount?.count || 0),
    totalRevenue: String(revenueResult?.total || "0"),
  };
}

// ─── Vendor Sales Tracking ───
export async function incrementVendorSales(vendorId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(vendors)
    .set({ totalSales: sql`${vendors.totalSales} + 1` })
    .where(eq(vendors.id, vendorId));
}

// ─── Inquiry Helpers ───
export async function createInquiry(data: {
  buyerId: number; vendorId: number; productId: number;
  message?: string; buyerPhone?: string; buyerName?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const [result] = await db.insert(inquiries).values(data).returning({ id: inquiries.id });
  return result;
}

export async function getVendorInquiries(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(inquiries)
    .where(eq(inquiries.vendorId, vendorId))
    .orderBy(desc(inquiries.createdAt));
  if (items.length === 0) return [];
  // Include product name and buyer name
  const productIds = Array.from(new Set(items.map(i => i.productId)));
  const buyerIds = Array.from(new Set(items.map(i => i.buyerId)));
  const prods = await db.select({ id: products.id, name: products.name, price: products.price, images: products.images })
    .from(products).where(inArray(products.id, productIds));
  const buyers = await db.select({ id: users.id, name: users.name, phone: users.phone })
    .from(users).where(inArray(users.id, buyerIds));
  const prodMap = new Map(prods.map(p => [p.id, p]));
  const buyerMap = new Map(buyers.map(b => [b.id, b]));
  return items.map(i => ({
    ...i,
    product: prodMap.get(i.productId),
    buyer: buyerMap.get(i.buyerId),
  }));
}

export async function getBuyerInquiries(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(inquiries)
    .where(eq(inquiries.buyerId, buyerId))
    .orderBy(desc(inquiries.createdAt));
  if (items.length === 0) return [];
  const productIds = Array.from(new Set(items.map(i => i.productId)));
  const prods = await db.select({ id: products.id, name: products.name, price: products.price, images: products.images })
    .from(products).where(inArray(products.id, productIds));
  const prodMap = new Map(prods.map(p => [p.id, p]));
  const vendorIds = Array.from(new Set(items.map(i => i.vendorId)));
  const vends = await db.select({ id: vendors.id, businessName: vendors.businessName })
    .from(vendors).where(inArray(vendors.id, vendorIds));
  const vendorMap = new Map(vends.map(v => [v.id, v]));
  return items.map(i => ({
    ...i,
    product: prodMap.get(i.productId),
    vendor: vendorMap.get(i.vendorId),
  }));
}

export async function updateInquiryStatus(id: number, vendorId: number, status: string, vendorNotes?: string) {
  const db = await getDb();
  if (!db) return;
  const [inquiry] = await db.select().from(inquiries)
    .where(and(eq(inquiries.id, id), eq(inquiries.vendorId, vendorId))).limit(1);
  if (!inquiry) throw new Error("Inquiry not found");
  const updateData: Record<string, any> = { status: status as any };
  if (vendorNotes !== undefined) updateData.vendorNotes = vendorNotes;
  await db.update(inquiries).set(updateData).where(eq(inquiries.id, id));
}
