-- Voom Ghana Marketplace — Seed Data
-- Run: psql $DATABASE_URL < data/voom_seed.sql

BEGIN;

-- ─── Enums (create if not exist) ───
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'vendor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_condition AS ENUM ('new', 'used', 'refurbished');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('order', 'vendor', 'system', 'inventory');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tables (create if not exist) ───
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  phone VARCHAR(20),
  "loginMethod" VARCHAR(64),
  "passwordHash" TEXT,
  role user_role NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "businessName" VARCHAR(255) NOT NULL,
  description TEXT,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(320),
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  "logoUrl" TEXT,
  "coverUrl" TEXT,
  status vendor_status NOT NULL DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0,
  "totalSales" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  "parentId" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  "vendorId" INTEGER NOT NULL,
  "categoryId" INTEGER,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
  sku VARCHAR(100),
  brand VARCHAR(100),
  condition product_condition NOT NULL DEFAULT 'new',
  "vehicleMake" VARCHAR(100),
  "vehicleModel" VARCHAR(100),
  "yearFrom" INTEGER,
  "yearTo" INTEGER,
  quantity INTEGER NOT NULL DEFAULT 0,
  "minOrderQty" INTEGER DEFAULT 1,
  images JSON,
  status product_status NOT NULL DEFAULT 'active',
  featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(20) NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  "vendorId" INTEGER NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  "totalAmount" DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  "shippingAddress" TEXT,
  "shippingCity" VARCHAR(100),
  "shippingRegion" VARCHAR(100),
  "buyerPhone" VARCHAR(20),
  "buyerName" VARCHAR(255),
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "productName" VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "totalPrice" DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "vendorId" INTEGER NOT NULL,
  "productId" INTEGER,
  rating INTEGER NOT NULL,
  comment TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(500),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Categories ───
INSERT INTO categories (name, slug, icon) VALUES
  ('Engine Parts',      'engine-parts',    'Cog'),
  ('Brake System',      'brake-system',    'CircleStop'),
  ('Suspension',        'suspension',      'ArrowUpDown'),
  ('Electrical',        'electrical',      'Zap'),
  ('Body Parts',        'body-parts',      'Car'),
  ('Transmission',      'transmission',    'Settings'),
  ('Exhaust System',    'exhaust-system',  'Wind'),
  ('Cooling System',    'cooling-system',  'Thermometer'),
  ('Filters & Fluids',  'filters-fluids',  'Droplets'),
  ('Lighting',          'lighting',        'Lightbulb'),
  ('Tires & Wheels',    'tires-wheels',    'Circle'),
  ('Interior',          'interior',        'Armchair')
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed Users (vendors) ───
INSERT INTO users ("openId", name, email, phone, role, "loginMethod") VALUES
  ('vendor_kwame_001',   'Kwame Asante',     'kwame@autopartsgh.com',    '0241234567', 'vendor', 'phone'),
  ('vendor_ama_002',     'Ama Mensah',       'ama@brakemastersgh.com',   '0551234567', 'vendor', 'phone'),
  ('vendor_kofi_003',    'Kofi Boateng',     'kofi@suspensionpro.com',   '0201234567', 'vendor', 'phone'),
  ('vendor_abena_004',   'Abena Osei',       'abena@electricalauto.com', '0271234567', 'vendor', 'phone'),
  ('vendor_yaw_005',     'Yaw Darko',        'yaw@bodyworksgh.com',      '0541234567', 'vendor', 'phone'),
  ('vendor_efua_006',    'Efua Appiah',      'efua@transpartsgh.com',    '0261234567', 'vendor', 'phone'),
  ('vendor_kojo_007',    'Kojo Antwi',       'kojo@exhaustpro.com',      '0501234567', 'vendor', 'phone'),
  ('vendor_akosua_008',  'Akosua Frimpong',  'akosua@coolsysgh.com',     '0231234567', 'vendor', 'phone')
ON CONFLICT ("openId") DO NOTHING;

