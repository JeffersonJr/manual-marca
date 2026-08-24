import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

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

async function readRemoteBrands(): Promise<any[] | null> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const response = await fetch(`${kvUrl}/get/brands`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      if (response.ok) {
        const json = await response.json();
        if (json.result) {
          return JSON.parse(json.result);
        }
      }
    } catch (err) {
      console.error("[brands-storage] Vercel KV read failed:", err);
    }
  }

  return null;
}

async function writeRemoteBrands(brands: any[]) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/brands`, {
        method: "POST",
        headers: { Authorization: `Bearer ${kvToken}` },
        body: JSON.stringify(JSON.stringify(brands)),
      });
    } catch (err) {
      console.error("[brands-storage] Vercel KV write failed:", err);
    }
  }
}

import { DEFAULT_BRANDS } from "@/data/default-brands";
import { sortBrandsWithMicrosistecFirst } from "@/lib/utils";

// Server function to load all brands from static defaults + KV + local file system
export const loadBrandsServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const brandMap = new Map<string, any>();

    // 1. Static built-in default brands bundled in the codebase
    for (const b of DEFAULT_BRANDS) {
      if (b && b.id) brandMap.set(b.id, b);
    }
    
    // 2. Read local brands from custom-brands.json if present
    const localBrands = await readLocalBrands();
    for (const b of localBrands || []) {
      if (b && b.id) brandMap.set(b.id, b);
    }
    
    // 3. Read remote brands (if Vercel KV is configured)
    const remoteBrands = await readRemoteBrands();
    for (const b of remoteBrands || []) {
      if (b && b.id) brandMap.set(b.id, b);
    }
    
    return sortBrandsWithMicrosistecFirst(Array.from(brandMap.values()));
  });

// Server function to get a single brand by ID
export const getBrandByIdServer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data;
    const allBrands = await loadBrandsServer();
    return allBrands.find((b: any) => b.id === id) || null;
  });

// Server function to save a brand (add or update)
export const saveBrandServer = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }: { data: any }) => {
    const brand = data;
    if (!brand || !brand.id) {
      throw new Error("Invalid brand data");
    }
    
    // 1. Save to local filesystem
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
    
    return { success: true };
  });

// Server function to delete a brand
export const deleteBrandServer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }: { data: { id: string } }) => {
    const { id } = data;
    
    // Load remote brands, filter and save
    let remoteBrands = await readRemoteBrands() || [];
    remoteBrands = sortBrandsWithMicrosistecFirst(remoteBrands.filter((b: any) => b.id !== id));
    await writeRemoteBrands(remoteBrands);
    
    // Load local brands, filter and save
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
    
    // Save remote
    await writeRemoteBrands(brands);
    
    // Save local
    try {
      await writeLocalBrands(brands);
    } catch (err) {
      console.warn("Could not save all brands to local filesystem:", err);
    }
    
    return { success: true };
  });
