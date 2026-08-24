import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sortBrandsWithMicrosistecFirst<T extends { id?: string; name?: string }>(brands: T[]): T[] {
  const microsistec: T[] = [];
  const others: T[] = [];

  for (const b of brands) {
    if (!b) continue;
    if (b.id === "microsistec" || (b.name && b.name.trim().toLowerCase() === "microsistec")) {
      microsistec.push(b);
    } else {
      others.push(b);
    }
  }

  others.sort((a, b) => {
    const nameA = (a.name || "").trim();
    const nameB = (b.name || "").trim();
    return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base", numeric: true });
  });

  return [...microsistec, ...others];
}

/**
 * Normaliza uma string gerando um slug limpo e sem acentos
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Localiza uma marca em uma lista por correspondência flexível de ID, slug ou nome
 */
export function matchBrandByIdOrSlug<T extends { id?: string; name?: string; customDomain?: string }>(
  brands: Iterable<T> | T[],
  searchIdOrSlug: string
): T | null {
  if (!searchIdOrSlug) return null;
  const brandList = Array.isArray(brands) ? brands : Array.from(brands);
  if (brandList.length === 0) return null;

  let decoded = searchIdOrSlug;
  try {
    decoded = decodeURIComponent(searchIdOrSlug);
  } catch {
    // ignore
  }

  const rawLower = searchIdOrSlug.toLowerCase().trim();
  const decodedLower = decoded.toLowerCase().trim();
  const searchSlug = slugify(decoded);
  const searchCompact = decodedLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  // 1. Correspondência exata de ID (com ou sem URL encode/decode)
  for (const b of brandList) {
    if (!b || !b.id) continue;
    const bId = b.id.toLowerCase().trim();
    if (bId === rawLower || bId === decodedLower) return b;
  }

  // 2. Correspondência por slug do ID
  for (const b of brandList) {
    if (!b || !b.id) continue;
    const bSlug = slugify(b.id);
    if (bSlug === searchSlug) return b;
  }

  // 3. Correspondência alfanumérica compacta do ID (ignora hífens, pontos e acentos)
  for (const b of brandList) {
    if (!b || !b.id) continue;
    const bCompact = slugify(b.id).replace(/[^a-z0-9]/g, "");
    if (bCompact === searchCompact && bCompact.length > 0) return b;
  }

  // 4. Correspondência por slug do Nome da Marca
  for (const b of brandList) {
    if (!b || !b.name) continue;
    const nameSlug = slugify(b.name);
    if (nameSlug === searchSlug) return b;
    const nameCompact = nameSlug.replace(/[^a-z0-9]/g, "");
    if (nameCompact === searchCompact && nameCompact.length > 0) return b;
    // Prefix match (ex: 'yara-imoveis' combina com 'yara-imoveis-atibaia')
    if (nameSlug.startsWith(searchSlug) || searchSlug.startsWith(nameSlug)) {
      return b;
    }
  }

  // 5. Aliases e variações conhecidas (tolerância a pequenos erros de digitação)
  for (const b of brandList) {
    if (!b) continue;
    const bId = (b.id || "").toLowerCase();
    const bName = (b.name || "").toLowerCase();
    
    if (searchCompact.includes("yara") && (bId.includes("yara") || bName.includes("yara"))) return b;
    if (searchCompact.includes("yellow") && (bId.includes("yellow") || bName.includes("yellow"))) return b;
    if (searchCompact.includes("kura") && (bId.includes("kura") || bName.includes("kura"))) return b;
    if (searchCompact.includes("albert") && (bId.includes("albert") || bName.includes("albert"))) return b;
    if (searchCompact.includes("gedanken") && (bId.includes("gedanken") || bName.includes("gedanken"))) return b;
    if (searchCompact.includes("robles") && (bId.includes("robles") || bName.includes("robles"))) return b;
    if (searchCompact.includes("meuimovel") && (bId.includes("meuim") || bName.includes("meuim"))) return b;
    if (searchCompact.includes("microsistec") && (bId.includes("microsistec") || bName.includes("microsistec"))) return b;
    if (searchCompact.includes("aura") && (bId === "aura" || bName.includes("aura"))) return b;
  }

  return null;
}

