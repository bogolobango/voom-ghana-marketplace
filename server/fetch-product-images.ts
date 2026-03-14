/**
 * Product Image Fetcher for Voom Ghana Marketplace
 *
 * Searches the web for manufacturer product images, downloads them,
 * uploads to Cloudinary, and updates the product listing in the database.
 *
 * Usage (from project root on Replit):
 *   pnpm add -D cheerio node-fetch@3
 *   npx tsx server/fetch-product-images.ts
 *
 * Environment variables needed (already in .replit):
 *   SUPABASE_DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import pg from "pg";
import { v2 as cloudinary } from "cloudinary";
import * as cheerio from "cheerio";
import { setTimeout as sleep } from "timers/promises";

// ─── Config ───
const DB_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;

const CONCURRENCY = 2;          // parallel image fetches (be polite)
const DELAY_BETWEEN_MS = 2000;  // delay between batches
const MAX_IMAGES_PER_PRODUCT = 2;
const IMAGE_FOLDER = "voom-products";

// ─── Validate env ───
if (!DB_URL) { console.error("Missing DATABASE_URL"); process.exit(1); }
if (!CLOUD_NAME || !CLOUD_KEY || !CLOUD_SECRET) {
  console.error("Missing CLOUDINARY_* env vars"); process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: CLOUD_KEY, api_secret: CLOUD_SECRET });

// ─── Types ───
interface Product {
  id: number;
  name: string;
  brand: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  condition: string | null;
  sku: string | null;
  images: string[] | null;
  categorySlug: string | null;
}

// ─── Database ───
const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: process.env.SUPABASE_DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

async function getAllProducts(): Promise<Product[]> {
  const { rows } = await pool.query(`
    SELECT p.id, p.name, p.brand, p."vehicleMake", p."vehicleModel",
           p.condition, p.sku, p.images, c.slug AS "categorySlug"
    FROM products p
    LEFT JOIN categories c ON c.id = p."categoryId"
    ORDER BY p.id
  `);
  return rows;
}

async function updateProductImages(productId: number, imageUrls: string[]) {
  await pool.query(
    `UPDATE products SET images = $1, "updatedAt" = NOW() WHERE id = $2`,
    [JSON.stringify(imageUrls), productId]
  );
}

// ─── Build search query ───
function buildSearchQuery(product: Product): string {
  const parts: string[] = [];

  // Brand + product name is the core query
  if (product.brand && product.brand !== "Universal") {
    parts.push(product.brand);
  }
  parts.push(product.name);

  // Add "auto part" context for generic names
  const name = product.name.toLowerCase();
  const hasPartKeyword = ["engine", "brake", "shock", "filter", "oil", "tyre", "tire",
    "radiator", "clutch", "bumper", "headlight", "sensor", "alternator", "starter",
    "battery", "piston", "turbo", "exhaust", "muffler", "caliper", "coil", "pump"]
    .some(kw => name.includes(kw));
  if (!hasPartKeyword) parts.push("auto part");

  // Add "product image" to bias toward clean product shots
  parts.push("product");

  return parts.join(" ");
}

// ─── Image search via Google Images scraping ───
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

async function searchImageUrls(query: string, count: number): Promise<string[]> {
  const urls: string[] = [];

  // Strategy 1: Google Images (ijn=0 for first page)
  try {
    const googleUrls = await searchGoogle(query, count);
    urls.push(...googleUrls);
  } catch (err: any) {
    console.warn(`  Google search failed: ${err.message}`);
  }

  // Strategy 2: Bing Images as fallback
  if (urls.length < count) {
    try {
      const bingUrls = await searchBing(query, count - urls.length);
      urls.push(...bingUrls);
    } catch (err: any) {
      console.warn(`  Bing search failed: ${err.message}`);
    }
  }

  return urls.slice(0, count);
}

async function searchGoogle(query: string, count: number): Promise<string[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`;
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const resp = await fetch(url, {
    headers: {
      "User-Agent": ua,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!resp.ok) throw new Error(`Google returned ${resp.status}`);
  const html = await resp.text();

  // Google embeds full-size image URLs in the page source
  // Pattern: ["https://...jpg",width,height]
  const imageUrls: string[] = [];
  const regex = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)",\s*\d+,\s*\d+\]/gi;
  let match;
  while ((match = regex.exec(html)) !== null && imageUrls.length < count * 3) {
    const imgUrl = match[1];
    if (isValidImageUrl(imgUrl)) {
      imageUrls.push(imgUrl);
    }
  }

  // Fallback: extract from <img> tags with data-src or src
  if (imageUrls.length === 0) {
    const $ = cheerio.load(html);
    $("img").each((_, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src") || "";
      if (src.startsWith("http") && isValidImageUrl(src) && !src.includes("google")) {
        imageUrls.push(src);
      }
    });
  }

  return imageUrls.slice(0, count);
}

async function searchBing(query: string, count: number): Promise<string[]> {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const resp = await fetch(url, {
    headers: {
      "User-Agent": ua,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!resp.ok) throw new Error(`Bing returned ${resp.status}`);
  const html = await resp.text();
  const $ = cheerio.load(html);

  const imageUrls: string[] = [];

  // Bing stores full image URLs in m attribute (JSON) of .iusc elements
  $("a.iusc").each((_, el) => {
    try {
      const m = $(el).attr("m");
      if (m) {
        const data = JSON.parse(m);
        if (data.murl && isValidImageUrl(data.murl)) {
          imageUrls.push(data.murl);
        }
      }
    } catch {}
  });

  // Fallback: img tags with src
  if (imageUrls.length === 0) {
    $("img.mimg, img.rms_img").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src.startsWith("http") && isValidImageUrl(src)) {
        imageUrls.push(src);
      }
    });
  }

  return imageUrls.slice(0, count);
}

function isValidImageUrl(url: string): boolean {
  // Skip tiny icons, base64, google/bing internal, SVGs
  if (url.includes("data:image")) return false;
  if (url.includes("gstatic.com")) return false;
  if (url.includes("google.com")) return false;
  if (url.includes("bing.com/th")) return false;
  if (url.includes("favicon")) return false;
  if (url.endsWith(".svg")) return false;
  if (url.endsWith(".gif")) return false;
  if (url.includes("1x1")) return false;
  if (url.includes("pixel")) return false;
  return true;
}

// ─── Download image ───
async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENTS[0],
        "Accept": "image/*",
        "Referer": new URL(url).origin,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) return null;

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Skip tiny images (likely icons/placeholders) — require at least 5KB
    if (buffer.length < 5000) return null;

    return { buffer, contentType };
  } catch {
    return null;
  }
}

// ─── Upload to Cloudinary ───
async function uploadToCloudinary(
  buffer: Buffer,
  contentType: string,
  productSku: string,
  index: number
): Promise<string | null> {
  try {
    const base64 = buffer.toString("base64");
    const dataUri = `data:${contentType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: IMAGE_FOLDER,
      public_id: `${productSku.toLowerCase()}-${index}`,
      resource_type: "image",
      overwrite: true,
      transformation: [
        { width: 800, height: 800, crop: "limit", quality: "auto", fetch_format: "auto" }
      ],
    });

    return result.secure_url;
  } catch (err: any) {
    console.warn(`  Cloudinary upload failed: ${err.message}`);
    return null;
  }
}

// ─── Process a single product ───
async function processProduct(product: Product): Promise<boolean> {
  // Skip if already has real images
  if (product.images && product.images.length > 0 &&
      product.images.some(img => img.startsWith("http"))) {
    console.log(`  [SKIP] #${product.id} "${product.name}" — already has images`);
    return false;
  }

  const query = buildSearchQuery(product);
  console.log(`  [SEARCH] "${query}"`);

  const imageUrls = await searchImageUrls(query, MAX_IMAGES_PER_PRODUCT * 2); // fetch extras in case some fail

  if (imageUrls.length === 0) {
    console.log(`  [WARN] No images found for #${product.id} "${product.name}"`);
    return false;
  }

  const uploadedUrls: string[] = [];
  const sku = product.sku || `product-${product.id}`;

  for (let i = 0; i < imageUrls.length && uploadedUrls.length < MAX_IMAGES_PER_PRODUCT; i++) {
    console.log(`  [DOWNLOAD] ${imageUrls[i].substring(0, 80)}...`);
    const image = await downloadImage(imageUrls[i]);
    if (!image) {
      console.log(`  [SKIP] Download failed or image too small`);
      continue;
    }

    console.log(`  [UPLOAD] ${(image.buffer.length / 1024).toFixed(0)}KB → Cloudinary`);
    const cloudinaryUrl = await uploadToCloudinary(image.buffer, image.contentType, sku, uploadedUrls.length + 1);
    if (cloudinaryUrl) {
      uploadedUrls.push(cloudinaryUrl);
      console.log(`  [OK] ${cloudinaryUrl}`);
    }
  }

  if (uploadedUrls.length === 0) {
    console.log(`  [FAIL] Could not upload any images for #${product.id}`);
    return false;
  }

  await updateProductImages(product.id, uploadedUrls);
  console.log(`  [DB] Updated product #${product.id} with ${uploadedUrls.length} image(s)`);
  return true;
}

// ─── Main ───
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Voom Ghana — Product Image Fetcher");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Cloudinary: ${CLOUD_NAME}`);
  console.log(`Max images per product: ${MAX_IMAGES_PER_PRODUCT}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log();

  const products = await getAllProducts();
  console.log(`Found ${products.length} products in database\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    console.log(`\n── Batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(products.length / CONCURRENCY)} ──`);

    const results = await Promise.allSettled(
      batch.map(async (product) => {
        console.log(`\n[${product.id}] ${product.name}`);
        return processProduct(product);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value) success++;
        else skipped++;
      } else {
        failed++;
        console.error(`  [ERROR] ${result.reason}`);
      }
    }

    // Polite delay between batches
    if (i + CONCURRENCY < products.length) {
      console.log(`\n  (waiting ${DELAY_BETWEEN_MS / 1000}s before next batch...)`);
      await sleep(DELAY_BETWEEN_MS);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Done! ${success} updated, ${skipped} skipped, ${failed} failed`);
  console.log("═══════════════════════════════════════════════════════════");

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
