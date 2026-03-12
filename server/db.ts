import { eq, and, like, desc, asc, sql, or, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, vendors, InsertVendor, products, InsertProduct,
  categories, cartItems, orders, orderItems, reviews, notifications,
  type Vendor, type Product, type Category, type Order
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

// ─── Vendor Helpers ───
export async function createVendor(data: InsertVendor) {
  const db = await getDb();
  if (!db) return;
  const [result] = await db.insert(vendors).values(data).$returningId();
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

export async function getAllVendors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendors).orderBy(desc(vendors.createdAt));
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
  const [result] = await db.insert(products).values(data).$returningId();
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
  await db.delete(products).where(eq(products.id, id));
}

export async function getVendorProducts(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.vendorId, vendorId)).orderBy(desc(products.createdAt));
}

export async function searchProducts(filters: {
  search?: string;
  categoryId?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  yearFrom?: number;
  yearTo?: number;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
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
        like(products.vehicleModel, `%${filters.search}%`)
      )!
    );
  }
  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters.vehicleMake) conditions.push(eq(products.vehicleMake, filters.vehicleMake));
  if (filters.vehicleModel) conditions.push(eq(products.vehicleModel, filters.vehicleModel));
  if (filters.condition) conditions.push(eq(products.condition, filters.condition as any));
  if (filters.minPrice) conditions.push(gte(products.price, String(filters.minPrice)));
  if (filters.maxPrice) conditions.push(lte(products.price, String(filters.maxPrice)));

  const where = and(...conditions);
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;

  const [items, countResult] = await Promise.all([
    db.select().from(products).where(where).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products).where(where),
  ]);

  return { products: items, total: Number(countResult[0]?.count || 0) };
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
  return items.map(item => ({ ...item, product: prodMap.get(item.productId) }));
}

export async function addToCart(userId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))).limit(1);
  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }
}

export async function updateCartItem(id: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
}

export async function removeCartItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.id, id));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Order Helpers ───
export async function createOrder(data: {
  orderNumber: string; userId: number; vendorId: number; totalAmount: string;
  shippingAddress?: string; shippingCity?: string; shippingRegion?: string;
  buyerPhone?: string; buyerName?: string; notes?: string;
  items: { productId: number; productName: string; quantity: number; unitPrice: string; totalPrice: string }[];
}) {
  const db = await getDb();
  if (!db) return;
  const { items, ...orderData } = data;
  const [result] = await db.insert(orders).values(orderData).$returningId();
  if (result && items.length > 0) {
    await db.insert(orderItems).values(items.map(item => ({ ...item, orderId: result.id })));
  }
  return result;
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getVendorOrders(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.vendorId, vendorId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status: status as any }).where(eq(orders.id, id));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

// ─── Notification Helpers ───
export async function createNotification(data: { userId: number; title: string; message: string; type?: string; link?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data as any);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
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
  await db.insert(reviews).values(data);
}

export async function getVendorReviews(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.vendorId, vendorId)).orderBy(desc(reviews.createdAt));
}

// ─── Admin Stats ───
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalVendors: 0, totalProducts: 0, totalOrders: 0, totalUsers: 0, pendingVendors: 0, totalRevenue: "0" };
  const [vendorCount] = await db.select({ count: sql<number>`count(*)` }).from(vendors);
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(vendors).where(eq(vendors.status, "pending"));
  const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(totalAmount), 0)` }).from(orders);
  return {
    totalVendors: Number(vendorCount?.count || 0),
    totalProducts: Number(productCount?.count || 0),
    totalOrders: Number(orderCount?.count || 0),
    totalUsers: Number(userCount?.count || 0),
    pendingVendors: Number(pendingCount?.count || 0),
    totalRevenue: String(revenueResult?.total || "0"),
  };
}
