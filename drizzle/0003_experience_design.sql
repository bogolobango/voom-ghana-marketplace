-- Add OEM Part Number to products
ALTER TABLE `products` ADD COLUMN `oemPartNumber` varchar(100);

-- Add index for OEM part number lookups
CREATE INDEX `products_oem_idx` ON `products` (`oemPartNumber`);

-- Update notification type enum to include inquiry
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('order','vendor','system','inventory','inquiry') NOT NULL DEFAULT 'system';

-- Create inquiries table
CREATE TABLE `inquiries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `buyerId` int NOT NULL,
  `vendorId` int NOT NULL,
  `productId` int NOT NULL,
  `message` text,
  `buyerPhone` varchar(20),
  `buyerName` varchar(255),
  `status` enum('pending','responded','sold','closed') NOT NULL DEFAULT 'pending',
  `vendorNotes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);

-- Add indexes for inquiry lookups
CREATE INDEX `inquiries_buyer_idx` ON `inquiries` (`buyerId`);
CREATE INDEX `inquiries_vendor_idx` ON `inquiries` (`vendorId`);
CREATE INDEX `inquiries_product_idx` ON `inquiries` (`productId`);
CREATE INDEX `inquiries_status_idx` ON `inquiries` (`status`);
