import { serial, pgTable, pgEnum, text, timestamp, varchar, decimal, boolean, json, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin", "vendor"]);
export const vendorStatusEnum = pgEnum("vendor_status", ["pending", "approved", "rejected", "suspended"]);
export const conditionEnum = pgEnum("condition", ["new", "used", "refurbished"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive", "out_of_stock"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["pay_on_delivery", "bank_transfer", "mobile_money"]);
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "refunded"]);
export const notificationTypeEnum = pgEnum("notification_type", ["order", "vendor", "system", "inventory", "inquiry"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", ["pending", "responded", "sold", "closed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  otpCode: varchar("otpCode", { length: 10 }),
  otpExpiresAt: timestamp("otpExpiresAt"),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  description: text("description"),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  ghanaCardNumber: varchar("ghanaCardNumber", { length: 30 }),
  ghanaCardImageUrl: text("ghanaCardImageUrl"),
  businessRegNumber: varchar("businessRegNumber", { length: 50 }),
  businessRegImageUrl: text("businessRegImageUrl"),
  logoUrl: text("logoUrl"),
  coverUrl: text("coverUrl"),
  status: vendorStatusEnum("status").default("pending").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalSales: integer("totalSales").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
  parentId: integer("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

export const vehicleMakes = pgTable("vehicle_makes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export type VehicleMake = typeof vehicleMakes.$inferSelect;

export const vehicleModels = pgTable("vehicle_models", {
  id: serial("id").primaryKey(),
  makeId: integer("makeId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
});

export type VehicleModel = typeof vehicleModels.$inferSelect;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendorId").notNull(),
  categoryId: integer("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  sku: varchar("sku", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  condition: conditionEnum("condition").default("new").notNull(),
  // Vehicle compatibility
  vehicleMake: varchar("vehicleMake", { length: 100 }),
  vehicleModel: varchar("vehicleModel", { length: 100 }),
  yearFrom: integer("yearFrom"),
  yearTo: integer("yearTo"),
  oemPartNumber: varchar("oemPartNumber", { length: 100 }),
  // Inventory
  quantity: integer("quantity").default(0).notNull(),
  minOrderQty: integer("minOrderQty").default(1),
  // Media
  images: json("images").$type<string[]>(),
  // Status
  status: productStatusEnum("status").default("active").notNull(),
  featured: boolean("featured").default(false),
  views: integer("views").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 20 }).notNull().unique(),
  userId: integer("userId").notNull(),
  vendorId: integer("vendorId").notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentMethod: paymentMethodEnum("paymentMethod").default("pay_on_delivery").notNull(),
  paymentStatus: paymentStatusEnum("paymentStatus").default("unpaid").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  shippingAddress: text("shippingAddress"),
  shippingCity: varchar("shippingCity", { length: 100 }),
  shippingRegion: varchar("shippingRegion", { length: 100 }),
  buyerPhone: varchar("buyerPhone", { length: 20 }),
  buyerName: varchar("buyerName", { length: 255 }),
  notes: text("notes"),
  statusHistory: json("statusHistory").$type<{ status: string; at: string; by?: string }[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  vendorId: integer("vendorId").notNull(),
  productId: integer("productId"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").default("system").notNull(),
  read: boolean("read").default(false).notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyerId").notNull(),
  vendorId: integer("vendorId").notNull(),
  productId: integer("productId").notNull(),
  message: text("message"),
  buyerPhone: varchar("buyerPhone", { length: 20 }),
  buyerName: varchar("buyerName", { length: 255 }),
  status: inquiryStatusEnum("status").default("pending").notNull(),
  vendorNotes: text("vendorNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
