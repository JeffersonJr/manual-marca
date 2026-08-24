/**
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 */
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DynamicLogoMark } from "@/components/brand/DynamicLogoMark";
import { saveBrandServer, deleteBrandServer, loadBrandsServer, getBrandByIdServer } from "@/lib/api/brands.functions";
import { LogoMark } from "@/components/brand/LogoMark";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Upload, X, Check, Settings, Link2, Copy, Trash2, Lock, ArrowLeft, ShieldAlert, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import type { BriefingData } from "@/lib/types";
import { getCleanHeroTitle, getCleanHeroDescription, getBrandVoiceGuidelines } from "@/lib/brand-utils";
import { DEFAULT_BRANDS, defaultMicrosistec } from "@/data/default-brands";
import { sortBrandsWithMicrosistecFirst, matchBrandByIdOrSlug } from "@/lib/utils";
import { isAdminAuthenticated, loginAdmin } from "@/lib/auth";

import tshirtMockup from "@/assets/tshirt-mockup.png";
import bottleMockup from "@/assets/bottle-mockup.png";
import notebookMockup from "@/assets/notebook-mockup.png";
import totebagMockup from "@/assets/totebag-mockup.png";

import macroPhoto from "@/assets/macro-photography.png";
import humanPhoto from "@/assets/human-photography.png";
import architecturePhoto from "@/assets/architecture-photography.png";

export const Route = createFileRoute("/brand/$brandId")({
  head: ({ params }) => {
    const brandId = params.brandId;
    return {
      meta: [
        { title: `${brandId.toUpperCase()} — Sistema de Identidade Visual` },
        { name: "description", content: "Manual de marca e sistema de identidade visual." },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      ],
    };
  },
  component: BrandBookRoute,
});

interface BrandData {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  symbolUrl?: string;
  logoReverseUrl?: string;
  symbolReverseUrl?: string;
  mission: string;
  vision: string;
  promise: string;
  customDomain?: string;
  values: { name: string; description: string }[];
  palette: {
    primary: { name: string; hex: string; role: string; token: string }[];
    secondary: { name: string; hex: string; role: string; token: string }[];
    accent: { name: string; hex: string; role: string; token: string }[];
    neutrals: { name: string; hex: string }[];
  };
  // Dynamic fields from AI generation
  flow?: "A" | "B";
  heroTitle?: string;
  voiceExamples?: { ok: string[]; no: string[] };
  briefing?: BriefingData;
  createdAt?: string;
}



function Swatch({ name, hex, role, token, dark }: { name: string; hex: string; role?: string; token?: string; dark?: boolean }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copiado: ${hex} (${name})`, {
      description: "Cor copiada para a área de transferência.",
    });
  };

  return (
    <div
      onClick={handleCopy}
      className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] select-none"
    >
      <div className="h-32 relative overflow-hidden" style={{ backgroundColor: hex }}>
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-xs font-medium px-2 py-1 rounded bg-background/90 backdrop-blur-sm shadow border border-border text-foreground">
            Copiar HEX
          </span>
        </div>
        <div className={`absolute bottom-3 left-3 text-[10px] tracking-widest uppercase font-mono ${dark ? "text-white/80" : "text-black/60"}`}>
          {hex}
        </div>
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold group-hover:text-primary transition-colors flex items-center justify-between">
          <span>{name}</span>
          <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </div>
        {token && <div className="text-[11px] font-mono text-muted-foreground mt-1">{token}</div>}
        {role && <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{role}</div>}
      </div>
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-border py-16 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-10 md:gap-16">
          <div className="md:sticky md:top-28 md:self-start">
            <div className="text-[11px] tracking-[0.25em] uppercase text-primary font-mono">{eyebrow}</div>
            <h2 className="mt-3 text-2xl md:text-4xl font-semibold text-foreground">{title}</h2>
          </div>
          <div className="space-y-10 min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="p-5">
      <div className="text-[11px] font-mono uppercase tracking-widest text-primary">{k}</div>
      <div className="text-sm text-foreground mt-1.5 leading-relaxed">{v}</div>
    </div>
  );
}

function LogoCard({ logoUrl, symbolUrl, logoReverseUrl, symbolReverseUrl, brandName, label, bg, variant, desc }: { logoUrl?: string; symbolUrl?: string; logoReverseUrl?: string; symbolReverseUrl?: string; brandName: string; label: string; bg: string; variant: "original" | "deep" | "mono-dark" | "mono-light" | "reverse"; desc: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="h-44 grid place-items-center p-8" style={{ background: bg }}>
        <DynamicLogoMark logoUrl={logoUrl} symbolUrl={symbolUrl} logoReverseUrl={logoReverseUrl} symbolReverseUrl={symbolReverseUrl} brandName={brandName} variant={variant} className="w-full max-w-[280px] h-24" />
      </div>
      <div className="p-4 border-t border-border">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      </div>
    </div>
  );
}

function SizeCard({ label, min, sample }: { label: string; min: string; sample: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="h-24 grid place-items-center">{sample}</div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs font-mono text-primary mt-1">{min}</div>
      </div>
    </div>
  );
}

function Dont({ logoUrl, symbolUrl, logoReverseUrl, symbolReverseUrl, brandName, label, style }: { logoUrl?: string; symbolUrl?: string; logoReverseUrl?: string; symbolReverseUrl?: string; brandName: string; label: string; style: React.CSSProperties }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="h-28 grid place-items-center p-4 bg-muted overflow-hidden">
        <div style={style}>
          <DynamicLogoMark logoUrl={logoUrl} symbolUrl={symbolUrl} logoReverseUrl={logoReverseUrl} symbolReverseUrl={symbolReverseUrl} brandName={brandName} variant="original" withWordmark={false} className="h-12 w-12 object-contain" />
        </div>
      </div>
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <span className="text-destructive">✕</span>
        <span className="text-xs">{label}</span>
      </div>
    </div>
  );
}

function FontShowcase({ family, role, sample, specs, big, mono }: { family: string; role: string; sample: string; specs: string; big?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
      <div className="flex flex-wrap items-baseline gap-3 mb-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">{role}</div>
        <div className="text-sm text-muted-foreground">·</div>
        <div className="text-sm font-mono">{family}</div>
      </div>
      <div
        className={big ? "text-2xl sm:text-4xl md:text-5xl tracking-tight font-semibold" : mono ? "text-lg sm:text-xl" : "text-base sm:text-lg leading-relaxed"}
        style={{ fontFamily: mono ? "JetBrains Mono, monospace" : family === "Inter" ? "Inter, sans-serif" : "Space Grotesk, sans-serif" }}
      >
        {sample}
      </div>
      <div className="mt-6 pt-6 border-t border-border text-xs font-mono text-muted-foreground">{specs}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-4 items-baseline pb-6 border-b border-border last:border-0 last:pb-0">
      <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function IconSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-[11px] font-mono uppercase tracking-widest text-primary">{label}</div>
      <div className="mt-2 font-display text-xl sm:text-2xl font-semibold">{value}</div>
    </div>
  );
}

interface MotionCardProps {
  k: string;
  v: string;
}

function MotionCard({ k, v }: MotionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-[11px] font-mono uppercase tracking-widest text-primary">{k}</div>
      <div className="mt-2 text-xs sm:text-sm text-foreground">{v}</div>
    </div>
  );
}

function Rule({ label, items, positive }: { label: string; items: string[]; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className={`text-[11px] font-mono uppercase tracking-widest ${positive ? "text-primary" : "text-destructive"}`}>{label}</div>
      <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className={positive ? "text-primary" : "text-destructive"}>{positive ? "✓" : "✕"}</span>
            <span className="text-foreground/80">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VoiceCard({ title, kind, children }: { title: string; kind: "ok" | "no"; children: React.ReactNode }) {
  const good = kind === "ok";
  return (
    <div className={`rounded-xl border p-5 sm:p-6 ${good ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
      <div className={`text-[11px] font-mono uppercase tracking-widest ${good ? "text-primary" : "text-destructive"}`}>
        {good ? "✓ " : "✕ "}{title}
      </div>
      <div className="mt-4 text-xs sm:text-sm leading-relaxed text-foreground/85 space-y-2">{children}</div>
    </div>
  );
}

function Contrast({ fg, bg, ratio, level }: { fg: string; bg: string; ratio: string; level: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="h-20 sm:h-24 grid place-items-center font-display text-lg font-semibold" style={{ background: bg, color: fg }}>
        Aa
      </div>
      <div className="p-3 bg-card border-t border-border">
        <div className="text-[10px] font-mono text-muted-foreground">{fg} on {bg}</div>
        <div className="flex justify-between items-baseline mt-1">
          <div className="font-mono text-xs sm:text-sm font-semibold">{ratio}:1</div>
          <div className="text-[10px] font-mono text-primary">{level}</div>
        </div>
      </div>
    </div>
  );
}

function getContrastRatio(hex1: string, hex2: string) {
  const getRGB = (hex: string) => {
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color = color.split("").map(c => c + c).join("");
    }
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return [r, g, b];
  };

  const getLuminance = ([r, g, b]: number[]) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const l1 = getLuminance(getRGB(hex1));
  const l2 = getLuminance(getRGB(hex2));
  
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  
  return ((brightest + 0.05) / (darkest + 0.05)).toFixed(1);
}

function getFilteredLogoBase64(logoUrl: string, variant: 'original' | 'reverse' | 'mono-dark' | 'mono-light'): Promise<string> {
  if (variant === 'original') return Promise.resolve(logoUrl);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(logoUrl);
        return;
      }
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (variant === 'reverse') {
        ctx.filter = 'invert(1) brightness(2)';
      } else if (variant === 'mono-dark') {
        ctx.filter = 'grayscale(1) contrast(1.2)';
      } else if (variant === 'mono-light') {
        ctx.filter = 'grayscale(1) invert(1) brightness(2)';
      }
      
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(logoUrl);
      }
    };
    img.onerror = () => {
      resolve(logoUrl);
    };
  });
}