-- ─── Vendors ───
INSERT INTO vendors ("userId", "businessName", description, phone, whatsapp, email, address, city, region, status, rating, "totalSales") VALUES
  ((SELECT id FROM users WHERE "openId"='vendor_kwame_001'),
   'Kwame Auto Parts', 'Premium engine parts and accessories. Over 15 years experience in the auto parts industry. We stock OEM and aftermarket parts for all major vehicle brands.',
   '0241234567', '0241234567', 'kwame@autopartsgh.com', 'Shop 14, Abossey Okai Spare Parts Market', 'Accra', 'Greater Accra', 'approved', 4.80, 342),

  ((SELECT id FROM users WHERE "openId"='vendor_ama_002'),
   'Brake Masters Ghana', 'Specialists in brake systems — pads, rotors, calipers, and fluid. We carry Brembo, Bosch, TRW and genuine OEM brake parts.',
   '0551234567', '0551234567', 'ama@brakemastersgh.com', 'Block B, Suame Magazine', 'Kumasi', 'Ashanti', 'approved', 4.65, 218),

  ((SELECT id FROM users WHERE "openId"='vendor_kofi_003'),
   'Suspension Pro GH', 'Complete suspension solutions — shocks, struts, control arms, bushings. Authorised dealer for Monroe, KYB, and Bilstein.',
   '0201234567', '0201234567', 'kofi@suspensionpro.com', '23 Kokomlemle Industrial Area', 'Accra', 'Greater Accra', 'approved', 4.50, 156),

  ((SELECT id FROM users WHERE "openId"='vendor_abena_004'),
   'Electrical Auto Parts', 'Alternators, starters, batteries, sensors, and wiring. We diagnose and supply the right electrical component for your vehicle.',
   '0271234567', '0271234567', 'abena@electricalauto.com', 'Kaneshie Market Extension', 'Accra', 'Greater Accra', 'approved', 4.70, 189),

  ((SELECT id FROM users WHERE "openId"='vendor_yaw_005'),
   'Bodyworks Ghana', 'Fenders, bumpers, hoods, mirrors, and side panels. New and refurbished body panels for all popular models in Ghana.',
   '0541234567', '0541234567', 'yaw@bodyworksgh.com', 'Tema Industrial Area', 'Tema', 'Greater Accra', 'approved', 4.40, 127),

  ((SELECT id FROM users WHERE "openId"='vendor_efua_006'),
   'TransParts GH', 'Transmission and drivetrain specialists. Manual and automatic gearbox parts, clutches, CV joints, and driveshafts.',
   '0261234567', '0261234567', 'efua@transpartsgh.com', 'Abossey Okai Road', 'Accra', 'Greater Accra', 'approved', 4.55, 98),

  ((SELECT id FROM users WHERE "openId"='vendor_kojo_007'),
   'Exhaust Pro', 'Exhaust systems, catalytic converters, mufflers, and exhaust manifolds. Custom fabrication available.',
   '0501234567', '0501234567', 'kojo@exhaustpro.com', 'Suame Magazine Industrial', 'Kumasi', 'Ashanti', 'approved', 4.35, 76),

  ((SELECT id FROM users WHERE "openId"='vendor_akosua_008'),
   'CoolSys Auto', 'Radiators, water pumps, thermostats, coolant hoses, and AC compressors. Keep your engine running cool on Ghana roads.',
   '0231234567', '0231234567', 'akosua@coolsysgh.com', 'Darkuman Junction', 'Accra', 'Greater Accra', 'approved', 4.60, 143);

