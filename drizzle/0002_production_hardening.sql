-- Production hardening migration: payment fields, indexes, status history
-- New columns on orders table
ALTER TABLE `orders` ADD COLUMN `paymentMethod` enum('pay_on_delivery','bank_transfer','mobile_money') NOT NULL DEFAULT 'pay_on_delivery';
ALTER TABLE `orders` ADD COLUMN `paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid';
ALTER TABLE `orders` ADD COLUMN `statusHistory` json DEFAULT NULL;

-- Performance indexes for product search & filtering
CREATE INDEX `idx_products_status` ON `products` (`status`);
CREATE INDEX `idx_products_vendor` ON `products` (`vendorId`, `createdAt`);
CREATE INDEX `idx_products_category` ON `products` (`categoryId`);
CREATE INDEX `idx_products_featured` ON `products` (`status`, `featured`);
CREATE INDEX `idx_products_make_model` ON `products` (`vehicleMake`, `vehicleModel`);
CREATE INDEX `idx_products_price` ON `products` (`price`);

-- Order lookup indexes
CREATE INDEX `idx_orders_user` ON `orders` (`userId`, `createdAt`);
CREATE INDEX `idx_orders_vendor` ON `orders` (`vendorId`, `createdAt`);
CREATE INDEX `idx_orders_status` ON `orders` (`status`);

-- Order items lookup
CREATE INDEX `idx_order_items_order` ON `order_items` (`orderId`);

-- Cart lookup
CREATE INDEX `idx_cart_user` ON `cart_items` (`userId`);
CREATE INDEX `idx_cart_user_product` ON `cart_items` (`userId`, `productId`);

-- Notification lookup
CREATE INDEX `idx_notifications_user` ON `notifications` (`userId`, `createdAt`);

-- Vendor lookup
CREATE INDEX `idx_vendors_user` ON `vendors` (`userId`);
CREATE INDEX `idx_vendors_status` ON `vendors` (`status`);

-- Review lookup
CREATE INDEX `idx_reviews_vendor` ON `reviews` (`vendorId`);
CREATE INDEX `idx_reviews_user_vendor` ON `reviews` (`userId`, `vendorId`);