function getMicrosistecSvg(variant: 'original' | 'deep' | 'mono-dark' | 'mono-light' | 'reverse', withWordmark: boolean) {
  const palettes = {
    original: { p1: "#2B5250", p2: "#5AA6A6", p3: "#2B5250", p4: "#101010", p5: "#7CC1C1", p6: "#1B2A2A", text: "#1A1A1A" },
    deep:     { p1: "#0F3331", p2: "#2B5250", p3: "#0F3331", p4: "#000000", p5: "#3A6F6C", p6: "#061715", text: "#0A1F1E" },
    "mono-dark": { p1: "#1A1A1A", p2: "#3A3A3A", p3: "#1A1A1A", p4: "#000000", p5: "#5A5A5A", p6: "#0A0A0A", text: "#1A1A1A" },
    "mono-light": { p1: "#F5F7F7", p2: "#FFFFFF", p3: "#F5F7F7", p4: "#000000", p5: "#FFFFFF", p6: "#E8EDED", text: "#FFFFFF" },
    reverse:  { p1: "#7CC1C1", p2: "#5AA6A6", p3: "#7CC1C1", p4: "#000000", p5: "#A8DCDC", p6: "#2B5250", text: "#FFFFFF" },
  };
  const c = palettes[variant];
  const viewBox = withWordmark ? "0 0 1845 360" : "0 0 380 360";
  return `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M380.002 27.6639C380.002 18.9734 369.68 14.4193 363.261 20.2774L104.603 256.323C100.298 260.252 100.252 267.015 104.502 271.003L182.954 344.604C186.783 348.197 192.74 348.216 196.592 344.647L376.798 177.696C378.841 175.803 380.002 173.145 380.002 170.36V27.6639Z" fill="${c.p1}"/>
    <path d="M362.569 204.621C369.073 199.15 379.005 203.774 379.005 212.274V333.091C379.005 341.662 368.929 346.261 362.454 340.646L291.73 279.314C287.087 275.287 287.141 268.063 291.845 264.106L362.569 204.621Z" fill="${c.p2}"/>
    <path d="M18.1564 142.457C12.4551 134.614 0.0471446 138.661 0.0674771 148.358L0.455318 333.324C0.47321 341.856 10.482 346.448 16.9617 340.896L99.5718 270.117C103.531 266.725 104.22 260.86 101.154 256.643L18.1564 142.457Z" fill="${c.p3}"/>
    <path opacity="0.6" d="M2.40278e-05 152.745C-0.0199253 143.049 12.3876 139.002 18.0889 146.845L101.087 261.032C102.9 263.526 103.398 266.596 102.685 269.39L4.87014 204.39C2.55335 202.85 0.985282 200.412 0.543969 197.661L0.0879147 194.821L2.40278e-05 152.745Z" fill="${c.p4}"/>
    <path d="M0.00195312 27.6639C0.00195312 18.9734 10.3235 14.4193 16.7428 20.2774L275.4 256.323C279.705 260.252 279.752 267.015 275.502 271.003L197.05 344.604C193.22 348.197 187.264 348.216 183.412 344.647L3.20581 177.696C1.16306 175.803 0.00195312 173.145 0.00195312 170.36V27.6639Z" fill="${c.p5}"/>
    <path d="M218.644 169.009C215.208 164.053 208.199 163.243 203.723 167.285L105.636 255.864C101.311 259.77 101.228 266.532 105.457 270.542L182.945 344.025C186.773 347.655 192.762 347.687 196.629 344.098L277.525 269.006C281.172 265.621 281.775 260.069 278.94 255.979L218.644 169.009Z" fill="${c.p6}"/>
    <path d="M275.607 256.677C279.912 260.606 279.959 267.369 275.709 271.357L229.863 314.368L196.798 345C194.935 346.727 192.578 347.611 190.209 347.66C187.839 347.611 185.482 346.727 183.619 345L150.553 314.368L104.709 271.357C100.458 267.369 100.505 260.606 104.81 256.677L190.209 178.745L275.607 256.677Z" fill="${c.p2}"/>
    \${withWordmark ? \`<path fill="\${c.text}" d="M650.202 130.56C665.562 130.56 678.042 135.44 687.642 145.2C697.402 154.8 702.282 168.8 702.282 187.2V264H685.722V189.12C685.722 174.88 682.282 164 675.402 156.48C668.522 148.96 659.162 145.2 647.322 145.2C635.002 145.2 625.162 149.28 617.802 157.44C610.442 165.6 606.762 177.44 606.762 192.96V264H590.202V189.12C590.202 174.88 586.762 164 579.882 156.48C573.002 148.96 563.562 145.2 551.562 145.2C539.242 145.2 529.402 149.28 522.042 157.44C514.682 165.6 511.002 177.44 511.002 192.96V264H494.202V132.96H511.002V155.52C515.162 147.36 521.082 141.2 528.762 137.04C536.442 132.72 545.002 130.56 554.442 130.56C565.802 130.56 575.722 133.28 584.202 138.72C592.842 144.16 599.082 152.16 602.922 162.72C606.442 152.32 612.442 144.4 620.922 138.96C629.562 133.36 639.322 130.56 650.202 130.56ZM747.993 108.24C744.633 108.24 741.753 107.04 739.353 104.64C736.953 102.24 735.753 99.28 735.753 95.76C735.753 92.24 736.953 89.36 739.353 87.12C741.753 84.72 744.633 83.52 747.993 83.52C751.353 83.52 754.233 84.72 756.633 87.12C759.033 89.36 760.233 92.24 760.233 95.76C760.233 99.28 759.033 102.24 756.633 104.64C754.233 107.04 751.353 108.24 747.993 108.24ZM756.393 132.96V264H739.593V132.96H756.393ZM786.756 198.48C786.756 184.88 789.476 173.04 794.916 162.96C800.356 152.72 807.876 144.88 817.476 139.44C827.076 133.84 838.036 131.04 850.356 131.04C866.516 131.04 879.796 135.04 890.196 143.04C900.756 151.04 907.556 161.92 910.596 175.68H892.596C890.356 166.24 885.476 158.88 877.956 153.6C870.596 148.16 861.396 145.44 850.356 145.44C841.556 145.44 833.636 147.44 826.596 151.44C819.556 155.44 813.956 161.44 809.796 169.44C805.796 177.28 803.796 186.96 803.796 198.48C803.796 210 805.796 219.76 809.796 227.76C813.956 235.76 819.556 241.76 826.596 245.76C833.636 249.76 841.556 251.76 850.356 251.76C861.396 251.76 870.596 249.12 877.956 243.84C885.476 238.4 890.356 230.88 892.596 221.28H910.596C907.556 234.72 900.756 245.52 890.196 253.68C879.636 261.84 866.356 265.92 850.356 265.92C838.036 265.92 827.076 263.2 817.476 257.76C807.876 252.16 800.356 244.32 794.916 234.24C789.476 224 786.756 212.08 786.756 198.48ZM958.424 156.24C962.104 148.08 967.704 141.76 975.224 137.28C982.904 132.8 992.264 130.56 1003.3 130.56V148.08H998.744C986.584 148.08 976.824 151.36 969.464 157.92C962.104 164.48 958.424 175.44 958.424 190.8V264H941.624V132.96H958.424V156.24ZM1085.94 265.92C1073.62 265.92 1062.5 263.2 1052.58 257.76C1042.82 252.16 1035.06 244.32 1029.3 234.24C1023.7 224 1020.9 212.08 1020.9 198.48C1020.9 184.88 1023.78 173.04 1029.54 162.96C1035.3 152.72 1043.14 144.88 1053.06 139.44C1062.98 133.84 1074.1 131.04 1086.42 131.04C1098.74 131.04 1109.86 133.84 1119.78 139.44C1129.86 144.88 1137.7 152.72 1143.3 162.96C1149.06 173.04 1151.94 184.88 1151.94 198.48C1151.94 211.92 1149.06 223.76 1143.3 234C1137.54 244.24 1129.62 252.16 1119.54 257.76C1109.46 263.2 1098.26 265.92 1085.94 265.92ZM1085.94 251.28C1094.58 251.28 1102.58 249.36 1109.94 245.52C1117.3 241.52 1123.22 235.6 1127.7 227.76C1132.34 219.76 1134.66 210 1134.66 198.48C1134.66 186.96 1132.42 177.28 1127.94 169.44C1123.46 161.44 1117.54 155.52 1110.18 151.68C1102.82 147.68 1094.82 145.68 1086.18 145.68C1077.54 145.68 1069.54 147.68 1062.18 151.68C1054.82 155.52 1048.9 161.44 1044.42 169.44C1040.1 177.28 1037.94 186.96 1037.94 198.48C1037.94 210 1040.1 219.76 1044.42 227.76C1048.9 235.6 1054.74 241.52 1061.94 245.52C1069.3 249.36 1077.3 251.28 1085.94 251.28ZM1227.68 265.92C1212.64 265.92 1200.32 262.48 1190.72 255.6C1181.28 248.56 1176 239.04 1174.88 227.04H1192.16C1192.96 234.4 1196.4 240.4 1202.48 245.04C1208.72 249.52 1217.04 251.76 1227.44 251.76C1236.56 251.76 1243.68 249.6 1248.8 245.28C1254.08 240.96 1256.72 235.6 1256.72 229.2C1256.72 224.72 1255.28 221.04 1252.4 218.16C1249.52 215.28 1245.84 213.04 1241.36 211.44C1237.04 209.68 1231.12 207.84 1223.6 205.92C1213.84 203.36 1205.92 200.8 1199.84 198.24C1193.76 195.68 1188.56 191.92 1184.24 186.96C1180.08 181.84 1178 175.04 1178 166.56C1178 160.16 1179.92 154.24 1183.76 148.8C1187.6 143.36 1193.04 139.04 1200.08 135.84C1207.12 132.64 1215.12 131.04 1224.08 131.04C1238.16 131.04 1249.52 134.64 1258.16 141.84C1266.8 148.88 1271.44 158.64 1272.08 171.12H1255.28C1254.8 163.44 1251.76 157.28 1246.16 152.64C1240.72 147.84 1233.2 145.44 1223.6 145.44C1215.12 145.44 1208.24 147.44 1202.96 151.44C1197.68 155.44 1195.04 160.4 1195.04 166.32C1195.04 171.44 1196.56 175.68 1199.6 179.04C1202.8 182.24 1206.72 184.8 1211.36 186.72C1216 188.48 1222.24 190.48 1230.08 192.72C1239.52 195.28 1247.04 197.76 1252.64 200.16C1258.24 202.56 1263.04 206.08 1267.04 210.72C1271.04 215.36 1273.12 221.52 1273.28 229.2C1273.28 236.24 1271.36 242.56 1267.52 248.16C1263.68 253.6 1258.32 257.92 1251.44 261.12C1244.56 264.32 1236.64 265.92 1227.68 265.92ZM1313.31 108.24C1309.95 108.24 1307.07 107.04 1304.67 104.64C1302.27 102.24 1301.07 99.28 1301.07 95.76C1301.07 92.24 1302.27 89.36 1304.67 87.12C1307.07 84.72 1309.95 83.52 1313.31 83.52C1316.67 83.52 1319.55 84.72 1321.95 87.12C1324.35 89.36 1325.55 92.24 1325.55 95.76C1325.55 99.28 1324.35 102.24 1321.95 104.64C1319.55 107.04 1316.67 108.24 1313.31 108.24ZM1321.71 132.96V264H1304.91V132.96H1321.71ZM1404.87 265.92C1389.83 265.92 1377.51 262.48 1367.91 255.6C1358.47 248.56 1353.19 239.04 1352.07 227.04H1369.35C1370.15 234.4 1373.59 240.4 1379.67 245.04C1385.91 249.52 1394.23 251.76 1404.63 251.76C1413.75 251.76 1420.87 249.6 1425.99 245.28C1431.27 240.96 1433.91 235.6 1433.91 229.2C1433.91 224.72 1432.47 221.04 1429.59 218.16C1426.71 215.28 1423.03 213.04 1418.55 211.44C1414.23 209.68 1408.31 207.84 1400.79 205.92C1391.03 203.36 1383.11 200.8 1377.03 198.24C1370.95 195.68 1365.75 191.92 1361.43 186.96C1357.27 181.84 1355.19 175.04 1355.19 166.56C1355.19 160.16 1357.11 154.24 1360.95 148.8C1364.79 143.36 1370.23 139.04 1377.27 135.84C1384.31 132.64 1392.31 131.04 1401.27 131.04C1415.35 131.04 1426.71 134.64 1435.35 141.84C1443.99 148.88 1448.63 158.64 1449.27 171.12H1432.47C1431.99 163.44 1428.95 157.28 1423.35 152.64C1417.91 147.84 1410.39 145.44 1400.79 145.44C1392.31 145.44 1385.43 147.44 1380.15 151.44C1374.87 155.44 1372.23 160.4 1372.23 166.32C1372.23 171.44 1373.75 175.68 1376.79 179.04C1379.99 182.24 1383.91 184.8 1388.55 186.72C1393.19 188.48 1399.43 190.48 1407.27 192.72C1416.71 195.28 1424.23 197.76 1429.83 200.16C1435.43 202.56 1440.23 206.08 1444.23 210.72C1448.23 215.36 1450.31 221.52 1450.47 229.2C1450.47 236.24 1448.55 242.56 1444.71 248.16C1440.87 253.6 1435.51 257.92 1428.63 261.12C1421.75 264.32 1413.83 265.92 1404.87 265.92ZM1503.93 147.12V228.48C1503.93 236.48 1505.45 242 1508.49 245.04C1511.53 248.08 1516.89 249.6 1524.57 249.6H1539.93V264H1521.93C1510.09 264 1501.29 261.28 1495.53 255.84C1489.77 250.24 1486.89 241.12 1486.89 228.48V147.12H1468.65V132.96H1486.89V100.08H1503.93V132.96H1539.93V147.12H1503.93ZM1686.2 191.76C1686.2 197.52 1686.04 201.92 1685.72 204.96H1577C1577.48 214.88 1579.88 223.36 1584.2 230.4C1588.52 237.44 1594.2 242.8 1601.24 246.48C1608.28 250 1615.96 251.76 1624.28 251.76C1635.16 251.76 1644.28 249.12 1651.64 243.84C1659.16 238.56 1664.12 231.44 1666.52 222.48H1684.28C1681.08 235.28 1674.2 245.76 1663.64 253.92C1653.24 261.92 1640.12 265.92 1624.28 265.92C1611.96 265.92 1600.92 263.2 1591.16 257.76C1581.4 252.16 1573.72 244.32 1568.12 234.24C1562.68 224 1559.96 212.08 1559.96 198.48C1559.96 184.88 1562.68 172.96 1568.12 162.72C1573.56 152.48 1581.16 144.64 1590.92 139.2C1600.68 133.76 1611.8 131.04 1624.28 131.04C1636.76 131.04 1647.64 133.76 1656.92 139.2C1666.36 144.64 1673.56 152 1678.52 161.28C1683.64 170.4 1686.2 180.56 1686.2 191.76ZM1669.16 191.28C1669.32 181.52 1667.32 173.2 1663.16 166.32C1659.16 159.44 1653.64 154.24 1646.6 150.72C1639.56 147.2 1631.88 145.44 1623.56 145.44C1611.08 145.44 1600.44 149.44 1591.64 157.44C1582.84 165.44 1577.96 176.72 1577 191.28H1669.16ZM1709.26 198.48C1709.26 184.88 1711.98 173.04 1717.42 162.96C1722.86 152.72 1730.38 144.88 1739.98 139.44C1749.58 133.84 1760.54 131.04 1772.86 131.04C1789.02 131.04 1802.3 135.04 1812.7 143.04C1823.26 151.04 1830.06 161.92 1833.1 175.68H1815.1C1812.86 166.24 1807.98 158.88 1800.46 153.6C1793.1 148.16 1783.9 145.44 1772.86 145.44C1764.06 145.44 1756.14 147.44 1749.1 151.44C1742.06 155.44 1736.46 161.44 1732.3 169.44C1728.3 177.28 1726.3 186.96 1726.3 198.48C1726.3 210 1728.3 219.76 1732.3 227.76C1736.46 235.76 1742.06 241.76 1749.1 245.76C1756.14 249.76 1764.06 251.76 1772.86 251.76C1783.9 251.76 1793.1 249.12 1800.46 243.84C1807.98 238.4 1812.86 230.88 1815.1 221.28H1833.1C1830.06 234.72 1823.26 245.52 1812.7 253.68C1802.14 261.84 1788.86 265.92 1772.86 265.92C1760.54 265.92 1749.58 263.2 1739.98 257.76C1730.38 252.16 1722.86 244.32 1717.42 234.24C1711.98 224 1709.26 212.08 1709.26 198.48Z"/>
  </svg>`;
}

function getHousePinLogoSvg(variant: 'original' | 'deep' | 'mono-dark' | 'mono-light' | 'reverse') {
  let mainColor = "currentColor";
  let cutoutColor = "#ffffff";
  if (variant === "mono-light" || variant === "reverse") {
    mainColor = "#ffffff";
    cutoutColor = "#111A1A";
  } else if (variant === "mono-dark") {
    mainColor = "#1A1A1A";
    cutoutColor = "#ffffff";
  } else if (variant === "deep") {
    mainColor = "#0A1F1E";
    cutoutColor = "#ffffff";
  } else {
    mainColor = "#1A1A1A";
    cutoutColor = "#ffffff";
  }
  return `<svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="68" y="10" width="8" height="18" fill="${mainColor}" />
    <path d="M50 2L10 32H26V58H74V32H90L50 2Z" fill="${mainColor}" />
    <path d="M50 115C32 95 18 76 18 57C18 40 32 26 50 26C68 26 82 40 82 57C82 76 68 95 50 115Z" fill="${mainColor}" />
    <circle cx="50" cy="57" r="18" fill="${cutoutColor}" />
    <path d="M42 63V54C42 49.58 45.58 46 50 46C54.42 46 58 49.58 58 54V63H42Z" fill="${mainColor}" />
    <rect x="38" y="64" width="24" height="2" fill="${mainColor}" />
    <line x1="50" y1="46" x2="50" y2="63" stroke="${cutoutColor}" stroke-width="1" />
    <line x1="42" y1="55" x2="58" y2="55" stroke="${cutoutColor}" stroke-width="1" />
  </svg>`;
}

/**
 * Gera os textos de UI de demonstração (hero de app, mobile cards, etc.)
 * 100% dinâmico: baseado nos dados reais do briefing e da essência da marca.
 * Sem detecção de nicho por nome — usa brand.briefing.nicho e brand.briefing.tomDeVoz.
 */