-- ─── Products ───
-- Engine Parts (vendor 1 — Kwame Auto Parts)
INSERT INTO products ("vendorId", "categoryId", name, description, price, brand, condition, "vehicleMake", "vehicleModel", "yearFrom", "yearTo", quantity, sku, featured, images) VALUES
((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='engine-parts'),
 'Toyota 2NR-FE Engine Block', 'Complete engine block for Toyota Corolla / Yaris. Direct OEM replacement, fully machined and ready to install.', 8500.00, 'Toyota', 'new', 'Toyota', 'Corolla', 2014, 2024, 5, 'KAP-ENG-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='engine-parts'),
 'Hyundai G4FC Timing Chain Kit', 'Complete timing chain kit includes chain, tensioner, guides, and gaskets. Fits Hyundai Accent, Kia Rio.', 650.00, 'Hyundai', 'new', 'Hyundai', 'Accent', 2011, 2023, 20, 'KAP-ENG-002', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='engine-parts'),
 'Nissan QR25DE Piston Set (4pc)', 'Forged piston set for Nissan X-Trail / Altima. Standard bore size with rings included.', 1200.00, 'Nissan', 'new', 'Nissan', 'X-Trail', 2007, 2020, 12, 'KAP-ENG-003', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='engine-parts'),
 'Honda K24A Cylinder Head (Refurbished)', 'Professionally reconditioned cylinder head for Honda CR-V / Accord. Pressure tested and skimmed.', 3200.00, 'Honda', 'refurbished', 'Honda', 'CR-V', 2007, 2018, 3, 'KAP-ENG-004', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='engine-parts'),
 'Mercedes M271 Turbocharger', 'Genuine BorgWarner turbo for Mercedes C180/C200 W204. Includes gasket kit and oil feed line.', 5800.00, 'BorgWarner', 'new', 'Mercedes-Benz', 'C-Class', 2010, 2018, 4, 'KAP-ENG-005', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='engine-parts'),
 'Toyota 1KD-FTV Injector Set (4pc)', 'Denso diesel injectors for Toyota Hilux / Land Cruiser Prado. Remanufactured to OEM spec.', 4200.00, 'Denso', 'refurbished', 'Toyota', 'Hilux', 2005, 2015, 8, 'KAP-ENG-006', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='engine-parts'),
 'VW/Audi EA888 Oil Pump', 'Oil pump assembly for VW Golf / Audi A3 2.0 TSI. Direct replacement with seal kit.', 890.00, 'Volkswagen', 'new', 'Volkswagen', 'Golf', 2012, 2024, 15, 'KAP-ENG-007', false, '[]'),

-- Brake System (vendor 2 — Brake Masters Ghana)
((SELECT id FROM vendors WHERE "businessName"='Brake Masters Ghana'),
 (SELECT id FROM categories WHERE slug='brake-system'),
 'Brembo Front Brake Pad Set — Toyota Corolla', 'High-performance Brembo ceramic brake pads. Low dust, excellent stopping power. Fits 2014-2024 Corolla.', 280.00, 'Brembo', 'new', 'Toyota', 'Corolla', 2014, 2024, 50, 'BMG-BRK-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Brake Masters Ghana'),
 (SELECT id FROM categories WHERE slug='brake-system'),
 'Bosch Front Brake Disc Set (Pair) — Hyundai Tucson', 'Ventilated front brake discs. OEM quality, rust-resistant coating. 300mm diameter.', 520.00, 'Bosch', 'new', 'Hyundai', 'Tucson', 2015, 2024, 25, 'BMG-BRK-002', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Brake Masters Ghana'),
 (SELECT id FROM categories WHERE slug='brake-system'),
 'TRW Rear Brake Caliper — Honda CR-V', 'Remanufactured rear caliper with bracket. Left side. Includes bleeder valve and dust boot.', 450.00, 'TRW', 'refurbished', 'Honda', 'CR-V', 2012, 2022, 10, 'BMG-BRK-003', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Brake Masters Ghana'),
 (SELECT id FROM categories WHERE slug='brake-system'),
 'Brake Master Cylinder — Nissan Almera', 'Complete master cylinder with reservoir. Direct bolt-on replacement.', 380.00, 'Nissan', 'new', 'Nissan', 'Almera', 2010, 2020, 8, 'BMG-BRK-004', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Brake Masters Ghana'),
 (SELECT id FROM categories WHERE slug='brake-system'),
 'Ferodo Rear Brake Shoe Set — Toyota Hilux', 'Heavy-duty brake shoes for rear drum brakes. Perfect for Hilux work trucks.', 195.00, 'Ferodo', 'new', 'Toyota', 'Hilux', 2005, 2024, 35, 'BMG-BRK-005', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Brake Masters Ghana'),
 (SELECT id FROM categories WHERE slug='brake-system'),
 'ABS Wheel Speed Sensor — Kia Sportage', 'Front left ABS sensor. Plug-and-play replacement, no splicing needed.', 165.00, 'Kia', 'new', 'Kia', 'Sportage', 2010, 2023, 18, 'BMG-BRK-006', false, '[]'),

