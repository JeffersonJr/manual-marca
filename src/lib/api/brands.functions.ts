import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { DEFAULT_BRANDS } from "@/data/default-brands";
import { sortBrandsWithMicrosistecFirst, matchBrandByIdOrSlug } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Neon Postgres Database Integration
// ---------------------------------------------------------------------------
function getDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

let sqlClient: ReturnType<typeof neon> | null = null;
let tableInitialized = false;

function getSql() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;
  if (!sqlClient) {
    sqlClient = neon(dbUrl);
  }
  return sqlClient;
}

async function ensureTable() {
  const sql = getSql();
  if (!sql || tableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS custom_brands (
        id TEXT PRIMARY KEY,
        name TEXT,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS deleted_brands (
        id TEXT PRIMARY KEY,
        deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    tableInitialized = true;
  } catch (err) {
    console.error("[brands-storage] Failed to initialize Neon Postgres table:", err);
  }
}

async function readNeonDeletedBrandIds(): Promise<string[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureTable();
    const rows = await sql`SELECT id FROM deleted_brands;`;
    return rows.map((r: any) => r.id);
  } catch (err) {
    console.error("[brands-storage] Neon Postgres read deleted brands failed:", err);
    return [];
  }
}

async function readNeonBrands(): Promise<any[] | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensureTable();
    const rows = await sql`
      SELECT data FROM custom_brands ORDER BY updated_at DESC;
    `;
    return rows.map((r: any) => (typeof r.data === "string" ? JSON.parse(r.data) : r.data));
  } catch (err) {
    console.error("[brands-storage] Neon Postgres read failed:", err);
    return null;
  }
}

async function writeNeonBrand(brand: any): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await ensureTable();
    const jsonStr = JSON.stringify(brand);
    await sql`
      INSERT INTO custom_brands (id, name, data, updated_at)
      VALUES (${brand.id}, ${brand.name || ""}, ${jsonStr}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = NOW();
    `;
    await sql`
      DELETE FROM deleted_brands WHERE id = ${brand.id};
    `;
    console.log(`[brands-storage] ✅ Marca "${brand.name}" (${brand.id}) salva no Neon Postgres.`);
    return true;
  } catch (err) {
    console.error("[brands-storage] Neon Postgres write failed:", err);
    return false;
  }
}