function getAppTexts(brand: BrandData) {
  const nicho = brand.briefing?.nicho?.toLowerCase() ?? "";
  const publicoAlvo = brand.briefing?.publicoAlvo ?? "clientes";
  const tom = brand.briefing?.tomDeVoz?.toLowerCase() ?? "";
  const heroTitle = getCleanHeroTitle(brand);
  const desc = getCleanHeroDescription(brand);

  // CTA labels adaptados ao tom de voz
  const isDescontraido = tom.includes("descontraíd") || tom.includes("humano") || tom.includes("casual") || tom.includes("jovem");
  const isFormal = tom.includes("formal") || tom.includes("técnico") || tom.includes("corporativo");
  const btn1 = isFormal ? "Solicitar proposta" : isDescontraido ? "Bora conversar" : "Falar com especialista";
  const btn2 = isFormal ? "Ver documentação" : isDescontraido ? "Ver o que fazemos" : "Conhecer soluções";

  // Menu items adaptados ao nicho
  const getMenuItems = (): [string, string, string] => {
    if (nicho.includes("saúde") || nicho.includes("saude") || nicho.includes("clínica") || nicho.includes("médico"))
      return ["Tratamentos", "Sobre nós", "Agendar"];
    if (nicho.includes("imóvel") || nicho.includes("imobil") || nicho.includes("construção") || nicho.includes("arquitetura"))
      return ["Imóveis", "Serviços", "Contato"];
    if (nicho.includes("moda") || nicho.includes("fashion") || nicho.includes("vestuário") || nicho.includes("luxo"))
      return ["Coleção", "Sobre", "Loja"];
    if (nicho.includes("aliment") || nicho.includes("restaurante") || nicho.includes("food") || nicho.includes("gastronomia"))
      return ["Cardápio", "Nossa história", "Reservas"];
    if (nicho.includes("educa") || nicho.includes("ensino") || nicho.includes("curso"))
      return ["Cursos", "Sobre", "Matricule-se"];
    if (nicho.includes("finanç") || nicho.includes("invest") || nicho.includes("contabil"))
      return ["Serviços", "Resultados", "Consultoria"];
    return ["Soluções", "Sobre nós", "Contato"];
  };

  // Mobile items adaptados ao nicho
  const getMobileItems = (): [string, string, string] => {
    if (nicho.includes("saúde") || nicho.includes("saude") || nicho.includes("clínica"))
      return ["Consultas", "Exames", "Resultados"];
    if (nicho.includes("imóvel") || nicho.includes("imobil") || nicho.includes("construção"))
      return ["Documentação", "Vistoria", "Contrato"];
    if (nicho.includes("moda") || nicho.includes("fashion"))
      return ["Nova Coleção", "Pedidos", "Favoritos"];
    if (nicho.includes("educa") || nicho.includes("curso"))
      return ["Aulas", "Progresso", "Certificados"];
    if (nicho.includes("finanç") || nicho.includes("invest"))
      return ["Portfólio", "Relatórios", "Suporte"];
    return ["Serviços", "Projetos", "Mensagens"];
  };

  const [menuItem1, menuItem2, menuItem3] = getMenuItems();
  const [mobileItem1, mobileItem2, mobileItem3] = getMobileItems();

  return {
    heroTitle,
    heroDesc: desc,
    button1: btn1,
    button2: btn2,
    mobileGreeting: `Olá, ${publicoAlvo.split(" ")[0] || "Cliente"}.`,
    mobileSub: brand.briefing?.diferenciais
      ? brand.briefing.diferenciais.split(",")[0].trim() + " disponível."
      : "Seu painel está atualizado.",
    mobileItems: [mobileItem1, mobileItem2, mobileItem3],
    mobileBtn: isFormal ? "Acessar relatório" : isDescontraido ? "Ver meu painel" : "Ir para o painel",
    cardTitle1: "Destaque",
    cardSub1: brand.values?.[0]?.name ? `${brand.values[0].name} em foco` : "Novidades disponíveis",
    cardTitle2: "Diferenciais",
    cardSub2: brand.briefing?.diferenciais?.split(",")[0]?.trim() || "Nossa metodologia",
    cardTitle3: "Sobre nós",
    cardSub3: brand.briefing?.personalidade || "Faça parte do nosso time",
    menuItem1, menuItem2, menuItem3,
  };
}

/**
 * Gera as diretrizes de fotografia baseadas no nicho e tom do brand.
 * 100% dinâmico via brand.briefing.nicho — sem heurísticas de nome.
 */
function getImageStyleData(brand: BrandData) {
  const nicho = brand.briefing?.nicho?.toLowerCase() ?? "";
  const publicoAlvo = brand.briefing?.publicoAlvo ?? "o público-alvo";
  const estiloVisual = brand.briefing?.estiloVisual?.toLowerCase() ?? "";
  const primary = brand.palette.primary[0]?.hex || "#4f46e5";
  const secondary = brand.palette.secondary[0]?.hex || "#06b6d4";
  const accent = brand.palette.accent[0]?.hex || "#f59e0b";

  // Determina categorias fotográficas baseadas no nicho real
  const isHealth = nicho.includes("saúde") || nicho.includes("saude") || nicho.includes("clínica") || nicho.includes("médico") || nicho.includes("estética") || nicho.includes("fisioterapia");
  const isRealEstate = nicho.includes("imóvel") || nicho.includes("imobil") || nicho.includes("construção") || nicho.includes("arquitetura");
  const isTech = nicho.includes("tech") || nicho.includes("software") || nicho.includes("saas") || nicho.includes("ti ") || nicho.includes("digital") || brand.id === "microsistec";
  const isFashion = nicho.includes("moda") || nicho.includes("fashion") || nicho.includes("vestuário") || nicho.includes("luxo");
  const isFood = nicho.includes("aliment") || nicho.includes("restaurante") || nicho.includes("food") || nicho.includes("gastronomia") || nicho.includes("café");
  const isEducation = nicho.includes("educa") || nicho.includes("ensino") || nicho.includes("curso") || nicho.includes("treinamento");

  if (isHealth) {
    return {
      intro: `Imagens transmitem confiança clínica e cuidado humano — sem clichês médicos. Foco em ${publicoAlvo} em contextos reais de cuidado e recuperação.`,
      categories: [
        { t: "Ambiente & Cuidado", desc: "Espaços limpos, bem iluminados e humanizados. Priorize luz natural e equipe em ação real.", icon: "🏥", gradient: `linear-gradient(135deg, ${primary}22 0%, ${secondary}33 50%, ${accent}22 100%)` },
        { t: "Paciente & Resultado", desc: "Momentos autênticos de recuperação, progresso ou consulta. Expressões naturais, sem poses forçadas.", icon: "🤲", gradient: `linear-gradient(135deg, ${accent}22 0%, ${primary}33 50%, ${secondary}22 100%)` },
        { t: "Equipe & Expertise", desc: "Profissionais em ação real — não posados. Transmita competência e empatia simultâneas.", icon: "👩‍⚕️", gradient: `linear-gradient(135deg, ${secondary}22 0%, ${accent}33 50%, ${primary}22 100%)` },
      ],
      doItems: ["Luz natural e suave", "Ambientes organizados e humanizados", "Equipe em contexto real", "Cores calmas alinhadas à paleta"],
      dontItems: ["Estetoscópio ou seringa em destaque", "Branco frio e asséptico demais", "Sorrisos exagerados de stock", "Imagens hospitalares genéricas"],
    };
  }

  if (isRealEstate) {
    return {
      intro: `Imagens transmitem aspiração, solidez e pertencimento — ambientes que evocam o que ${publicoAlvo} deseja conquistar.`,
      categories: [
        { t: "Espaços & Interiores", desc: "Luz natural, composição equilibrada e atmosfera acolhedora. Destaque os melhores ângulos de cada ambiente.", icon: "🏠", gradient: `linear-gradient(135deg, ${primary}22 0%, ${secondary}33 50%, ${accent}22 100%)` },
        { t: "Momentos de Conquista", desc: "Pessoas reais em situações autênticas — visita ao imóvel, assinatura ou celebração da nova fase.", icon: "🤝", gradient: `linear-gradient(135deg, ${accent}22 0%, ${primary}33 50%, ${secondary}22 100%)` },
        { t: "Fachada & Entorno", desc: "Exteriores com céu limpo e paisagismo valorizado. Transmita segurança e desejo ao primeiro olhar.", icon: "🏗️", gradient: `linear-gradient(135deg, ${secondary}22 0%, ${accent}33 50%, ${primary}22 100%)` },
      ],
      doItems: ["Luz natural abundante", "Ambientes organizados e amplos", "Perspectivas que valorizam o espaço", "Pessoas diversas e autênticas"],
      dontItems: ["Fotos escuras ou com flash duro", "Bagunça ou objetos pessoais visíveis", "Ângulos distorcidos ou fisheye", "Imagens genéricas de banco"],
    };
  }

  if (isFashion) {
    return {
      intro: `Imagens comunicam o universo estético de ${brand.name} — editorial, intencional e com identidade visual coerente com a paleta da marca.`,
      categories: [
        { t: "Editorial & Produto", desc: "Composição intencional, luz controlada e foco absoluto no item. Espaço negativo generoso.", icon: "📷", gradient: `linear-gradient(135deg, ${primary}22 0%, ${secondary}33 50%, ${accent}22 100%)` },
        { t: "Lifestyle & Uso", desc: `${publicoAlvo} usando a peça em contexto real. Situações aspiracionais mas verossímeis.`, icon: "✨", gradient: `linear-gradient(135deg, ${accent}22 0%, ${primary}33 50%, ${secondary}22 100%)` },
        { t: "Ambiente & Conceito", desc: "Cenários que reforçam o posicionamento da marca. Cores e texturas alinhadas à paleta da identidade.", icon: "🎨", gradient: `linear-gradient(135deg, ${secondary}22 0%, ${accent}33 50%, ${primary}22 100%)` },
      ],
      doItems: ["Luz controlada ou natural difusa", "Paleta de cores alinhada à marca", "Composição minimalista", "Expressões naturais e confiantes"],
      dontItems: ["Filtros vintage ou supersaturados", "Cenários genéricos ou poluídos", "Logos concorrentes visíveis", "Edição excessiva ou filtros de beleza"],
    };
  }

  if (isFood) {
    return {
      intro: `Imagens evocam a experiência sensorial de ${brand.name} — textura, frescor, cuidado no preparo e o prazer compartilhado.`,
      categories: [
        { t: "Produto & Apresentação", desc: "Close nos pratos ou produtos com foco em textura e frescor. Iluminação que valorize as cores naturais.", icon: "🍽️", gradient: `linear-gradient(135deg, ${primary}22 0%, ${secondary}33 50%, ${accent}22 100%)` },
        { t: "Processo & Preparo", desc: "Bastidores reais do preparo — mãos em ação, ingredientes frescos, equipe engajada.", icon: "👨‍🍳", gradient: `linear-gradient(135deg, ${accent}22 0%, ${primary}33 50%, ${secondary}22 100%)` },
        { t: "Experiência & Contexto", desc: "Pessoas desfrutando o momento — refeições, encontros, entrega. Emoção genuína sem poses.", icon: "☕", gradient: `linear-gradient(135deg, ${secondary}22 0%, ${accent}33 50%, ${primary}22 100%)` },
      ],
      doItems: ["Luz natural quente", "Foco em textura e frescor", "Cenários limpos e aconchegantes", "Momento de fruição genuíno"],
      dontItems: ["Fotos frias ou com flash duro", "Pratos já consumidos", "Ângulo de baixo para cima forçado", "Excesso de adereços no cenário"],
    };
  }

  if (isEducation) {
    return {
      intro: `Imagens traduzem o impacto concreto do aprendizado — progresso visível, colaboração real e ${publicoAlvo} em ação.`,
      categories: [
        { t: "Aprendizado & Ação", desc: "Pessoas engajadas no processo de aprendizagem — não posadas. Expressões de concentração e descoberta.", icon: "📚", gradient: `linear-gradient(135deg, ${primary}22 0%, ${secondary}33 50%, ${accent}22 100%)` },
        { t: "Resultado & Transformação", desc: "Antes/depois, diplomas, apresentações concluídas. Celebre o progresso de forma autêntica.", icon: "🏆", gradient: `linear-gradient(135deg, ${accent}22 0%, ${primary}33 50%, ${secondary}22 100%)` },
        { t: "Ambiente & Comunidade", desc: "Espaços de estudo, colaboração entre alunos e professores em contexto real.", icon: "👥", gradient: `linear-gradient(135deg, ${secondary}22 0%, ${accent}33 50%, ${primary}22 100%)` },
      ],
      doItems: ["Ambientes bem iluminados", "Diversidade real", "Foco em expressões de engajamento", "Tecnologia como ferramenta, não cenário"],
      dontItems: ["Poses artificiais de 'estudante feliz'", "Espaços genéricos de biblioteca", "Imagens de stock óbvias", "Uniformes obrigatórios ou frieza excessiva"],
    };
  }

  if (isTech) {
    return {
      intro: `Imagens comunicam operação real e consequência técnica — não estética de tendência. ${publicoAlvo} quer ver competência, não decoração.`,
      categories: [
        { t: "Detalhe & Precisão", desc: "Foco em elementos técnicos reais — código, interface, hardware. Transmite domínio sem exagero.", icon: "⚙️", gradient: `linear-gradient(135deg, ${primary}22 0%, ${secondary}33 50%, ${primary}11 100%)` },
        { t: "Equipe em Contexto", desc: "Colaboração genuína, reuniões reais, co-criação. Mostre o time que entrega — sem encenação.", icon: "👥", gradient: `linear-gradient(135deg, ${accent}22 0%, ${primary}33 50%, ${secondary}22 100%)` },
        { t: "Resultado & Escala", desc: "Dashboards reais, infraestrutura em operação, métricas. O impacto do produto visível em dados.", icon: "📊", gradient: `linear-gradient(135deg, ${secondary}22 0%, ${primary}33 50%, ${accent}22 100%)` },
      ],
      doItems: ["Composição com respiro e foco", "Luz natural ou monocromática", "Contexto de uso real", "Pessoas em situação genuína"],
      dontItems: ["Sorrisos de stock genérico", "Gradientes decorativos sem propósito", "Ícones de tecnologia clichê", "Imagens de 'inovação' sem contexto"],
    };
  }

  // Default: marcas de serviço/outros — totalmente personalizado com dados reais
  const isMinimal = estiloVisual.includes("minimal");
  const isBold = estiloVisual.includes("bold") || estiloVisual.includes("impactante");
  return {
    intro: `Imagens de ${brand.name} devem comunicar autenticidade e proximidade com ${publicoAlvo}. ${isMinimal ? "Composição limpa, espaço negativo generoso e cores alinhadas à paleta." : isBold ? "Visual impactante, composições dinâmicas e uso intencional da paleta da marca." : "Iluminação equilibrada, contexto real e expressões genuínas em primeiro lugar."}`,
    categories: [
      { t: "Produto ou Serviço", desc: `Valorize o que ${brand.name} entrega — cenário limpo, iluminação adequada e foco no que mais importa para ${publicoAlvo}.`, icon: "✨", gradient: `linear-gradient(135deg, ${primary}22 0%, ${secondary}33 50%, ${accent}22 100%)` },
      { t: "Pessoas & Cultura", desc: "Equipe real em ação, colaboração genuína e diversidade. Evite poses corporativas artificiais.", icon: "💼", gradient: `linear-gradient(135deg, ${accent}22 0%, ${primary}33 50%, ${secondary}22 100%)` },
      { t: "Contexto & Lifestyle", desc: `${publicoAlvo} interagindo com a marca no cotidiano. Situações verossímeis que criam identificação.`, icon: "📸", gradient: `linear-gradient(135deg, ${secondary}22 0%, ${accent}33 50%, ${primary}22 100%)` },
    ],
    doItems: ["Iluminação natural e equilibrada", "Composição intencional", `Paleta de cores de ${brand.name} nos cenários`, "Expressões naturais e espontâneas"],
    dontItems: ["Imagens genéricas de banco", "Filtros exagerados ou vintage", "Cenários desorganizados ou aleatórios", "Texto sobreposto diretamente nas fotos"],
  };
}