-- Suspension (vendor 3 — Suspension Pro GH)
((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='suspension'),
 'Monroe Front Shock Absorber (Pair) — Toyota RAV4', 'Monroe OESpectrum front shocks. Restores factory ride quality. Includes dust boots and bump stops.', 750.00, 'Monroe', 'new', 'Toyota', 'RAV4', 2013, 2024, 20, 'SPG-SUS-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='suspension'),
 'KYB Rear Shock Absorber — Hyundai Accent', 'KYB Excel-G gas shock. Restores control and stability. OEM replacement quality.', 320.00, 'KYB', 'new', 'Hyundai', 'Accent', 2011, 2023, 30, 'SPG-SUS-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='suspension'),
 'Front Lower Control Arm — Honda Civic', 'Complete control arm with ball joint and bushings pre-installed. Left side.', 480.00, 'Honda', 'new', 'Honda', 'Civic', 2012, 2022, 12, 'SPG-SUS-003', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='suspension'),
 'Bilstein B6 Performance Shock — Mercedes C-Class', 'Heavy-duty monotube shock for improved handling. Front position, W205 chassis.', 1100.00, 'Bilstein', 'new', 'Mercedes-Benz', 'C-Class', 2015, 2022, 6, 'SPG-SUS-004', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='suspension'),
 'Coil Spring Set (Pair) — Nissan Pathfinder', 'Heavy-duty front coil springs. Maintains ride height under load. OEM spec.', 560.00, 'Nissan', 'new', 'Nissan', 'Pathfinder', 2013, 2024, 10, 'SPG-SUS-005', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='suspension'),
 'Stabilizer Link Set — VW Polo', 'Front anti-roll bar drop links (pair). Eliminates knocking over bumps.', 180.00, 'Volkswagen', 'new', 'Volkswagen', 'Polo', 2009, 2024, 25, 'SPG-SUS-006', false, '[]'),

-- Electrical (vendor 4 — Electrical Auto Parts)
((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='electrical'),
 'Bosch Alternator — Toyota Hilux 2.5D', '90A Bosch alternator. Direct OEM replacement with pulley included.', 1450.00, 'Bosch', 'new', 'Toyota', 'Hilux', 2005, 2015, 8, 'EAP-ELC-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='electrical'),
 'Denso Starter Motor — Honda Accord', '1.2kW starter motor. Fits 2.0L and 2.4L engines. Plug-and-play installation.', 980.00, 'Denso', 'new', 'Honda', 'Accord', 2008, 2020, 10, 'EAP-ELC-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='electrical'),
 'Varta AGM Battery 70Ah', 'Premium AGM battery for start-stop vehicles. 760A cold crank. 3-year warranty.', 850.00, 'Varta', 'new', 'Universal', 'Universal', 2010, 2026, 30, 'EAP-ELC-003', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='electrical'),
 'Camshaft Position Sensor — Kia Cerato', 'OEM-spec camshaft sensor. Eliminates engine stalling and rough idle.', 145.00, 'Kia', 'new', 'Kia', 'Cerato', 2013, 2023, 22, 'EAP-ELC-004', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='electrical'),
 'Ignition Coil Pack — Hyundai Elantra', 'Direct ignition coil. Restores smooth engine performance and fuel efficiency.', 120.00, 'Hyundai', 'new', 'Hyundai', 'Elantra', 2011, 2023, 40, 'EAP-ELC-005', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='electrical'),
 'Oxygen Sensor (Lambda) — Nissan Note', 'Pre-cat oxygen sensor. Fixes check engine light P0131/P0135 codes.', 210.00, 'Nissan', 'new', 'Nissan', 'Note', 2012, 2022, 15, 'EAP-ELC-006', false, '[]'),