async function deleteNeonBrand(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await ensureTable();
    await sql`DELETE FROM custom_brands WHERE id = ${id};`;
    await sql`INSERT INTO deleted_brands (id, deleted_at) VALUES (${id}, NOW()) ON CONFLICT (id) DO NOTHING;`;
    return true;
  } catch (err) {
    console.error("[brands-storage] Neon Postgres delete failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Local and KV Storage Fallbacks
// ---------------------------------------------------------------------------
const localFilePath = path.join(process.cwd(), "public/custom-brands.json");

async function readLocalBrands(): Promise<any[]> {
  try {
    const data = await fs.readFile(localFilePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function writeLocalBrands(brands: any[]) {
  try {
    await fs.mkdir(path.dirname(localFilePath), { recursive: true });
    await fs.writeFile(localFilePath, JSON.stringify(brands, null, 2), "utf-8");
  } catch (err) {
    console.error("[brands-storage] Failed to write local custom brands:", err);
  }
}

function getKvConfig() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.VERCEL_KV_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.VERCEL_KV_API_TOKEN;
  return { kvUrl, kvToken };
}

async function readRemoteBrands(): Promise<any[] | null> {
  const { kvUrl, kvToken } = getKvConfig();

  if (kvUrl && kvToken) {
    try {
      const response = await fetch(`${kvUrl}/get/brands`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        cache: "no-store",
      });
      if (response.ok) {
        const json = await response.json();
        if (json.result) {
          return typeof json.result === "string" ? JSON.parse(json.result) : json.result;
        }
      }
    } catch (err) {
      console.error("[brands-storage] Remote KV read failed:", err);
    }
  }

  return null;
}

async function writeRemoteBrands(brands: any[]) {
  const { kvUrl, kvToken } = getKvConfig();

  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/brands`, {
        method: "POST",
        headers: { Authorization: `Bearer ${kvToken}` },
        body: JSON.stringify(JSON.stringify(brands)),
      });
    } catch (err) {
      console.error("[brands-storage] Remote KV write failed:", err);
    }
  }
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

// Server function to load all brands from static defaults + Neon + KV + local file system
export const loadBrandsServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const brandMap = new Map<string, any>();
    const deletedIds = await readNeonDeletedBrandIds();

    // 1. Static built-in default brands bundled in the codebase
    for (const b of DEFAULT_BRANDS) {
      if (b && b.id && !deletedIds.includes(b.id)) brandMap.set(b.id, b);
    }
    
    // 2. Read from Neon Postgres (if connected)
    const neonBrands = await readNeonBrands();
    for (const b of neonBrands || []) {
      if (b && b.id && !deletedIds.includes(b.id)) brandMap.set(b.id, b);
    }

    // 3. Read remote brands (if Vercel KV / Redis is configured)
    const remoteBrands = await readRemoteBrands();
    for (const b of remoteBrands || []) {
      if (b && b.id && !deletedIds.includes(b.id)) brandMap.set(b.id, b);
    }

    // 4. Read local brands from custom-brands.json if present
    const localBrands = await readLocalBrands();
    for (const b of localBrands || []) {
      if (b && b.id && !deletedIds.includes(b.id)) brandMap.set(b.id, b);
    }
    
    return sortBrandsWithMicrosistecFirst(Array.from(brandMap.values()));
  });

// Server function to get a single brand by ID
export const getBrandByIdServer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data;
    const allBrands = await loadBrandsServer();
    return matchBrandByIdOrSlug(allBrands, id);
  });

// Server function to save a brand (add or update)
export const saveBrandServer = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }: { data: any }) => {
    const brand = data;
    if (!brand || !brand.id) {
      throw new Error("Invalid brand data");
    }
    
    // 1. Save to Neon Postgres if configured
    await writeNeonBrand(brand);

    // 2. Save to remote KV if configured
    try {
      const remoteBrands = await readRemoteBrands();
      if (remoteBrands) {
        const index = remoteBrands.findIndex((b: any) => b.id === brand.id);
        if (index >= 0) {
          remoteBrands[index] = brand;
        } else {
          remoteBrands.push(brand);
        }
        const sortedRemote = sortBrandsWithMicrosistecFirst(remoteBrands);
        await writeRemoteBrands(sortedRemote);
      }
    } catch (err) {
      console.warn("[brands-storage] Could not save to remote KV:", err);
    }

    // 3. Save to local filesystem
    try {
      const localBrands = await readLocalBrands();
      const localIndex = localBrands.findIndex((b: any) => b.id === brand.id);
      if (localIndex >= 0) {
        localBrands[localIndex] = brand;
      } else {
        localBrands.push(brand);
      }
      const sortedLocal = sortBrandsWithMicrosistecFirst(localBrands);
      await writeLocalBrands(sortedLocal);
      console.log(`[brands-storage] ✅ Marca "${brand.name}" (${brand.id}) salva no arquivo local.`);
    } catch (err) {
      console.warn("[brands-storage] Could not save to local filesystem:", err);
    }
    
    return { success: true };
  });

// Server function to delete a brand
export const deleteBrandServer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data;
    
    // 1. Delete from Neon Postgres
    await deleteNeonBrand(id);

    // 2. Load remote KV brands, filter and save
    let remoteBrands = await readRemoteBrands() || [];
    remoteBrands = sortBrandsWithMicrosistecFirst(remoteBrands.filter((b: any) => b.id !== id));
    await writeRemoteBrands(remoteBrands);
    
    // 3. Load local brands, filter and save
    try {
      let localBrands = await readLocalBrands();
      localBrands = sortBrandsWithMicrosistecFirst(localBrands.filter((b: any) => b.id !== id));
      await writeLocalBrands(localBrands);
    } catch (err) {
      console.warn("Could not delete from local filesystem (e.g. running on serverless):", err);
    }
    
    return { success: true };
  });

// Server function to save all brands (overwrite list - useful for sorting or imports)
export const saveAllBrandsServer = createServerFn({ method: "POST" })
  .inputValidator(z.array(z.any()))
  .handler(async ({ data }: { data: any[] }) => {
    const brands = sortBrandsWithMicrosistecFirst(data);
    
    // 1. Save all to Neon Postgres
    for (const b of brands) {
      if (b && b.id) await writeNeonBrand(b);
    }

    // 2. Save remote KV
    await writeRemoteBrands(brands);
    
    // 3. Save local
    try {
      await writeLocalBrands(brands);
    } catch (err) {
      console.warn("Could not save all brands to local filesystem:", err);
    }
    
    return { success: true };
  });
