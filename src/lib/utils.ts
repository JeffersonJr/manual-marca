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