-- Body Parts (vendor 5 — Bodyworks Ghana)
((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='body-parts'),
 'Front Bumper — Toyota Corolla 2020+', 'Primed front bumper cover. Ready for paint. Includes fog light holes. OEM-fit quality.', 950.00, 'Toyota', 'new', 'Toyota', 'Corolla', 2020, 2024, 6, 'BWG-BDY-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='body-parts'),
 'Front Fender — Hyundai Tucson (Right)', 'Steel fender panel, primed. Direct bolt-on replacement for right side.', 680.00, 'Hyundai', 'new', 'Hyundai', 'Tucson', 2015, 2021, 4, 'BWG-BDY-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='body-parts'),
 'Side Mirror Assembly — Honda CR-V (Left)', 'Power-folding, heated, with turn signal. Complete unit with motor and glass.', 520.00, 'Honda', 'new', 'Honda', 'CR-V', 2017, 2024, 8, 'BWG-BDY-003', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='body-parts'),
 'Bonnet / Hood — Nissan Almera', 'Steel bonnet panel, e-coated and primed. Perfect fit guaranteed.', 780.00, 'Nissan', 'new', 'Nissan', 'Almera', 2012, 2022, 3, 'BWG-BDY-004', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='body-parts'),
 'Rear Bumper — Mercedes C-Class W205', 'AMG-style rear bumper with diffuser cutout. Primed, ready for paint.', 1800.00, 'Mercedes-Benz', 'new', 'Mercedes-Benz', 'C-Class', 2015, 2021, 2, 'BWG-BDY-005', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='body-parts'),
 'Tailgate — Toyota Hilux (Used)', 'Clean used tailgate from low-mileage Hilux. Minor scratches, structurally perfect.', 1200.00, 'Toyota', 'used', 'Toyota', 'Hilux', 2015, 2024, 2, 'BWG-BDY-006', false, '[]'),

-- Transmission (vendor 6 — TransParts GH)
((SELECT id FROM vendors WHERE "businessName"='TransParts GH'),
 (SELECT id FROM categories WHERE slug='transmission'),
 'Clutch Kit 3-Piece — Toyota Hilux 2.5D', 'Complete clutch kit: disc, pressure plate, release bearing. Valeo quality.', 1650.00, 'Valeo', 'new', 'Toyota', 'Hilux', 2005, 2015, 10, 'TPG-TRN-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='TransParts GH'),
 (SELECT id FROM categories WHERE slug='transmission'),
 'CV Joint (Outer) — Honda Civic', 'Outer CV joint with boot kit and grease. Eliminates clicking noise on turns.', 350.00, 'Honda', 'new', 'Honda', 'Civic', 2012, 2022, 16, 'TPG-TRN-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='TransParts GH'),
 (SELECT id FROM categories WHERE slug='transmission'),
 'Automatic Gearbox Filter Kit — Hyundai Santa Fe', 'Transmission filter with gasket and 7L ATF fluid. Complete service kit.', 420.00, 'Hyundai', 'new', 'Hyundai', 'Santa Fe', 2013, 2023, 12, 'TPG-TRN-003', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='TransParts GH'),
 (SELECT id FROM categories WHERE slug='transmission'),
 'Driveshaft Centre Bearing — Nissan Navara', 'Centre support bearing with rubber mount. Eliminates vibration at highway speed.', 280.00, 'Nissan', 'new', 'Nissan', 'Navara', 2010, 2024, 8, 'TPG-TRN-004', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='TransParts GH'),
 (SELECT id FROM categories WHERE slug='transmission'),
 'Flywheel (Dual Mass) — VW Golf 1.4 TSI', 'LuK dual mass flywheel. OEM replacement for DSG and manual gearbox.', 2200.00, 'LuK', 'new', 'Volkswagen', 'Golf', 2012, 2020, 4, 'TPG-TRN-005', true, '[]'),

-- Exhaust System (vendor 7 — Exhaust Pro)
((SELECT id FROM vendors WHERE "businessName"='Exhaust Pro'),
 (SELECT id FROM categories WHERE slug='exhaust-system'),
 'Catalytic Converter — Toyota Corolla 1.8', 'Euro 4 compliant catalytic converter. Direct-fit with flanges and gaskets.', 2800.00, 'Toyota', 'new', 'Toyota', 'Corolla', 2014, 2024, 5, 'EXP-EXH-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Exhaust Pro'),
 (SELECT id FROM categories WHERE slug='exhaust-system'),
 'Exhaust Muffler — Hyundai Accent', 'Rear silencer/muffler. Stainless steel construction, factory-fit pipe diameter.', 480.00, 'Hyundai', 'new', 'Hyundai', 'Accent', 2011, 2023, 12, 'EXP-EXH-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Exhaust Pro'),
 (SELECT id FROM categories WHERE slug='exhaust-system'),
 'Exhaust Manifold — Nissan X-Trail 2.5', 'Cast iron exhaust manifold with gasket set. Replaces cracked/leaking manifold.', 1100.00, 'Nissan', 'new', 'Nissan', 'X-Trail', 2007, 2020, 4, 'EXP-EXH-003', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Exhaust Pro'),
 (SELECT id FROM categories WHERE slug='exhaust-system'),
 'Flex Pipe / Flexi Joint 50mm', 'Universal stainless steel flex pipe. 50mm inner diameter × 250mm length. Absorbs engine vibration.', 85.00, 'Universal', 'new', 'Universal', 'Universal', 2000, 2026, 50, 'EXP-EXH-004', false, '[]'),

