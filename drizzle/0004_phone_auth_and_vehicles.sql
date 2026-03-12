-- Add OTP fields to users for phone-based auth
ALTER TABLE `users` ADD COLUMN `otpCode` varchar(10);
ALTER TABLE `users` ADD COLUMN `otpExpiresAt` timestamp NULL;
ALTER TABLE `users` ADD COLUMN `isVerified` boolean NOT NULL DEFAULT false;

-- Add index for phone lookups
CREATE INDEX `users_phone_idx` ON `users` (`phone`);

-- Create vehicle_makes reference table
CREATE TABLE `vehicle_makes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(100) NOT NULL,
  CONSTRAINT `vehicle_makes_id` PRIMARY KEY(`id`),
  CONSTRAINT `vehicle_makes_name_unique` UNIQUE(`name`)
);

-- Create vehicle_models reference table
CREATE TABLE `vehicle_models` (
  `id` int AUTO_INCREMENT NOT NULL,
  `makeId` int NOT NULL,
  `name` varchar(100) NOT NULL,
  CONSTRAINT `vehicle_models_id` PRIMARY KEY(`id`)
);

CREATE INDEX `vehicle_models_make_idx` ON `vehicle_models` (`makeId`);

-- Seed vehicle makes
INSERT INTO `vehicle_makes` (`name`) VALUES
('Toyota'), ('Honda'), ('Hyundai'), ('Nissan'), ('Kia'),
('Mercedes-Benz'), ('BMW'), ('Volkswagen'), ('Ford'), ('Chevrolet'),
('Mazda'), ('Mitsubishi'), ('Suzuki'), ('Peugeot'), ('Renault'),
('Isuzu'), ('Land Rover'), ('Lexus'), ('Audi'), ('Subaru');

-- Seed vehicle models (using subqueries for make_id)
INSERT INTO `vehicle_models` (`makeId`, `name`) VALUES
-- Toyota
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'Corolla'),
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'Camry'),
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'RAV4'),
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'Hilux'),
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'Land Cruiser'),
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'Yaris'),
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'Prado'),
((SELECT id FROM vehicle_makes WHERE name='Toyota'), 'Fortuner'),
-- Honda
((SELECT id FROM vehicle_makes WHERE name='Honda'), 'Civic'),
((SELECT id FROM vehicle_makes WHERE name='Honda'), 'CR-V'),
((SELECT id FROM vehicle_makes WHERE name='Honda'), 'Accord'),
((SELECT id FROM vehicle_makes WHERE name='Honda'), 'Fit'),
((SELECT id FROM vehicle_makes WHERE name='Honda'), 'HR-V'),
-- Hyundai
((SELECT id FROM vehicle_makes WHERE name='Hyundai'), 'Tucson'),
((SELECT id FROM vehicle_makes WHERE name='Hyundai'), 'Elantra'),
((SELECT id FROM vehicle_makes WHERE name='Hyundai'), 'Sonata'),
((SELECT id FROM vehicle_makes WHERE name='Hyundai'), 'Santa Fe'),
((SELECT id FROM vehicle_makes WHERE name='Hyundai'), 'Accent'),
-- Nissan
((SELECT id FROM vehicle_makes WHERE name='Nissan'), 'Almera'),
((SELECT id FROM vehicle_makes WHERE name='Nissan'), 'X-Trail'),
((SELECT id FROM vehicle_makes WHERE name='Nissan'), 'Pathfinder'),
((SELECT id FROM vehicle_makes WHERE name='Nissan'), 'Navara'),
((SELECT id FROM vehicle_makes WHERE name='Nissan'), 'Note'),
-- Kia
((SELECT id FROM vehicle_makes WHERE name='Kia'), 'Sportage'),
((SELECT id FROM vehicle_makes WHERE name='Kia'), 'Rio'),
((SELECT id FROM vehicle_makes WHERE name='Kia'), 'Sorento'),
((SELECT id FROM vehicle_makes WHERE name='Kia'), 'Picanto'),
-- Mercedes-Benz
((SELECT id FROM vehicle_makes WHERE name='Mercedes-Benz'), 'C-Class'),
((SELECT id FROM vehicle_makes WHERE name='Mercedes-Benz'), 'E-Class'),
((SELECT id FROM vehicle_makes WHERE name='Mercedes-Benz'), 'GLC'),
((SELECT id FROM vehicle_makes WHERE name='Mercedes-Benz'), 'Sprinter'),
-- BMW
((SELECT id FROM vehicle_makes WHERE name='BMW'), '3 Series'),
((SELECT id FROM vehicle_makes WHERE name='BMW'), '5 Series'),
((SELECT id FROM vehicle_makes WHERE name='BMW'), 'X3'),
((SELECT id FROM vehicle_makes WHERE name='BMW'), 'X5'),
-- Volkswagen
((SELECT id FROM vehicle_makes WHERE name='Volkswagen'), 'Golf'),
((SELECT id FROM vehicle_makes WHERE name='Volkswagen'), 'Passat'),
((SELECT id FROM vehicle_makes WHERE name='Volkswagen'), 'Tiguan'),
((SELECT id FROM vehicle_makes WHERE name='Volkswagen'), 'Polo'),
-- Ford
((SELECT id FROM vehicle_makes WHERE name='Ford'), 'Ranger'),
((SELECT id FROM vehicle_makes WHERE name='Ford'), 'Focus'),
((SELECT id FROM vehicle_makes WHERE name='Ford'), 'Escape'),
((SELECT id FROM vehicle_makes WHERE name='Ford'), 'EcoSport'),
-- Chevrolet
((SELECT id FROM vehicle_makes WHERE name='Chevrolet'), 'Spark'),
((SELECT id FROM vehicle_makes WHERE name='Chevrolet'), 'Cruze'),
((SELECT id FROM vehicle_makes WHERE name='Chevrolet'), 'Equinox'),
-- Mazda
((SELECT id FROM vehicle_makes WHERE name='Mazda'), 'Mazda3'),
((SELECT id FROM vehicle_makes WHERE name='Mazda'), 'CX-5'),
((SELECT id FROM vehicle_makes WHERE name='Mazda'), 'CX-3'),
-- Mitsubishi
((SELECT id FROM vehicle_makes WHERE name='Mitsubishi'), 'L200'),
((SELECT id FROM vehicle_makes WHERE name='Mitsubishi'), 'Outlander'),
((SELECT id FROM vehicle_makes WHERE name='Mitsubishi'), 'Pajero'),
-- Suzuki
((SELECT id FROM vehicle_makes WHERE name='Suzuki'), 'Swift'),
((SELECT id FROM vehicle_makes WHERE name='Suzuki'), 'Vitara'),
((SELECT id FROM vehicle_makes WHERE name='Suzuki'), 'Alto'),
-- Peugeot
((SELECT id FROM vehicle_makes WHERE name='Peugeot'), '308'),
((SELECT id FROM vehicle_makes WHERE name='Peugeot'), '508'),
((SELECT id FROM vehicle_makes WHERE name='Peugeot'), '3008'),
-- Renault
((SELECT id FROM vehicle_makes WHERE name='Renault'), 'Duster'),
((SELECT id FROM vehicle_makes WHERE name='Renault'), 'Kwid'),
((SELECT id FROM vehicle_makes WHERE name='Renault'), 'Clio'),
-- Isuzu
((SELECT id FROM vehicle_makes WHERE name='Isuzu'), 'D-Max'),
((SELECT id FROM vehicle_makes WHERE name='Isuzu'), 'MU-X'),
-- Land Rover
((SELECT id FROM vehicle_makes WHERE name='Land Rover'), 'Discovery'),
((SELECT id FROM vehicle_makes WHERE name='Land Rover'), 'Defender'),
((SELECT id FROM vehicle_makes WHERE name='Land Rover'), 'Range Rover'),
-- Lexus
((SELECT id FROM vehicle_makes WHERE name='Lexus'), 'RX'),
((SELECT id FROM vehicle_makes WHERE name='Lexus'), 'ES'),
((SELECT id FROM vehicle_makes WHERE name='Lexus'), 'NX'),
-- Audi
((SELECT id FROM vehicle_makes WHERE name='Audi'), 'A4'),
((SELECT id FROM vehicle_makes WHERE name='Audi'), 'Q5'),
((SELECT id FROM vehicle_makes WHERE name='Audi'), 'A3'),
-- Subaru
((SELECT id FROM vehicle_makes WHERE name='Subaru'), 'Forester'),
((SELECT id FROM vehicle_makes WHERE name='Subaru'), 'Outback'),
((SELECT id FROM vehicle_makes WHERE name='Subaru'), 'Impreza');