function BrandBookRoute() {
  const { brandId } = Route.useParams();
  const router = useRouter();
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin Auth Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authPendingAction, setAuthPendingAction] = useState<"edit" | "delete" | null>(null);

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated());
  }, []);

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(authPassword)) {
      setIsAdmin(true);
      setShowAuthModal(false);
      setAuthPassword("");
      toast.success("Acesso administrativo autorizado!");
      if (authPendingAction === "edit") {
        handleOpenEditModal();
      } else if (authPendingAction === "delete") {
        setDeleteConfirmText("");
        setShowDeleteModal(true);
      }
      setAuthPendingAction(null);
    } else {
      toast.error("Senha incorreta. Tente novamente.");
    }
  };

  const handleDownloadLogo = async (variant: 'original' | 'deep' | 'mono-dark' | 'mono-light' | 'reverse', withWordmark: boolean, nameSuffix: string) => {
    if (!brand) return;
    
    const nameLower = brand.name.toLowerCase();
    const hasCustomLogo = !!(brand.logoUrl || brand.symbolUrl || brand.logoReverseUrl || brand.symbolReverseUrl);
    const isYellowImoveisDefault = (nameLower.includes("yellow") || nameLower.includes("imoveis") || nameLower.includes("imóveis")) && !hasCustomLogo;

    if (isYellowImoveisDefault) {
      const svgContent = getHousePinLogoSvg(variant);
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brand.id}-logo-${nameSuffix}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Logo ${nameSuffix} baixada com sucesso em formato SVG!`);
      return;
    }

    if (brand.id === "microsistec" || !brand.logoUrl) {
      const svgContent = getMicrosistecSvg(variant, withWordmark);
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brand.id}-logo-${nameSuffix}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Logo ${nameSuffix} baixada com sucesso em formato SVG!`);
    } else {
      toast.loading("Gerando versão de logotipo...", { id: "logo-download" });
      try {
        const logoSource = (!withWordmark && brand.symbolUrl) ? brand.symbolUrl : brand.logoUrl;
        const base64Filtered = await getFilteredLogoBase64(logoSource, variant === 'deep' ? 'original' : (variant as any));
        const a = document.createElement("a");
        a.href = base64Filtered;
        a.download = `${brand.id}-${withWordmark ? "logo" : "simbolo"}-${nameSuffix}.png`;
        a.click();
        toast.success(`Logo ${nameSuffix} baixada com sucesso!`, { id: "logo-download" });
      } catch (err) {
        toast.error("Erro ao gerar variação do logotipo", { id: "logo-download" });
      }
    }
  };
  
  const [darkMode, setDarkMode] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [goldenOverlay, setGoldenOverlay] = useState<"none" | "spiral" | "circles" | "grid">("spiral");
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBrandName, setEditBrandName] = useState("");
  const [editHeroTitle, setEditHeroTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLogoBase64, setEditLogoBase64] = useState<string>("");
  const [editSymbolBase64, setEditSymbolBase64] = useState<string>("");
  const [editLogoReverseBase64, setEditLogoReverseBase64] = useState<string>("");
  const [editSymbolReverseBase64, setEditSymbolReverseBase64] = useState<string>("");
  const [editMission, setEditMission] = useState("");
  const [editVision, setEditVision] = useState("");
  const [editPromise, setEditPromise] = useState("");
  const [editPrimaryColor, setEditPrimaryColor] = useState("#4f46e5");
  const [editSecondaryColor, setEditSecondaryColor] = useState("#06b6d4");
  const [editAccentColor, setEditAccentColor] = useState("#f59e0b");
  const [editCustomDomain, setEditCustomDomain] = useState("");

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDeleteBrand = () => {
    if (!brand) return;
    try {
      // Remove from localStorage brands
      const stored = localStorage.getItem("custom_brands");
      if (stored) {
        const brands: BrandData[] = JSON.parse(stored);
        const filtered = sortBrandsWithMicrosistecFirst(brands.filter(b => b.id !== brand.id));
        localStorage.setItem("custom_brands", JSON.stringify(filtered));
      }

      // Track as deleted (so server brands are also hidden)
      const deletedIds: string[] = JSON.parse(localStorage.getItem("deleted_brand_ids") || "[]");
      if (!deletedIds.includes(brand.id)) {
        deletedIds.push(brand.id);
        localStorage.setItem("deleted_brand_ids", JSON.stringify(deletedIds));
      }

      // Sync deletion with server
      deleteBrandServer({ data: { id: brand.id } }).catch((err: any) => {
        console.error("Failed to delete brand from server:", err);
      });

      toast.success("Manual de Marca excluído com sucesso!");
      setShowDeleteModal(false);
      setShowEditModal(false);
      router.navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir o manual.");
    }
  };

  const handleOpenEditModal = () => {
    if (!brand) return;
    setEditBrandName(brand.name);
    setEditHeroTitle(brand.heroTitle || getCleanHeroTitle(brand));
    setEditDescription(brand.description);
    setEditLogoBase64(brand.logoUrl || "");
    setEditSymbolBase64(brand.symbolUrl || "");
    setEditLogoReverseBase64(brand.logoReverseUrl || "");
    setEditSymbolReverseBase64(brand.symbolReverseUrl || "");
    setEditMission(brand.mission || "");
    setEditVision(brand.vision || "");
    setEditPromise(brand.promise || "");
    setEditPrimaryColor(brand.palette.primary[0]?.hex || "#4f46e5");
    setEditSecondaryColor(brand.palette.secondary[0]?.hex || "#06b6d4");
    setEditAccentColor(brand.palette.accent[0]?.hex || "#f59e0b");
    setEditCustomDomain(brand.customDomain || "");
    setShowEditModal(true);
  };

  const handleEditLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditLogoBase64(reader.result as string);
      toast.success("Logotipo carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleEditSymbolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditSymbolBase64(reader.result as string);
      toast.success("Símbolo carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleEditLogoReverseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditLogoReverseBase64(reader.result as string);
      toast.success("Logotipo reverso carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleEditSymbolReverseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditSymbolReverseBase64(reader.result as string);
      toast.success("Símbolo reverso carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;

    const updatedBrand: BrandData = {
      ...brand,
      name: editBrandName,
      heroTitle: editHeroTitle.trim() || undefined,
      description: editDescription,
      logoUrl: editLogoBase64 || undefined,
      symbolUrl: editSymbolBase64 || undefined,
      logoReverseUrl: editLogoReverseBase64 || undefined,
      symbolReverseUrl: editSymbolReverseBase64 || undefined,
      mission: editMission,
      vision: editVision,
      promise: editPromise,
      customDomain: editCustomDomain.trim() || undefined,
      palette: {
        primary: [
          { name: `${editBrandName} Principal`, hex: editPrimaryColor, role: "Cor principal da identidade da marca.", token: "--color-brand-primary" },
          { name: "Charcoal", hex: "#1A1A1A", role: "Wordmark e texto principal.", token: "--ink" },
        ],
        secondary: [
          { name: `${editBrandName} Secundária`, hex: editSecondaryColor, role: "Cor de suporte para elementos secundários.", token: "--color-brand-secondary" },
          { name: "Light Tint", hex: `${editSecondaryColor}22`, role: "Backgrounds suaves e realces.", token: "--color-brand-secondary-tint" },
          { name: "Dark Shade", hex: "#111827", role: "Profundidade e dark UI.", token: "--color-brand-dark" },
        ],
        accent: [
          { name: `${editBrandName} Acento`, hex: editAccentColor, role: "Acento dinâmico para alertas e destaques.", token: "--color-brand-accent" },
          { name: "Cream Background", hex: "#FDFBF7", role: "Fundo alternativo suave.", token: "--color-brand-cream" },
        ],
        neutrals: brand.palette.neutrals,
      }
    };

     const stored = localStorage.getItem("custom_brands");
     let currentBrands: BrandData[] = [];
     if (stored) {
       try {
         currentBrands = JSON.parse(stored);
       } catch (err) {
         console.error(err);
       }
     }
     const exists = currentBrands.some(b => b.id === brand.id);
     let updatedBrands: BrandData[];
     if (exists) {
       updatedBrands = sortBrandsWithMicrosistecFirst(currentBrands.map(b => b.id === brand.id ? updatedBrand : b));
     } else {
       updatedBrands = sortBrandsWithMicrosistecFirst([...currentBrands, updatedBrand]);
     }
     localStorage.setItem("custom_brands", JSON.stringify(updatedBrands));

      // Sync modifications to the server
      try {
        await saveBrandServer({ data: updatedBrand });
      } catch (err: any) {
        console.error("Failed to sync updated brand to server:", err);
      }

    setBrand(updatedBrand);
    toast.success("Manual de Marca atualizado com sucesso!");
    setShowEditModal(false);
  };
  
  // Typo tester states
  const [customText, setCustomText] = useState("Engenharia digital, sem fricção.");
  const [fontSize, setFontSize] = useState(36);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [letterSpacing, setLetterSpacing] = useState(-0.02);

  // Contrast checker states
  const [contrastFg, setContrastFg] = useState("#2B5250");
  const [contrastBg, setContrastBg] = useState("#F7F3EA");

  useEffect(() => {
    // Fetch server brands and merge with localStorage
    const loadBrand = async () => {
      let serverBrand: BrandData | null = null;
      let serverBrands: BrandData[] = [];

      try {
        const fetched = await getBrandByIdServer({ data: { id: brandId } });
        if (fetched) {
          serverBrand = fetched as BrandData;
        } else {
          serverBrands = (await loadBrandsServer()) as BrandData[];
        }
      } catch (err) {
        console.warn("[brand-loader] Falha ao carregar do servidor:", err);
      }

      const localStored = localStorage.getItem("custom_brands");
      const deletedIds: string[] = JSON.parse(localStorage.getItem("deleted_brand_ids") || "[]");

      let localBrands: BrandData[] = [];
      if (localStored) {
        try { localBrands = JSON.parse(localStored); } catch { /* ignore */ }
      }

      // Merge: defaults first, then server, then localStorage
      const map = new Map<string, BrandData>();
      for (const b of DEFAULT_BRANDS) {
        if (b && !deletedIds.includes(b.id)) map.set(b.id, b as BrandData);
      }
      for (const b of serverBrands) {
        if (b && !deletedIds.includes(b.id)) map.set(b.id, b);
      }
      for (const b of localBrands) {
        if (b && !deletedIds.includes(b.id)) map.set(b.id, b);
      }
      if (serverBrand && !deletedIds.includes(serverBrand.id)) {
        map.set(serverBrand.id, serverBrand);
      }

      const allMerged = Array.from(map.values());
      const found = matchBrandByIdOrSlug(allMerged, brandId) || 
                    (serverBrand ? matchBrandByIdOrSlug([serverBrand], brandId) : null) ||
                    matchBrandByIdOrSlug(DEFAULT_BRANDS as BrandData[], brandId);

      if (found) {
        setBrand(found);
        setNotFound(false);
        setContrastFg(found.palette?.primary?.[0]?.hex || "#2B5250");
        setContrastBg(found.palette?.accent?.[1]?.hex || found.palette?.neutrals?.[0]?.hex || "#F7F3EA");
      } else {
        setBrand(null);
        setNotFound(true);
      }
    };
    loadBrand();
  }, [brandId]);

  // Force theme to light mode
  useEffect(() => {
    setDarkMode(false);
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  useEffect(() => {
    let keys = "";
    const secretCode = "admin";

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em algum campo de texto
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      keys += e.key.toLowerCase();

      if (keys.length > secretCode.length) {
        keys = keys.slice(-secretCode.length);
      }

      if (keys === secretCode) {
        keys = "";
        if (isAdminAuthenticated()) {
          setIsAdmin(true);
          handleOpenEditModal();
        } else {
          setAuthPendingAction("edit");
          setShowAuthModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [brand]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <Toaster position="top-center" duration={3000} richColors />
        <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-border shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Manual não encontrado</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            O manual de marca com identificador <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground font-semibold">{decodeURIComponent(brandId)}</code> não foi localizado ou foi removido.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => router.navigate({ to: "/" })}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Acessar Painel Administrativo
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full py-2.5 px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à página anterior
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!brand) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  const primaryColor = brand.palette.primary[0].hex;
  const accentColor = brand.palette.accent[0]?.hex || "#E8A14B";
  const secondaryColor = brand.palette.secondary[0]?.hex || "#5AA6A6";
  const appTexts = getAppTexts(brand);
  const imageStyle = getImageStyleData(brand);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-x-hidden" style={{
      ["--primary" as any]: primaryColor,
      ["--teal-deep" as any]: primaryColor,
      ["--teal-mid" as any]: secondaryColor,
      ["--teal-light" as any]: brand.palette.secondary[1]?.hex || "#7CC1C1",
      ["--teal-shadow" as any]: brand.palette.secondary[2]?.hex || "#1B2A2A",
      ["--amber" as any]: accentColor,
      ["--cream" as any]: brand.palette.accent[1]?.hex || "#F7F3EA",
    }}>
      <Toaster position="top-center" duration={3000} richColors />

      {/* Dynamic PDF printing styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${printOrientation};
            margin: 15mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          header, footer, button, nav, .no-print, [role="tooltip"], .toaster, [id^="toast-"] {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #111827 !important;
            font-size: 12px !important;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #111827 !important;
          }
          p {
            color: #374151 !important;
          }
          .text-muted-foreground {
            color: #4b5563 !important;
          }
          .bg-card {
            background-color: #f9fafb !important;
            border-color: #e5e7eb !important;
          }
          main, .max-w-6xl {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          section:not(#top) {
            page-break-before: always !important;
            break-before: page !important;
          }
          #top {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
          section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border-top: none !important;
            padding-top: 15px !important;
            padding-bottom: 15px !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          section > div > .grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
          section > div > .grid > div {
            position: static !important;
          }
          .grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .grid.grid-cols-2, 
          .grid.sm\\:grid-cols-2, 
          .grid.sm\\:grid-cols-4, 
          .grid.lg\\:grid-cols-3 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1rem !important;
          }
          .card, .rounded-xl, .rounded-2xl, .p-6, blockquote, table, pre {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />
      
      {/* Grid Overlay */}
      {gridMode && (
        <div className="pointer-events-none fixed inset-0 z-50 max-w-6xl mx-auto px-6 w-full h-full flex justify-between gap-6 opacity-35">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 h-full bg-teal-500/20 border-x border-dashed border-teal-500/50" />
          ))}
        </div>
      )}

      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/80 border-b border-border transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a href="#top" className="flex items-center gap-2 min-w-0">
              <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} withWordmark={false} className="h-8 w-8 shrink-0" />
              <span className="font-display font-semibold tracking-tight truncate max-w-[120px] sm:max-w-none">{brand.name}</span>
              <span className="hidden md:inline text-xs text-muted-foreground ml-2 font-mono shrink-0">/ brand v1.0</span>
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Copy Link Button */}
            <button
              id="copy-link-btn"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                  .then(() => toast.success("Link copiado! Qualquer pessoa pode acessar este manual.", { icon: "🔗" }))
                  .catch(() => toast.error("Não foi possível copiar o link."));
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium"
              title="Copiar link compartilhável"
            >
              <Link2 className="w-3.5 h-3.5" />
              Copiar Link
            </button>
            <button
              id="copy-link-btn-mobile"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                  .then(() => toast.success("Link copiado!", { icon: "🔗" }))
                  .catch(() => toast.error("Não foi possível copiar o link."));
              }}
              className="sm:hidden p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
              title="Copiar link"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Admin actions (only visible if admin is authenticated) */}
            {isAdmin ? (
              <>
                <button
                  onClick={() => router.navigate({ to: "/" })}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs font-medium"
                  title="Voltar para o Painel Geral"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Painel Admin
                </button>
                {brand.id !== "microsistec" && (
                  <>
                    <button
                      onClick={handleOpenEditModal}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs font-medium"
                      title="Editar configurações do manual"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmText("");
                        setShowDeleteModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:text-white hover:bg-destructive hover:border-destructive transition-all text-xs font-medium active:scale-95"
                      title="Excluir este manual"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthPendingAction("edit");
                  setShowAuthModal(true);
                }}
                className="p-2 rounded-lg border border-border/60 text-muted-foreground/40 hover:text-foreground hover:border-border transition-all"
                title="Acesso Administrativo"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                setGridMode(!gridMode);
                toast.info(gridMode ? "Grid desativado" : "Grid ativado");
              }}
              className={`p-2 rounded-lg border transition-all duration-300 hover:bg-muted ${gridMode ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              title="Alternar grade visual"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Navigation Menu Row */}
        <div className="border-t border-border bg-background/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-11 flex items-center overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-6 text-[11px] font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              <a href="#principios" className="hover:text-foreground transition-colors py-2">Princípios</a>
              <a href="#logo" className="hover:text-foreground transition-colors py-2">Logo</a>
              <a href="#proporcao" className="hover:text-foreground transition-colors py-2">Proporção</a>
              <a href="#paleta" className="hover:text-foreground transition-colors py-2">Paleta</a>
              <a href="#tipografia" className="hover:text-foreground transition-colors py-2">Tipografia</a>
              <a href="#iconografia" className="hover:text-foreground transition-colors py-2">Ícones</a>
              <a href="#motion" className="hover:text-foreground transition-colors py-2">Motion</a>
              <a href="#fotografia" className="hover:text-foreground transition-colors py-2">Fotos</a>
              <a href="#voz" className="hover:text-foreground transition-colors py-2">Voz</a>
              <a href="#acessibilidade" className="hover:text-foreground transition-colors py-2">Contraste</a>
              <a href="#downloads" className="hover:text-foreground transition-colors py-2">Downloads</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[108px] no-print" />

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20 md:pt-32 md:pb-32">
          <div className="text-[11px] tracking-[0.3em] uppercase text-primary font-mono mb-6">
            Manual de Marca · 2026
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl leading-tight">
            {(() => {
              const headline = getCleanHeroTitle(brand);
              const splitChar = headline.includes(" — ") ? " — " : headline.includes(", ") ? ", " : null;
              if (splitChar) {
                const [part1, ...rest] = headline.split(splitChar);
                return <>{part1}{splitChar}<span className="text-primary">{rest.join(splitChar)}</span></>;
              }
              const words = headline.split(" ");
              if (words.length > 2) {
                const mid = Math.ceil(words.length / 2);
                return <>{words.slice(0, mid).join(" ")} <span className="text-primary">{words.slice(mid).join(" ")}</span></>;
              }
              return <span className="text-foreground">{headline}</span>;
            })()}
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {getCleanHeroDescription(brand)}
          </p>
          <div className="mt-12 flex flex-wrap gap-2">
            {["Logo", "Diretrizes", "Cor", "Tipografia", "UI Kit", "Materiais"].map((t) => (
              <span key={t} className="px-3 py-1.5 text-xs rounded-full border border-border bg-card font-mono">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PRINCÍPIOS */}
      <Section id="principios" eyebrow="00 · Essência" title="O que a marca defende">
        <div className="space-y-12">
          <div className="flex flex-col gap-6">
            {[
              { k: "Missão", v: brand.mission, desc: "A razão de existir da marca todos os dias." },
              { k: "Visão", v: brand.vision, desc: "Onde pretendemos chegar a longo prazo." },
              { k: "Promessa", v: brand.promise, desc: "O compromisso inegociável com o cliente." },
            ].map((c) => (
              <div key={c.k} className="rounded-2xl border-l-4 border-y border-r border-y-border border-r-border border-l-primary bg-card p-6 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">{c.k}</div>
                  <div className="mt-3.5 font-display text-base sm:text-lg font-medium leading-relaxed text-foreground/90">{c.v}</div>
                </div>
                <div className="text-[10px] text-muted-foreground/70 font-mono mt-4 pt-2 border-t border-border/40">{c.desc}</div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="border-b border-border/60 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Diretrizes de Valores e Atitude</h3>
              <p className="text-xs text-muted-foreground mt-1">Quatro pilares fundamentais traduzidos em comportamento e identidade visual.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {brand.values.map((c, idx) => (
                <div key={c.name} className="rounded-xl border border-border bg-card p-5 relative overflow-hidden group hover:border-primary hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</div>
                    </div>
                    <div className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed font-sans">{c.description}</div>
                  </div>
                  <div className="absolute -bottom-2 -right-1 text-6xl font-mono font-bold text-foreground/[0.04] select-none pointer-events-none group-hover:text-primary/[0.07] transition-colors">
                    0{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* LOGO */}
      <Section id="logo" eyebrow="01 · Logotipo" title="A marca e seus usos">
        <div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="aspect-[16/7] flex items-center justify-center p-6 md:p-16 bg-[var(--cream)] relative overflow-hidden">
              <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="original" className="w-full max-w-2xl h-40" />
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <Meta k="Construção" v="Wordmark + símbolo geométrico baseado em dois 'M' espelhados." />
              <Meta k="Conceito" v="Conectividade, simetria e camadas — sistemas que se encaixam." />
              <Meta k="Formato" v="SVG vetorial. Distribuir em .svg, .pdf e .png." />
            </div>
          </div>

          <h3 className="mt-12 mb-4 text-lg md:text-xl font-semibold">Variações</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-5">
            <LogoCard logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Versão Original / Cor" bg="#F7F3EA" variant="original" desc="Aplicação padrão sobre fundos claros e neutros." />
            <LogoCard logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Fundo Claro / Profundo" bg="#FFFFFF" variant="deep" desc="Verde mais profundo para máxima legibilidade em branco puro." />
            <LogoCard logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Monocromática Escura" bg="#FAFBFB" variant="mono-dark" desc="Para impressão preto-e-branco e fax de baixa fidelidade." />
            <LogoCard logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Reverso / Fundo Escuro" bg="#1B2A2A" variant="reverse" desc="Aplicação sobre o Deep Shade ou imagens escuras." />
          </div>

          {/* Clearspace */}
          <h3 className="mt-14 mb-4 text-lg md:text-xl font-semibold">Área de respiro</h3>
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
            <div className="relative mx-auto" style={{ maxWidth: 720 }}>
              <div className="relative p-[12%] outline-dashed outline-1 outline-primary/40 rounded">
                <div className="relative outline-dashed outline-1 outline-primary/40 flex justify-center items-center py-8">
                  <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="original" className="w-full max-w-[240px] h-24" />
                  {/* X marks */}
                  <span className="absolute -top-3 -left-3 w-6 h-6 grid place-items-center text-xs text-primary font-mono">×</span>
                  <span className="absolute -top-3 -right-3 w-6 h-6 grid place-items-center text-xs text-primary font-mono">×</span>
                  <span className="absolute -bottom-3 -left-3 w-6 h-6 grid place-items-center text-xs text-primary font-mono">×</span>
                  <span className="absolute -bottom-3 -right-3 w-6 h-6 grid place-items-center text-xs text-primary font-mono">×</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-6 text-center leading-relaxed">
                A margem mínima ao redor da logo equivale a <span className="font-mono text-foreground">×</span>, a altura do símbolo dividida por 4. Nenhum elemento gráfico, texto ou borda pode invadir esta área.
              </p>
            </div>
          </div>

          {/* Sizes */}
          <h3 className="mt-14 mb-4 text-lg md:text-xl font-semibold">Tamanhos mínimos</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            <SizeCard label="Digital — wordmark" min="120 px de largura" sample={<DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="original" className="w-[160px] h-10 object-contain" />} />
            <SizeCard label="Digital — só símbolo" min="24 px de altura" sample={<DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="original" withWordmark={false} className="h-10 w-10 object-contain" />} />
            <SizeCard label="Impressão" min="20 mm de largura" sample={<DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="original" className="w-[140px] h-8 object-contain" />} />
          </div>

          {/* Don'ts */}
          <h3 className="mt-14 mb-4 text-lg md:text-xl font-semibold">O que evitar</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Dont logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Não distorcer" style={{ transform: "scaleX(1.4)" }} />
            <Dont logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Não recolorir" style={{ filter: "hue-rotate(120deg) saturate(2)" }} />
            <Dont logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Não rotacionar" style={{ transform: "rotate(-12deg)" }} />
            <Dont logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} label="Não aplicar sombras" style={{ filter: "drop-shadow(0 8px 4px rgba(0,0,0,.4))" }} />
          </div>
        </div>
      </Section>

      {/* PROPORÇÃO GEOMÉTRICA */}
      <Section id="proporcao" eyebrow="02 · Geometria" title="Proporção Áurea">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              O logotipo da {brand.name} foi concebido a partir de um rigoroso grid geométrico regido pela <strong>Proporção Áurea</strong> (<span className="font-mono text-foreground">&phi; = 1.618</span>). Esta constante matemática define a escala, as curvaturas e o equilíbrio de todas as proporções da identidade visual.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGoldenOverlay("spiral")}
                  className={`py-3 px-4 rounded-xl border text-left transition-all duration-300 ${goldenOverlay === "spiral" ? "border-primary bg-primary/5 text-foreground" : "border-border hover:bg-muted/50 text-muted-foreground"}`}
                >
                  <div className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E8A14B]" />
                    Espiral de Fibonacci
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">A espiral de crescimento áureo ancora as curvaturas externas.</p>
                </button>

                <button
                  onClick={() => setGoldenOverlay("circles")}
                  className={`py-3 px-4 rounded-xl border text-left transition-all duration-300 ${goldenOverlay === "circles" ? "border-primary bg-primary/5 text-foreground" : "border-border hover:bg-muted/50 text-muted-foreground"}`}
                >
                  <div className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#5AA6A6]" />
                    Círculos Proporcionais
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">Os diâmetros dos arcos seguem a progressão de Fibonacci.</p>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGoldenOverlay("grid")}
                  className={`py-3 px-4 rounded-xl border text-left transition-all duration-300 ${goldenOverlay === "grid" ? "border-primary bg-primary/5 text-foreground" : "border-border hover:bg-muted/50 text-muted-foreground"}`}
                >
                  <div className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-foreground/50" />
                    Grade de Construção
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">Sustenta os eixos de simetria vertical e horizontal.</p>
                </button>

                <button
                  onClick={() => setGoldenOverlay("none")}
                  className={`py-3 px-4 rounded-xl border text-left transition-all duration-300 ${goldenOverlay === "none" ? "border-foreground bg-foreground/5 text-foreground" : "border-border hover:bg-muted/50 text-muted-foreground"}`}
                >
                  <div className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                    Símbolo Limpo
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">Visualização do símbolo limpo.</p>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-primary">
                Como se aplica ao logo:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>
                  <strong className="text-foreground">Proporção Dinâmica:</strong> O dimensionamento segue a sequência de Fibonacci para garantir equilíbrio.
                </li>
                <li>
                  <strong className="text-foreground">Harmonia Visual:</strong> As curvaturas externas e internas estão em perfeita relação áurea (&phi;).
                </li>
                <li>
                  <strong className="text-foreground">Eixos de Simetria:</strong> O posicionamento respeita eixos verticais e horizontais precisos.
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 aspect-square flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 left-4 text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
              ANÁLISE GEOMÉTRICA
            </div>
            
            <div className="flex-1 flex items-center justify-center relative p-4 sm:p-8 min-h-[300px]">
              <div className="w-full max-w-[260px] flex items-center justify-center">
                <DynamicLogoMark 
                  logoUrl={brand.logoUrl} 
                  symbolUrl={brand.symbolUrl}
                  brandName={brand.name} 
                  variant="original" 
                  withWordmark={false} 
                  className="w-full h-auto max-h-[260px]" 
                  goldenOverlay={goldenOverlay}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground pt-4 border-t border-border">
              <span>{brand.name.toUpperCase()}</span>
              <span>&phi; = 1.618</span>
            </div>
          </div>
        </div>
      </Section>

      {/* PALETA DE CORES */}
      <Section id="paleta" eyebrow="03 · Paleta" title="Cor com hierarquia">
        <div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            A paleta é construída em três níveis. A cor principal de {brand.name} domina (60% do peso visual), apoiada por tons neutros e acentos quentes.
          </p>

          <h3 className="mt-10 mb-4 text-xs font-mono uppercase tracking-widest text-primary">Primárias</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {brand.palette.primary.map(s => <Swatch key={s.hex} {...s} dark />)}
          </div>

          <h3 className="mt-10 mb-4 text-xs font-mono uppercase tracking-widest text-primary">Secundárias</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brand.palette.secondary.map(s => <Swatch key={s.hex} {...s} dark={s.hex.startsWith("#1")} />)}
          </div>

          <h3 className="mt-10 mb-4 text-xs font-mono uppercase tracking-widest text-primary">Acento & Suporte</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {brand.palette.accent.map(s => <Swatch key={s.hex} {...s} />)}
          </div>

          <h3 className="mt-10 mb-4 text-xs font-mono uppercase tracking-widest text-primary">Neutros</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {brand.palette.neutrals.map(s => <Swatch key={s.hex} {...s} dark={s.hex === "#1A1A1A"} />)}
          </div>

          {/* Hierarchy Bar */}
          <div className="mt-12 rounded-xl overflow-hidden border border-border">
            <div className="flex h-14 text-[10px] sm:text-[11px] font-mono">
              <div className="flex-[60] grid place-items-center text-center px-1" style={{ background: primaryColor, color: "#fff" }}>60% Brand</div>
              <div className="flex-[25] grid place-items-center text-center px-1" style={{ background: "#E8EDED", color: "#1A1A1A" }}>25% Neutros</div>
              <div className="flex-[10] grid place-items-center text-center px-1" style={{ background: "#1A1A1A", color: "#fff" }}>10% Ink</div>
              <div className="flex-[5] grid place-items-center text-center px-1" style={{ background: accentColor, color: "#1A1A1A" }}>5% Acento</div>
            </div>
          </div>
        </div>
      </Section>

      {/* TIPOGRAFIA */}
      <Section id="tipografia" eyebrow="04 · Tipografia" title="Vozes da marca">
        <div className="space-y-8">
          <FontShowcase
            family="Space Grotesk"
            role="Display / Títulos"
            sample="Engenharia digital, sem fricção."
            specs="Pesos: 500 · 600 · 700  ·  Tracking: -0.02em"
            big
          />
          <FontShowcase
            family="Inter"
            role="Corpo / UI"
            sample={`A ${brand.name} projeta sistemas de software para empresas que precisam de precisão, escalabilidade e previsibilidade. Cada componente da nossa marca segue a mesma disciplina.`}
            specs="Pesos: 400 · 500 · 600 · 700  ·  Line-height: 1.55"
          />
          <FontShowcase
            family="JetBrains Mono"
            role="Código / Etiquetas técnicas"
            sample="const trust = precision + simplicity;"
            specs="Pesos: 400 · 500  ·  Uso: dados, snippets, metadados"
            mono
          />

          {/* Hierarchy */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
            <div className="space-y-6">
              <Row label="H1 · 56/60 · Space Grotesk 600">
                <div className="font-display font-semibold text-3xl sm:text-5xl tracking-tight">Construímos sistemas</div>
              </Row>
              <Row label="H2 · 36/44 · Space Grotesk 600">
                <div className="font-display font-semibold text-2xl sm:text-3xl tracking-tight">Plataforma de operações</div>
              </Row>
              <Row label="H3 · 22/30 · Space Grotesk 500">
                <div className="font-display font-medium text-lg sm:text-xl">Integração contínua</div>
              </Row>
              <Row label="Body · 16/26 · Inter 400">
                <div className="text-sm sm:text-base max-w-xl text-muted-foreground leading-relaxed">
                  Texto corrido para parágrafos e descrições de produto. Mantenha 60–75 caracteres por linha.
                </div>
              </Row>
              <Row label="Caption · 12/16 · Inter 500 · uppercase 0.18em">
                <div className="text-xs font-medium uppercase tracking-widest text-primary">Status do sistema</div>
              </Row>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary">Laboratório de Tipografia</h3>
              <p className="text-xs text-muted-foreground mt-1">Interaja com as fontes do sistema em tempo real.</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground flex justify-between">
                    <span>Tamanho</span>
                    <span>{fontSize}px</span>
                  </label>
                  <input
                    type="range" min="14" max="64" value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full mt-2 h-1.5 bg-muted rounded appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground flex justify-between">
                    <span>Espaçamento</span>
                    <span>{letterSpacing}em</span>
                  </label>
                  <input
                    type="range" min="-0.05" max="0.15" step="0.01" value={letterSpacing}
                    onChange={(e) => setLetterSpacing(Number(e.target.value))}
                    className="w-full mt-2 h-1.5 bg-muted rounded appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground flex justify-between">
                    <span>Altura da Linha</span>
                    <span>{lineHeight}</span>
                  </label>
                  <input
                    type="range" min="1.1" max="1.8" step="0.1" value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="w-full mt-2 h-1.5 bg-muted rounded appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div
                className="p-6 rounded-xl border border-border bg-muted/30 min-h-[100px] flex items-center justify-center text-center overflow-hidden"
                style={{ fontSize, letterSpacing: `${letterSpacing}em`, lineHeight, fontFamily: "Space Grotesk, sans-serif" }}
              >
                {customText}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* APLICAÇÕES */}
      <Section id="aplicacoes" eyebrow="05 · Aplicações" title="A marca em movimento">
        <div className="space-y-10">
          {/* Website header/hero preview */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="bg-background border border-border px-3 py-1 rounded text-[10px] font-mono truncate max-w-[200px] sm:max-w-md">
                {brand.id}.com
              </div>
              <div className="w-8" />
            </div>
            
            <div className="p-6 md:p-12 bg-background relative overflow-hidden">
              <header className="flex justify-between items-center pb-8 border-b border-border/40">
                <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} withWordmark className="h-6 object-contain" />
                <div className="hidden sm:flex gap-4 text-xs font-medium text-muted-foreground">
                  <span>{appTexts.menuItem1}</span><span>{appTexts.menuItem2}</span><span>{appTexts.menuItem3}</span>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Começar</span>
              </header>
              <div className="py-12 sm:py-20 text-center max-w-xl mx-auto">
                <h3 className="text-2xl sm:text-4xl font-display font-semibold tracking-tight">{appTexts.heroTitle}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-4 leading-relaxed">
                  {appTexts.heroDesc}
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <span className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-medium cursor-pointer">{appTexts.button1}</span>
                  <span className="px-4 py-2 rounded border border-border text-foreground text-xs font-medium cursor-pointer">{appTexts.button2}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Mobile App View */}
            <div className="rounded-2xl border border-border bg-[var(--teal-shadow)] p-6 md:p-10 flex justify-center items-center">
              <div className="w-full max-w-[240px] rounded-[2rem] bg-[#0A1717] border-[6px] border-black p-4 shadow-2xl">
                <div className="text-[9px] font-mono text-white/40 flex justify-between mb-4">
                  <span>9:41</span><span>●●●</span>
                </div>
                <DynamicLogoMark
                  logoUrl={brand.logoUrl}
                  symbolUrl={brand.symbolUrl}
                  logoReverseUrl={brand.logoReverseUrl}
                  symbolReverseUrl={brand.symbolReverseUrl}
                  brandName={brand.name}
                  variant="reverse"
                  withWordmark={false}
                  className="h-8 w-8 mb-5 object-contain"
                />
                <div className="text-white text-base font-display font-semibold leading-tight">{appTexts.mobileGreeting}</div>
                <div className="text-white/50 text-[10px] mt-1">{appTexts.mobileSub}</div>
                <div className="mt-5 space-y-2">
                  {appTexts.mobileItems.map(t => (
                    <div key={t} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 text-[10px] text-white/90">
                      <span>{t}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7CC1C1]" />
                    </div>
                  ))}
                </div>
                <div className="mt-5 px-3 py-2 rounded-lg bg-[#5AA6A6] text-[#0A1717] text-[10px] text-center font-medium">
                  {appTexts.mobileBtn}
                </div>
              </div>
            </div>

            {/* Business Card View */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-10 flex justify-center items-center">
              <div className="space-y-4 w-full max-w-[320px]">
                <div className="w-full aspect-[1.586] rounded-xl bg-primary text-primary-foreground p-5 flex flex-col justify-between shadow-xl">
                  <DynamicLogoMark
                    logoUrl={brand.logoUrl}
                    symbolUrl={brand.symbolUrl}
                    logoReverseUrl={brand.logoReverseUrl}
                    symbolReverseUrl={brand.symbolReverseUrl}
                    brandName={brand.name}
                    variant="reverse"
                    withWordmark={false}
                    className="h-8 w-8 object-contain"
                  />
                  <div>
                    <div className="font-display font-semibold text-sm sm:text-base">Jefferson Campos</div>
                    <div className="text-[10px] sm:text-xs opacity-80">Product designer</div>
                    <div className="text-[8px] sm:text-[9px] font-mono opacity-60 mt-2 truncate">
                      jefferson.campos@{brand.id}.com.br
                    </div>
                  </div>
                </div>
                <div className="w-full aspect-[1.586] rounded-xl bg-[var(--cream)] text-[#0A1F1E] p-5 flex flex-col justify-between shadow-xl border border-border/20">
                  <DynamicLogoMark
                    logoUrl={brand.logoUrl}
                    symbolUrl={brand.symbolUrl}
                    logoReverseUrl={brand.logoReverseUrl}
                    symbolReverseUrl={brand.symbolReverseUrl}
                    brandName={brand.name}
                    variant="deep"
                    className="h-5 object-contain"
                  />
                  <div className="text-[8px] sm:text-[9px] font-mono opacity-60">
                    {brand.id}.com.br
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Posts */}
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { bg: primaryColor, fg: "#fff", title: appTexts.cardTitle1, sub: appTexts.cardSub1, v: "reverse" as const },
              { bg: secondaryColor, fg: "#0A1F1E", title: appTexts.cardTitle2, sub: appTexts.cardSub2, v: "reverse" as const },
              { bg: "#1A1A1A", fg: "#fff", title: appTexts.cardTitle3, sub: appTexts.cardSub3, v: "mono-light" as const },
            ].map((c, i) => (
              <div key={i} className="aspect-square rounded-2xl p-6 flex flex-col justify-between border border-border/10" style={{ background: c.bg, color: c.fg }}>
                <DynamicLogoMark
                  logoUrl={brand.logoUrl}
                  symbolUrl={brand.symbolUrl}
                  logoReverseUrl={brand.logoReverseUrl}
                  symbolReverseUrl={brand.symbolReverseUrl}
                  brandName={brand.name}
                  variant={c.v}
                  withWordmark={false}
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest opacity-60">{c.title}</div>
                  <div className="font-display font-semibold text-lg sm:text-xl tracking-tight mt-1 leading-snug">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ICONOGRAFIA */}
      <Section id="iconografia" eyebrow="06 · Iconografia" title="Sistema de ícones">
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Ícones são desenhados sobre um grid de 24×24 com traço de 1.5px. Cantos arredondados (radius 2), terminações limpas.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {[
              { n: "shield", d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" },
              { n: "server", d: "M3 5h18v6H3zM3 13h18v6H3zM7 8h.01M7 16h.01" },
              { n: "cube", d: "M12 3l9 5-9 5-9-5 9-5zM3 8v8l9 5M21 8v8l-9 5" },
              { n: "bolt", d: "M13 2L4 14h7l-1 8 9-12h-7l1-8z" },
              { n: "graph", d: "M3 3v18h18M7 15l4-4 4 3 5-6" },
              { n: "lock", d: "M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z" },
            ].map((i) => (
              <div key={i.n} className="aspect-square rounded-xl border border-border bg-card grid place-items-center group hover:border-primary transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground group-hover:text-primary transition-colors">
                  <path d={i.d} />
                </svg>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <IconSpec label="Grid base" value="24 × 24" />
            <IconSpec label="Stroke" value="1.5 px" />
            <IconSpec label="Corner radius" value="2 px" />
          </div>
        </div>
      </Section>

      {/* MOTION */}
      <Section id="motion" eyebrow="07 · Motion" title="Princípios de movimento">
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Movimento discreto e funcional — nunca decorativo. Toda transição tem o propósito de orientar.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <MotionCard k="Duração" v="120–240ms para UI. 400–600ms para hero." />
            <MotionCard k="Easing" v="cubic-bezier(0.2, 0.8, 0.2, 1) — natural ease-out." />
            <MotionCard k="Distância" v="≤ 12px. Movimentos longos quebram o ritmo." />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-6">Onda de carregamento</div>
            <div className="flex gap-1.5 sm:gap-2 items-end h-24">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary origin-bottom animate-loading-wave"
                  style={{
                    height: `${30 + Math.sin(i / 2) * 35 + 35}%`,
                    opacity: 0.3 + (i % 8) / 10,
                    animationDelay: `${i * 0.06}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* FOTOGRAFIA */}
      <Section id="fotografia" eyebrow="08 · Fotografia" title="Estilo de imagem">
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground max-w-2xl">
            {imageStyle.intro}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {brandId === "microsistec" ? (
              // Microsistec: fotos reais
              [{
                t: "Macro & Detalhe",
                desc: "Foco extremo em hardware, conectores e texturas digitais. Transmite precisão cirúrgica.",
                img: macroPhoto,
              }, {
                t: "Ambiente Humano",
                desc: "Colaboração real, equipes de engenharia em ação e interação natural com a tecnologia.",
                img: humanPhoto,
              }, {
                t: "Arquitetura Digital",
                desc: "Simetria de datacenters, alinhamento de servidores e cabeamento estruturado complexo.",
                img: architecturePhoto,
              }].map((p) => (
                <div key={p.t} className="group rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/5] overflow-hidden bg-muted relative">
                      <img
                        src={p.img}
                        alt={p.t}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 border-t border-border">
                      <div className="text-sm font-semibold group-hover:text-primary transition-colors mb-2">{p.t}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Marcas dinâmicas: cards estilizados com gradiente da paleta
              imageStyle.categories.map((cat) => (
                <div key={cat.t} className="group rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div
                      className="aspect-[4/5] overflow-hidden relative flex items-center justify-center"
                      style={{ background: cat.gradient }}
                    >
                      {/* Decorative mesh pattern */}
                      <div className="absolute inset-0 opacity-[0.06]" style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, ${primaryColor} 1px, transparent 1px), radial-gradient(circle at 75% 75%, ${secondaryColor} 1px, transparent 1px)`,
                        backgroundSize: "24px 24px",
                      }} />
                      {/* Large icon */}
                      <span className="text-7xl sm:text-8xl select-none transition-transform duration-500 group-hover:scale-110 relative z-10 drop-shadow-sm">
                        {cat.icon}
                      </span>
                    </div>
                    <div className="p-5 border-t border-border">
                      <div className="text-sm font-semibold group-hover:text-primary transition-colors mb-2">{cat.t}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Rule positive label="Sim" items={imageStyle.doItems} />
            <Rule label="Não" items={imageStyle.dontItems} />
          </div>
        </div>
      </Section>

      {/* VOZ */}
      {(() => {
        const voice = getBrandVoiceGuidelines(brand);
        return (
          <Section id="voz" eyebrow="09 · Voz" title="Como a marca fala">
            <div className="space-y-8">
              <div>
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {voice.summary}
                </p>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {voice.pillars.map((p, idx) => (
                    <div key={p.name} className="px-3.5 py-1.5 rounded-full border border-border bg-card text-xs flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <strong className="text-foreground">{p.name}:</strong>
                      <span className="text-muted-foreground">{p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <VoiceCard kind="ok" title="Escreva assim">
                  {voice.okExamples.map((ex, i) => (
                    <span key={i}>{i > 0 && <br />}<em>{ex}</em></span>
                  ))}
                </VoiceCard>
                <VoiceCard kind="no" title="Evite">
                  {voice.noExamples.map((ex, i) => (
                    <span key={i}>{i > 0 && <br />}<em>{ex}</em></span>
                  ))}
                </VoiceCard>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-4">Tom por contexto</div>
                <div className="grid sm:grid-cols-3 gap-6 text-xs sm:text-sm">
                  <div className="space-y-1.5">
                    <div className="font-semibold text-foreground">{voice.contextTones.comercial.label}</div>
                    <div className="text-muted-foreground leading-relaxed">{voice.contextTones.comercial.desc}</div>
                  </div>
                  <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-border/60 pt-4 sm:pt-0 sm:pl-6">
                    <div className="font-semibold text-foreground">{voice.contextTones.produto.label}</div>
                    <div className="text-muted-foreground leading-relaxed">{voice.contextTones.produto.desc}</div>
                  </div>
                  <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-border/60 pt-4 sm:pt-0 sm:pl-6">
                    <div className="font-semibold text-foreground">{voice.contextTones.suporte.label}</div>
                    <div className="text-muted-foreground leading-relaxed">{voice.contextTones.suporte.desc}</div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        );
      })()}

      {/* ACESSIBILIDADE */}
      <Section id="acessibilidade" eyebrow="10 · Acessibilidade" title="Contraste e legibilidade">
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Todos os pares texto/fundo da marca atendem WCAG AA no mínimo. Verde primário sobre creme passa AAA para texto grande.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Contrast fg={primaryColor} bg="#F7F3EA" ratio="8.4" level="AAA" />
            <Contrast fg="#FFFFFF" bg={primaryColor} ratio="8.4" level="AAA" />
            <Contrast fg="#1A1A1A" bg="#7CC1C1" ratio="9.1" level="AAA" />
            <Contrast fg="#FFFFFF" bg={secondaryColor} ratio="3.1" level="AA Large" />
          </div>

          {/* Contrast Tester */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary">Calculadora de Contraste da Marca</h3>
              <p className="text-xs text-muted-foreground mt-1">Teste a legibilidade entre as cores da paleta.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground">Cor do Texto (Foreground)</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { name: "Brand Primary", hex: primaryColor },
                      { name: "Ink", hex: "#1A1A1A" },
                      { name: "Secondary", hex: secondaryColor },
                      { name: "White", hex: "#FFFFFF" }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setContrastFg(c.hex)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${contrastFg === c.hex ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-muted"}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                        <span>{c.hex}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground">Cor do Fundo (Background)</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { name: "Cream", hex: "#F7F3EA" },
                      { name: "Snow", hex: "#FAFBFB" },
                      { name: "Fog", hex: "#E8EDED" },
                      { name: "Brand Primary", hex: primaryColor },
                      { name: "White", hex: "#FFFFFF" }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setContrastBg(c.hex)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${contrastBg === c.hex ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-muted"}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                        <span>{c.hex}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-border overflow-hidden">
                <div
                  className="flex-1 min-h-[120px] p-6 flex flex-col justify-center transition-colors duration-300"
                  style={{ backgroundColor: contrastBg, color: contrastFg }}
                >
                  <div className="font-display font-semibold text-xl tracking-tight">{brand.name}</div>
                  <div className="text-xs mt-1 opacity-90 leading-relaxed font-sans">
                    A precisão e a confiabilidade de nossa engenharia refletidas no design inclusivo.
                  </div>
                </div>
                
                <div className="p-3 bg-muted border-t border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-mono text-muted-foreground">RAZÃO DE CONTRASTE</div>
                    <div className="font-mono text-lg font-bold text-foreground">
                      {getContrastRatio(contrastFg, contrastBg)}:1
                    </div>
                  </div>

                  <div>
                    {(() => {
                      const ratio = parseFloat(getContrastRatio(contrastFg, contrastBg));
                      let label = "Reprovado";
                      let colorClass = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
                      
                      if (ratio >= 7.0) {
                        label = "Passa AAA";
                        colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                      } else if (ratio >= 4.5) {
                        label = "Passa AA";
                        colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                      } else if (ratio >= 3.0) {
                        label = "AA Large";
                        colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                      }
                      
                      return (
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-medium ${colorClass}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* PAPELARIA */}
      <Section id="papelaria" eyebrow="11 · Papelaria" title="Materiais impressos">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-muted p-6 sm:p-8 grid place-items-center">
            <div className="w-full max-w-[240px] aspect-[210/297] bg-white shadow-xl p-5 flex flex-col text-[#0A1F1E]">
              <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="deep" className="h-5 object-contain" />
              <div className="mt-8 text-[7px] font-mono text-[#0A1F1E]/50 leading-relaxed">
                {brand.name} Tecnologia Ltda.<br/>
                Rua Funcionários 1234 · São Paulo SP<br/>
                +55 11 4002-8922 · {brand.id}.com
              </div>
              <div className="mt-8 space-y-1.5 flex-1">
                <div className="h-1 bg-[#0A1F1E]/10 rounded w-[80%]"/>
                <div className="h-1 bg-[#0A1F1E]/10 rounded w-[90%]"/>
                <div className="h-1 bg-[#0A1F1E]/10 rounded w-[60%]"/>
              </div>
              <div className="h-[3px] bg-primary mt-4"/>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted p-6 sm:p-8 grid place-items-center">
            <div className="w-full max-w-[280px] aspect-[2/1] bg-[var(--cream)] shadow-xl p-5 relative">
              <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="deep" className="h-5 object-contain" />
              <div className="mt-3 text-[7px] font-mono text-[#0A1F1E]/60 leading-relaxed">
                Rua Funcionários 1234<br/>São Paulo · SP · 04500-000
              </div>
              <div className="absolute top-5 right-5 w-10 h-12 border-2 border-dashed border-[#0A1F1E]/20"/>
            </div>
          </div>
        </div>
      </Section>

      {/* APRESENTAÇÕES / SLIDES */}
      <Section id="slides" eyebrow="12 · Apresentações" title="Slides corporativos">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-2xl overflow-hidden border border-border">
            <div className="aspect-video bg-primary text-primary-foreground p-6 flex flex-col justify-between">
              <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="reverse" className="h-5 object-contain" />
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest opacity-60">Q1 · 2026</div>
                <div className="font-display text-xl sm:text-2xl font-semibold tracking-tight mt-2 leading-tight">Plano de operações<br/>e crescimento</div>
              </div>
              <div className="flex justify-between text-[9px] font-mono opacity-40">
                <span>{brand.id}.com</span><span>01 / 24</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border">
            <div className="aspect-video bg-[var(--cream)] text-[#0A1F1E] p-6 flex flex-col">
              <div className="flex justify-between items-center">
                <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} variant="deep" withWordmark={false} className="h-5 w-5 object-contain" />
                <div className="text-[9px] font-mono opacity-50">Resultados · Trimestre</div>
              </div>
              <div className="mt-4 font-display text-base sm:text-lg font-semibold">Indicadores de SLA</div>
              <div className="mt-4 grid grid-cols-3 gap-2 flex-1">
                {[{k:"Uptime",v:"99.98%"},{k:"MTTR",v:"4m 12s"},{k:"NPS",v:"72"}].map(s => (
                  <div key={s.k} className="rounded-lg bg-white p-2.5 flex flex-col justify-between border border-[#0A1F1E]/10">
                    <div className="text-[8px] font-mono uppercase tracking-widest opacity-50">{s.k}</div>
                    <div className="font-display text-sm sm:text-base font-semibold text-primary">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* E-MAIL SIGNATURE */}
      <Section id="email" eyebrow="13 · E-mail" title="Assinatura padrão">
        <EmailSignatureSection brand={brand} />
      </Section>

      {/* DOWNLOADS */}
      <Section id="downloads" eyebrow="14 · Downloads" title="Ativos da marca">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground max-w-xl">
              Baixe as variações oficiais do logotipo, o manual em PDF compilado ou as especificações técnicas de cor para desenvolvimento.
            </p>
            <button
              onClick={async () => {
                toast.promise(
                  (async () => {
                    await handleDownloadLogo('original', true, 'principal');
                    await new Promise(r => setTimeout(r, 600));
                    await handleDownloadLogo('reverse', true, 'reverso');
                    await new Promise(r => setTimeout(r, 600));
                    await handleDownloadLogo('mono-dark', true, 'monocromatico');
                    await new Promise(r => setTimeout(r, 600));
                    await handleDownloadLogo('original', false, 'simbolo');
                  })(),
                  {
                    loading: "Preparando pacote de logotipos...",
                    success: "Todos os logotipos foram baixados!",
                    error: "Erro no download em lote."
                  }
                );
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 self-start sm:self-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
                <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Baixar Todos os Logos (Lote)
            </button>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground/80 font-mono tracking-wide uppercase">Variações de Logotipo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  title: "Logo Principal",
                  desc: "Vetor/PNG colorido padrão",
                  format: brand.logoUrl ? "PNG" : "SVG",
                  variant: "original" as const,
                  withWordmark: true,
                  bg: "bg-muted/30 border-muted/50",
                  suffix: "principal"
                },
                {
                  title: "Logo Reverso",
                  desc: "Para fundos escuros/contrastes",
                  format: brand.logoUrl ? "PNG" : "SVG",
                  variant: "reverse" as const,
                  withWordmark: true,
                  bg: "bg-[#111A1A] border-[#1D2F2F] text-white",
                  suffix: "reverso"
                },
                {
                  title: "Logo Monocromático",
                  desc: "Para impressões em B&W",
                  format: brand.logoUrl ? "PNG" : "SVG",
                  variant: "mono-dark" as const,
                  withWordmark: true,
                  bg: "bg-white border-border",
                  suffix: "monocromatico"
                },
                {
                  title: "Símbolo Isolado",
                  desc: "Sem assinatura de texto",
                  format: (brand.symbolUrl || brand.logoUrl) ? "PNG" : "SVG",
                  variant: "original" as const,
                  withWordmark: false,
                  bg: "bg-muted/30 border-muted/50",
                  suffix: "simbolo"
                }
              ].map((item) => (
                <div
                  key={item.title}
                  onClick={() => handleDownloadLogo(item.variant, item.withWordmark, item.suffix)}
                  className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-all duration-300 group cursor-pointer hover:shadow-md flex flex-col"
                >
                  <div className={`h-28 flex items-center justify-center p-4 border-b border-border ${item.bg}`}>
                    <DynamicLogoMark
                      logoUrl={brand.logoUrl}
                      symbolUrl={brand.symbolUrl}
                      logoReverseUrl={brand.logoReverseUrl}
                      symbolReverseUrl={brand.symbolReverseUrl}
                      brandName={brand.name}
                      variant={item.variant}
                      withWordmark={item.withWordmark}
                      className="h-12 w-auto"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-mono text-primary font-semibold mb-1">{item.format}</div>
                      <h5 className="text-sm font-semibold group-hover:text-primary transition-colors">{item.title}</h5>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{item.desc}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      <span>Baixar arquivo</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-4">
            {/* MANUAL COMPLETO */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-primary transition-all duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center text-primary mb-4 font-mono font-bold text-xs">PDF</div>
                <h5 className="text-sm font-semibold">Manual Completo</h5>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  Gere a versão de impressão contendo todas as seções e diretrizes de identidade visual deste manual.
                </p>
                <div className="mt-4 space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Orientação do PDF</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintOrientation('portrait')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all ${printOrientation === 'portrait' ? 'bg-primary border-primary text-primary-foreground font-semibold' : 'border-border bg-background text-foreground hover:bg-muted'}`}
                    >
                      Vertical (Retrato)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintOrientation('landscape')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all ${printOrientation === 'landscape' ? 'bg-primary border-primary text-primary-foreground font-semibold' : 'border-border bg-background text-foreground hover:bg-muted'}`}
                    >
                      Horizontal (Paisagem)
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  toast.promise(
                    new Promise((resolve) => {
                      setTimeout(() => {
                        resolve(true);
                        window.print();
                      }, 800);
                    }),
                    {
                      loading: "Preparando manual para exportação...",
                      success: "Escolha 'Salvar como PDF' na tela de impressão.",
                      error: "Erro ao exportar PDF."
                    }
                  );
                }}
                className="mt-4 w-full py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                Exportar Diretrizes (PDF)
              </button>
            </div>

            {/* TOKENS DE DESENVOLVIMENTO */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-primary transition-all duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center text-primary mb-4 font-mono font-bold text-xs">SCSS</div>
                <h5 className="text-sm font-semibold">Tokens de Estilo SCSS</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Baixe as variáveis prontas de design system para integrar com seu projeto SCSS/CSS.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => {
                    const tokens = `// ${brand.name} Color Palette Tokens
$primary: ${primaryColor};
$secondary: ${secondaryColor};
$accent: ${accentColor};
$cream: ${brand.palette.accent[1]?.hex || "#F7F3EA"};
$snow: ${brand.palette.neutrals[0].hex};
$fog: ${brand.palette.neutrals[1].hex};
$slate: ${brand.palette.neutrals[2].hex};
$ink: ${brand.palette.neutrals[3].hex};
`;
                    const blob = new Blob([tokens], { type: "text/x-scss" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${brand.id}-tokens.scss`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Arquivo SCSS baixado!");
                  }}
                  className="py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Baixar SCSS
                </button>
                <button
                  onClick={() => {
                    const tokens = `// ${brand.name} Color Palette Tokens
$primary: ${primaryColor};
$secondary: ${secondaryColor};
$accent: ${accentColor};
$cream: ${brand.palette.accent[1]?.hex || "#F7F3EA"};
$snow: ${brand.palette.neutrals[0].hex};
$fog: ${brand.palette.neutrals[1].hex};
$slate: ${brand.palette.neutrals[2].hex};
$ink: ${brand.palette.neutrals[3].hex};
`;
                    navigator.clipboard.writeText(tokens);
                    toast.success("Tokens copiados!");
                  }}
                  className="py-2 border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Copiar Tokens
                </button>
              </div>
            </div>

            {/* SISTEMA DE ÍCONES */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-primary transition-all duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center text-primary mb-4 font-mono font-bold text-xs">SVG</div>
                <h5 className="text-sm font-semibold">Ícones da Marca (Pacote)</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Baixe o pacote completo com os ícones geométricos oficiais configurados na grade de 24x24 pixels.
                </p>
              </div>
              <button
                onClick={() => {
                  const icons = [
                    { n: "shield", d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" },
                    { n: "server", d: "M3 5h18v6H3zM3 13h18v6H3zM7 8h.01M7 16h.01" },
                    { n: "cube", d: "M12 3l9 5-9 5-9-5 9-5zM3 8v8l9 5M21 8v8l-9 5" },
                    { n: "bolt", d: "M13 2L4 14h7l-1 8 9-12h-7l1-8z" },
                    { n: "graph", d: "M3 3v18h18M7 15l4-4 4 3 5-6" },
                    { n: "lock", d: "M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z" }
                  ];
                  let svgContent = `<svg viewBox="0 0 600 120" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">`;
                  icons.forEach((icon, idx) => {
                    const x = 20 + idx * 95;
                    svgContent += `
                      <g transform="translate(${x}, 20)">
                        <rect width="80" height="80" rx="12" fill="#F4F4F5" stroke="#E4E4E7"/>
                        <g transform="translate(28, 28)">
                          <path d="${icon.d}"/>
                        </g>
                        <text x="40" y="70" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#71717A" stroke="none">${icon.n}</text>
                      </g>
                    `;
                  });
                  svgContent += `\n</svg>`;
                  const blob = new Blob([svgContent], { type: "image/svg+xml" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${brand.id}-icones-sistema.svg`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Pacote de ícones SVG baixado com sucesso!");
                }}
                className="mt-4 w-full py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                Baixar Pacote de Ícones SVG
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <DynamicLogoMark logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl} logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl} brandName={brand.name} withWordmark={false} className="h-8 w-8" />
            <div>
              <div className="text-sm font-semibold">{brand.name} Brand System</div>
              <div className="text-xs text-muted-foreground">Manual de Identidade Visual · v1.0</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {brand.id === "microsistec" ? "jefferson.campos@microsistec.com.br" : `contato@${brand.id}.com.br`}
          </div>
        </div>
      </footer>

      {/* Admin Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 md:p-8 relative">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthPassword("");
                setAuthPendingAction(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-display font-bold tracking-tight text-foreground">Acesso Administrativo</h2>
            <p className="text-xs text-muted-foreground mt-1">Digite a senha de administrador para gerenciar e editar este manual de marca.</p>

            <form onSubmit={handleAdminAuthSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Senha de Acesso</label>
                <div className="relative">
                  <input
                    type={showAuthPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Digite a senha..."
                    className="w-full h-11 px-4 pr-10 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthPassword("");
                    setAuthPendingAction(null);
                  }}
                  className="flex-1 h-11 rounded-xl border border-border text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all shadow-md active:scale-[0.98]"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border shadow-2xl p-6 md:p-8 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Editar Manual de Marca</h2>
            <p className="text-sm text-muted-foreground mt-1">Atualize as informações da identidade visual e salve para gerar o manual novamente.</p>

            <form onSubmit={handleSaveEditBrand} className="mt-8 space-y-6">
              {/* Logo & Symbol Upload Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">Logotipo Completo</label>
                  <div className="border-2 border-dashed border-border/80 hover:border-primary/55 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-muted/20 relative min-h-[140px]">
                    {editLogoBase64 ? (
                      <div className="flex flex-col items-center">
                        <img src={editLogoBase64} alt="Preview Logo" className="max-h-16 object-contain mb-3" />
                        <button
                          type="button"
                          onClick={() => setEditLogoBase64("")}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Remover Logo
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <p className="text-xs font-medium text-foreground">Selecione o logotipo completo</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">SVG, PNG ou JPG</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditLogoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">Símbolo Isolado</label>
                  <div className="border-2 border-dashed border-border/80 hover:border-primary/55 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-muted/20 relative min-h-[140px]">
                    {editSymbolBase64 ? (
                      <div className="flex flex-col items-center">
                        <img src={editSymbolBase64} alt="Preview Símbolo" className="max-h-16 object-contain mb-3" />
                        <button
                          type="button"
                          onClick={() => setEditSymbolBase64("")}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Remover Símbolo
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <p className="text-xs font-medium text-foreground">Selecione apenas o símbolo</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">SVG, PNG ou JPG</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditSymbolUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo & Symbol REVERSE Upload Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">Logotipo Reverso (Para Fundo Escuro)</label>
                  <div className="border-2 border-dashed border-border/80 hover:border-primary/55 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-muted/20 relative min-h-[140px]">
                    {editLogoReverseBase64 ? (
                      <div className="flex flex-col items-center">
                        <img src={editLogoReverseBase64} alt="Preview Logo Reverso" className="max-h-16 object-contain mb-3 bg-neutral-900 p-2 rounded" />
                        <button
                          type="button"
                          onClick={() => setEditLogoReverseBase64("")}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Remover Logo Reversa
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <p className="text-xs font-medium text-foreground">Selecione o logotipo reverso</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">SVG, PNG ou JPG</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditLogoReverseUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">Símbolo Reverso (Opcional)</label>
                  <div className="border-2 border-dashed border-border/80 hover:border-primary/55 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-muted/20 relative min-h-[140px]">
                    {editSymbolReverseBase64 ? (
                      <div className="flex flex-col items-center">
                        <img src={editSymbolReverseBase64} alt="Preview Símbolo Reverso" className="max-h-16 object-contain mb-3 bg-neutral-900 p-2 rounded" />
                        <button
                          type="button"
                          onClick={() => setEditSymbolReverseBase64("")}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Remover Símbolo Reverso
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <p className="text-xs font-medium text-foreground">Selecione o símbolo reverso</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">SVG, PNG ou JPG</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditSymbolReverseUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Basic Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Nome da Marca <span className="text-red-500 font-semibold">*</span></label>
                  <input
                    type="text"
                    required
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    placeholder="Nome da marca"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Apresentação / Descrição <span className="text-red-500 font-semibold">*</span></label>
                  <input
                    type="text"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descrição da marca"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                  />
                </div>
              </div>

              {/* Hero Title (H1) Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block">
                    Título Principal / H1 do Manual
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {editHeroTitle.length}/75 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={75}
                  value={editHeroTitle}
                  onChange={(e) => setEditHeroTitle(e.target.value)}
                  placeholder="Ex: Imóveis com transparência e segurança total em Atibaia."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Frase de impacto estilo H1 de site, mantendo foco na essência e nicho da marca (máximo de 75 caracteres).
                </p>
              </div>

              {/* Custom Domain Input */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Domínio Personalizado <span className="text-[10px] text-muted-foreground font-sans lowercase font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={editCustomDomain}
                  onChange={(e) => setEditCustomDomain(e.target.value)}
                  placeholder="Ex: manual.minhamarca.com.br"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Insira o domínio para este manual. Aponte um CNAME de seu subdomínio para este portal para habilitar.
                </p>
              </div>

              {/* Essence (Mission, Vision, Promise) */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary border-b border-border/80 pb-2">Essência e Diretrizes</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-foreground">Missão</label>
                    <textarea
                      value={editMission}
                      onChange={(e) => setEditMission(e.target.value)}
                      placeholder="Missão..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-foreground">Visão</label>
                    <textarea
                      value={editVision}
                      onChange={(e) => setEditVision(e.target.value)}
                      placeholder="Visão..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-foreground">Promessa</label>
                    <textarea
                      value={editPromise}
                      onChange={(e) => setEditPromise(e.target.value)}
                      placeholder="Promessa..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Paleta Cromática */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary border-b border-border/80 pb-2">Paleta de Cores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center">
                    <label className="text-[11px] font-semibold mb-2 text-foreground">Principal</label>
                    <input
                      type="color"
                      value={editPrimaryColor}
                      onChange={(e) => setEditPrimaryColor(e.target.value)}
                      className="w-16 h-12 rounded-lg cursor-pointer border border-border p-0.5 bg-background"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[11px] font-semibold mb-2 text-foreground">Secundária</label>
                    <input
                      type="color"
                      value={editSecondaryColor}
                      onChange={(e) => setEditSecondaryColor(e.target.value)}
                      className="w-16 h-12 rounded-lg cursor-pointer border border-border p-0.5 bg-background"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[11px] font-semibold mb-2 text-foreground">Acento</label>
                    <input
                      type="color"
                      value={editAccentColor}
                      onChange={(e) => setEditAccentColor(e.target.value)}
                      className="w-16 h-12 rounded-lg cursor-pointer border border-border p-0.5 bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-border">
                <div>
                  {brand.id !== "microsistec" && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmText("");
                        setShowDeleteModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive hover:text-white text-destructive border border-destructive/20 text-xs font-semibold transition-all duration-300 active:scale-95"
                    >
                      Excluir Manual
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium transition-all shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-foreground">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-display font-bold text-destructive flex items-center gap-2">
              <span>Excluir Manual de Marca?</span>
            </h3>
            
            <div className="mt-4 p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 text-xs text-destructive leading-relaxed">
              <strong>Atenção:</strong> Esta ação é permanente e removerá todas as diretrizes, paletas e variações de logotipo de <strong>{brand.name}</strong>.
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Para confirmar a exclusão, digite o nome da marca <button type="button" onClick={() => setDeleteConfirmText(brand.name)} className="text-foreground underline font-semibold hover:text-destructive transition-colors">"{brand.name}"</button> no campo abaixo:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Digite "${brand.name}"`}
              className="w-full mt-3 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-destructive transition-colors text-foreground"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toLowerCase() !== brand.name.trim().toLowerCase()}
                onClick={handleDeleteBrand}
                className="px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const compressSignaturePhoto = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64Str);
          return;
        }
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        canvas.width = 80;
        canvas.height = 80;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 80, 80);
        const compressed = canvas.toDataURL("image/jpeg", 0.6);
        resolve(compressed);
      } catch {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

function EmailSignatureSection({ brand }: { brand: BrandData }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string>("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      toast.info("Processando e otimizando imagem...");
      const compressed = await compressSignaturePhoto(reader.result as string);
      setPhotoBase64(compressed);
      toast.success("Foto da assinatura carregada e otimizada!");
    };
    reader.readAsDataURL(file);
  };

  const primaryColor = brand.palette.primary[0].hex;
  const displayName = name.trim() || "Nome Sobrenome";
  const displayRole = role.trim() || "Cargo / Função";
  const displayEmail = email.trim() || `contato@${brand.id}.com.br`;
  const displayPhone = phone.trim() || "+55 (00) 00000-0000";
  const initials = (name.trim() || "NS")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "NS";

  // Simple clean HTML signature markup
  const signatureHtml = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #1a1a1a;">
  <tr>
    <td style="padding-right: 15px; vertical-align: middle;">
      ${photoBase64 ? `
        <img src="${photoBase64}" width="56" height="56" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; display: block; border: 0;" alt="${displayName}" />
      ` : `
        <div style="width: 56px; height: 56px; border-radius: 50%; background-color: ${primaryColor}; text-align: center; line-height: 56px; color: #ffffff; font-weight: bold; font-size: 20px;">
          ${initials}
        </div>
      `}
    </td>
    <td style="border-left: 2px solid ${primaryColor}; padding-left: 15px; vertical-align: middle;">
      <div style="font-size: 16px; font-weight: bold; color: #1a1a1a;">${displayName}</div>
      <div style="font-size: 13px; color: #666666;">${displayRole} &middot; ${brand.name}</div>
      <div style="margin-top: 8px; font-size: 12px; color: #666666; font-family: monospace;">
        <div>Email: <a href="mailto:${displayEmail}" style="color: ${primaryColor}; text-decoration: none;">${displayEmail}</a></div>
        <div>Tel: ${displayPhone}</div>
        <div>Site: <a href="https://${brand.id}.com" style="color: ${primaryColor}; text-decoration: none;">${brand.id}.com</a></div>
      </div>
    </td>
  </tr>
</table>`;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(signatureHtml);
    toast.success("Código HTML copiado!", {
      description: "Cole o código copiado nas configurações de assinatura do seu cliente de e-mail.",
    });
  };

  const handleCopyRichText = () => {
    const range = document.createRange();
    const element = document.getElementById("email-signature-preview-render");
    if (element) {
      range.selectNode(element);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          document.execCommand("copy");
          toast.success("Assinatura formatada copiada!", {
            description: "Agora basta colar (Ctrl+V) no campo de assinaturas do Gmail ou Outlook."
          });
        } catch (err) {
          toast.error("Erro ao copiar assinatura.");
        }
        selection.removeAllRanges();
      }
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
      {/* Editor Form */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
              Personalizar Assinatura
            </h4>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">v1.0</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/70"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Jefferson Campos"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/70"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Cargo / Função
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Product Designer"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/70"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                E-mail Corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`Ex: contato@${brand.id}.com.br`}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/70"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +55 (11) 99999-9999"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/70"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Foto de Perfil (Opcional)
              </label>
              {photoBase64 ? (
                <div className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-xl border border-border">
                  <img src={photoBase64} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <button
                    type="button"
                    onClick={() => setPhotoBase64("")}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remover Foto
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-all duration-300"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCopyRichText}
              className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow-sm hover:shadow transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copiar Assinatura
            </button>
            <button
              onClick={handleCopyHtml}
              className="py-2.5 px-4 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Copiar Código HTML
            </button>
          </div>
        </div>

        {/* Gmail Instructions Card */}
        <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4 shadow-inner">
          <h4 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
            Como configurar sua assinatura
          </h4>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">1</span>
              <div>Preencha seus dados no editor e clique em <strong className="text-foreground">Copiar Assinatura</strong> para copiar a versão formatada (Rich Text) diretamente.</div>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">2</span>
              <div>Abra as configurações do seu **Gmail** (ícone de engrenagem no topo direito &gt; Ver todas as configurações).</div>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">3</span>
              <div>Role até a seção **Assinatura** e clique em **Criar nova**. No campo de texto, basta **colar (Ctrl+V ou Cmd+V)** o visual formatado que você copiou!</div>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">4</span>
              <div>Alternativamente, você pode clicar em **Copiar Código HTML** se o seu cliente de e-mail exigir o código cru.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Preview Composer Window */}
      <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>
          <span className="text-xs font-mono text-muted-foreground font-semibold">Nova Mensagem</span>
          <div className="w-12" />
        </div>

        {/* Mail Composer Fields */}
        <div className="px-4 py-2.5 border-b border-border/40 text-[11px] sm:text-xs text-muted-foreground space-y-2">
          <div className="flex items-center border-b border-border/20 pb-1.5">
            <span className="font-semibold text-foreground/70 w-12 shrink-0">Para:</span>
            <span className="text-foreground/80 truncate">equipe@parceiros.com.br</span>
          </div>
          <div className="flex items-center border-b border-border/20 pb-1.5">
            <span className="font-semibold text-foreground/70 w-12 shrink-0">Assunto:</span>
            <span className="text-foreground/80 truncate font-medium">Assinatura Digital de E-mail Homologada</span>
          </div>
        </div>

        {/* Email Body preview */}
        <div className="p-6 md:p-8 bg-background min-h-[200px] flex flex-col justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Olá,</p>
            <p>Segue em anexo a minha assinatura digital de e-mail institucional baseada nas diretrizes do nosso manual de identidade visual.</p>
            <p className="pb-8">Atenciosamente,</p>
          </div>

          {/* Actual Rendered Table Area for copying */}
          <div id="email-signature-preview-render" className="p-4 rounded-xl border border-dashed border-border/60 bg-card inline-block select-all">
            <table cellPadding="0" cellSpacing="0" border={0} style={{ fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "1.4", color: "#1a1a1a" }}>
              <tbody>
                <tr>
                  <td style={{ paddingRight: "15px", verticalAlign: "middle" }}>
                    {photoBase64 ? (
                      <img src={photoBase64} width="56" height="56" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", display: "block", border: 0 }} alt={displayName} />
                    ) : (
                      <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: primaryColor, textAlign: "center", lineHeight: "56px", color: "#ffffff", fontWeight: "bold", fontSize: "20px" }}>
                        {initials}
                      </div>
                    )}
                  </td>
                  <td style={{ borderLeft: `2px solid ${primaryColor}`, paddingLeft: "15px", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>{displayName}</div>
                    <div style={{ fontSize: "13px", color: "#666666" }}>{displayRole} &middot; {brand.name}</div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#666666", fontFamily: "monospace" }}>
                      <div>Email: <a href={`mailto:${displayEmail}`} style={{ color: primaryColor, textDecoration: "none" }}>{displayEmail}</a></div>
                      <div>Tel: {displayPhone}</div>
                      <div>Site: <a href={`https://${brand.id}.com`} style={{ color: primaryColor, textDecoration: "none" }}>{brand.id}.com</a></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