-- Cooling System (vendor 8 — CoolSys Auto)
((SELECT id FROM vendors WHERE "businessName"='CoolSys Auto'),
 (SELECT id FROM categories WHERE slug='cooling-system'),
 'Radiator — Toyota Hilux 2.7 VVTi', 'Aluminium core radiator with plastic tanks. Direct OEM replacement. Includes drain plug.', 950.00, 'Toyota', 'new', 'Toyota', 'Hilux', 2005, 2015, 8, 'CSA-COL-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='CoolSys Auto'),
 (SELECT id FROM categories WHERE slug='cooling-system'),
 'Water Pump — Hyundai Tucson 2.0', 'GMB water pump with gasket. Metal impeller for superior flow and durability.', 320.00, 'GMB', 'new', 'Hyundai', 'Tucson', 2015, 2024, 15, 'CSA-COL-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='CoolSys Auto'),
 (SELECT id FROM categories WHERE slug='cooling-system'),
 'Thermostat Assembly — Honda Accord', 'Complete thermostat housing with sensor and gasket. Opens at 82°C.', 185.00, 'Honda', 'new', 'Honda', 'Accord', 2008, 2020, 20, 'CSA-COL-003', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='CoolSys Auto'),
 (SELECT id FROM categories WHERE slug='cooling-system'),
 'AC Compressor — Kia Sportage', 'Remanufactured AC compressor with clutch. Charged with correct oil amount. 1-year warranty.', 1400.00, 'Kia', 'refurbished', 'Kia', 'Sportage', 2010, 2023, 5, 'CSA-COL-004', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='CoolSys Auto'),
 (SELECT id FROM categories WHERE slug='cooling-system'),
 'Radiator Fan Motor — Nissan Almera', 'Electric fan motor with shroud. Replacement for overheating issues at idle.', 450.00, 'Nissan', 'new', 'Nissan', 'Almera', 2012, 2022, 10, 'CSA-COL-005', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='CoolSys Auto'),
 (SELECT id FROM categories WHERE slug='cooling-system'),
 'Coolant Expansion Tank — Mercedes C-Class', 'Expansion tank with cap and level sensor. Fixes coolant leak warnings.', 280.00, 'Mercedes-Benz', 'new', 'Mercedes-Benz', 'C-Class', 2008, 2020, 12, 'CSA-COL-006', false, '[]'),

-- Filters & Fluids (spread across vendors)
((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='filters-fluids'),
 'Mobil 1 5W-30 Fully Synthetic (5L)', 'Premium fully synthetic engine oil. Meets API SP, ILSAC GF-6A. Suitable for all modern petrol engines.', 320.00, 'Mobil', 'new', 'Universal', 'Universal', 2000, 2026, 60, 'KAP-FLT-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Kwame Auto Parts'),
 (SELECT id FROM categories WHERE slug='filters-fluids'),
 'Mann Oil Filter — Toyota Corolla/Camry', 'Premium oil filter with anti-drainback valve. OEM equivalent quality.', 45.00, 'Mann', 'new', 'Toyota', 'Corolla', 2009, 2024, 100, 'KAP-FLT-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Brake Masters Ghana'),
 (SELECT id FROM categories WHERE slug='filters-fluids'),
 'DOT 4 Brake Fluid (1L) — Bosch', 'High-performance brake fluid. 260°C dry boiling point. Suitable for ABS systems.', 55.00, 'Bosch', 'new', 'Universal', 'Universal', 2000, 2026, 80, 'BMG-FLT-001', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='CoolSys Auto'),
 (SELECT id FROM categories WHERE slug='filters-fluids'),
 'Antifreeze/Coolant Concentrate (4L)', 'Long-life OAT coolant. Mix 50/50 with water. Protects to -37°C. Compatible with all metals.', 120.00, 'Prestone', 'new', 'Universal', 'Universal', 2000, 2026, 40, 'CSA-FLT-001', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='TransParts GH'),
 (SELECT id FROM categories WHERE slug='filters-fluids'),
 'ATF Automatic Transmission Fluid (4L)', 'Multi-vehicle ATF. Compatible with Dexron III/VI, Mercon V, Toyota WS. Smooth shifting guaranteed.', 180.00, 'Valvoline', 'new', 'Universal', 'Universal', 2000, 2026, 25, 'TPG-FLT-001', false, '[]'),

