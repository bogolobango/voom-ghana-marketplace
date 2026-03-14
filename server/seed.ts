// Seed script — run via: npx tsx server/seed.ts
import "dotenv/config";
import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runSeed() {
  const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL or SUPABASE_DATABASE_URL set");
    process.exit(1);
  }

  const ssl = process.env.SUPABASE_DATABASE_URL ? { rejectUnauthorized: false } : undefined;
  const pool = new pg.Pool({ connectionString: dbUrl, ssl });

  try {
    const sqlPath = resolve(__dirname, "../data/voom_seed.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    console.log("Running seed SQL against database...");
    const result = await pool.query(sql);
    // The last result set has the summary
    const rows = Array.isArray(result) ? result[result.length - 1]?.rows : result.rows;
    if (rows?.[0]) {
      console.log("Result:", rows[0]);
    }
    console.log("Seed completed successfully!");
  } catch (err: any) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