-- Lighting
((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='lighting'),
 'Headlight Assembly (Right) — Toyota Corolla 2020+', 'LED headlight with DRL. Plug-and-play, no modification needed. DOT/SAE compliant.', 1200.00, 'Toyota', 'new', 'Toyota', 'Corolla', 2020, 2024, 6, 'EAP-LGT-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='lighting'),
 'Philips H7 LED Bulb Kit (Pair)', 'Philips Ultinon Pro9000 LED. 250% brighter than halogen. 5800K white. Universal fit.', 380.00, 'Philips', 'new', 'Universal', 'Universal', 2000, 2026, 30, 'EAP-LGT-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='lighting'),
 'Tail Light Assembly — Hyundai Tucson (Left)', 'OEM-style tail light. Complete unit with bulbs and wiring harness.', 420.00, 'Hyundai', 'new', 'Hyundai', 'Tucson', 2015, 2021, 5, 'BWG-LGT-001', false, '[]'),

-- Tires & Wheels
((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='tires-wheels'),
 'Michelin Primacy 4 — 205/55R16', 'Premium touring tyre. Excellent wet grip and long tread life. Single tyre.', 680.00, 'Michelin', 'new', 'Universal', 'Universal', 2000, 2026, 40, 'SPG-TIR-001', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='tires-wheels'),
 'BF Goodrich All-Terrain T/A KO2 — 265/65R17', 'Legendary all-terrain tyre. Perfect for Hilux, Navara, and other pickups. Single tyre.', 1100.00, 'BF Goodrich', 'new', 'Universal', 'Universal', 2000, 2026, 20, 'SPG-TIR-002', true, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Suspension Pro GH'),
 (SELECT id FROM categories WHERE slug='tires-wheels'),
 'Steel Wheel Rim 16" — Toyota Hilux', 'OEM-spec 16×7 steel wheel. 6×139.7 bolt pattern. Includes centre cap.', 350.00, 'Toyota', 'new', 'Toyota', 'Hilux', 2005, 2024, 16, 'SPG-TIR-003', false, '[]'),

-- Interior
((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='interior'),
 'Steering Wheel Airbag — Honda CR-V', 'Driver-side airbag module. New, sealed unit. Professional installation recommended.', 950.00, 'Honda', 'new', 'Honda', 'CR-V', 2012, 2020, 3, 'BWG-INT-001', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Bodyworks Ghana'),
 (SELECT id FROM categories WHERE slug='interior'),
 'Dashboard Assembly — Toyota Corolla (Used)', 'Clean used dashboard from low-mileage Corolla. No cracks, includes air vents.', 800.00, 'Toyota', 'used', 'Toyota', 'Corolla', 2014, 2019, 2, 'BWG-INT-002', false, '[]'),

((SELECT id FROM vendors WHERE "businessName"='Electrical Auto Parts'),
 (SELECT id FROM categories WHERE slug='interior'),
 'Power Window Motor — Nissan Note (Front Left)', 'Window regulator motor. Direct replacement, includes wiring connector.', 185.00, 'Nissan', 'new', 'Nissan', 'Note', 2012, 2022, 10, 'EAP-INT-001', false, '[]');

COMMIT;

-- Summary
SELECT 'Seed complete!' AS status,
       (SELECT COUNT(*) FROM categories) AS categories,
       (SELECT COUNT(*) FROM users WHERE role = 'vendor') AS vendor_users,
       (SELECT COUNT(*) FROM vendors) AS vendors,
       (SELECT COUNT(*) FROM products) AS products;
