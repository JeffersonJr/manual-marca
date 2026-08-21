/**
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Palette, Eye, ArrowRight, Upload, X, Check, Download,
  FileUp, Wand2, RefreshCw, Sparkles, ChevronRight, Loader2,
  Link2, ImagePlus, Pencil, Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { DynamicLogoMark } from "@/components/brand/DynamicLogoMark";
import { loadBrandsServer, saveBrandServer, saveAllBrandsServer, deleteBrandServer } from "@/lib/api/brands.functions";
import { generateLogosWithAI, refineLogoWithAI, regenerateAllLogosWithAI, generateBrandSvgVariations } from "@/lib/api/ai-logo.functions";
import { generateManualWithAI } from "@/lib/api/ai-manual.functions";
import type { Brand, BriefingData, GeneratedLogo } from "@/lib/types";
import { getCleanHeroTitle, getCleanHeroDescription } from "@/lib/brand-utils";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "Manual de Marca — Portal de Identidades Visuais" },
        { name: "description", content: "Crie e gerencie manuais de marca e identidades visuais completas com inteligência artificial." },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" },
      ],
    }),
    component: Dashboard,
  }
);

// ---------------------------------------------------------------------------
// Utility Exports (preserved for compatibility)
// ---------------------------------------------------------------------------
export const generateEssence = (name: string, presentation: string) => {
  const cleanPres = presentation.trim().replace(/\.+$/, "");
  const words = cleanPres.split(" ");
  const firstFewWords = words.slice(0, 5).join(" ");
  return {
    mission: `Prover excelência em ${cleanPres.toLowerCase()}, transformando a realidade de nossos clientes com compromisso e qualidade.`,
    vision: `Tornar-se a referência reconhecida pela liderança em ${firstFewWords.toLowerCase()} e impacto positivo.`,
    promise: `Entregar consistência, qualidade e evolução constante em todas as soluções de ${name}.`,
  };
};

export const extractColorsFromImage = (base64Str: string): Promise<{ primary: string; secondary: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve({ primary: "#2b5250", secondary: "#5aa6a6" }); return; }
        canvas.width = 30; canvas.height = 30;
        ctx.drawImage(img, 0, 0, 30, 30);
        const imgData = ctx.getImageData(0, 0, 30, 30).data;
        const colorMap: Record<string, number> = {};
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2], a = imgData[i + 3];
          if (a < 180) continue;
          const rgbSum = r + g + b;
          if (rgbSum > 690 || rgbSum < 80) continue;
          const qr = Math.round(r / 15) * 15, qg = Math.round(g / 15) * 15, qb = Math.round(b / 15) * 15;
          const hex = "#" + [qr, qg, qb].map(x => { const h = Math.max(0, Math.min(255, x)).toString(16); return h.length === 1 ? "0" + h : h; }).join("");
          colorMap[hex] = (colorMap[hex] || 0) + 1;
        }
        const sortedColors = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
        let primary = "#2b5250", secondary = "#5aa6a6";
        if (sortedColors.length > 0) primary = sortedColors[0][0];
        if (sortedColors.length > 1) secondary = sortedColors[1][0];
        else secondary = primary === "#2b5250" ? "#5aa6a6" : "#2b5250";
        resolve({ primary, secondary });
      } catch { resolve({ primary: "#2b5250", secondary: "#5aa6a6" }); }
    };
    img.onerror = () => resolve({ primary: "#2b5250", secondary: "#5aa6a6" });
    img.src = base64Str;
  });
};

/** Derive palette colors from Flow B briefing preferences */
function deriveColorsFromBriefing(briefing: Partial<BriefingData>): { primary: string; secondary: string; accent: string } {
  if (briefing.corFavorita) {
    return { primary: briefing.corFavorita, secondary: "#6366f1", accent: "#f59e0b" };
  }
  const pref = briefing.prefCores?.toLowerCase() ?? "";
  if (pref.includes("quent")) return { primary: "#C0392B", secondary: "#E67E22", accent: "#D4AC0D" };
  if (pref.includes("fri")) return { primary: "#1A5276", secondary: "#148F77", accent: "#7D3C98" };
  if (pref.includes("terr")) return { primary: "#784212", secondary: "#A04000", accent: "#B7950B" };
  if (pref.includes("vibrant")) return { primary: "#8E44AD", secondary: "#2980B9", accent: "#27AE60" };
  if (pref.includes("escur") || pref.includes("dark")) return { primary: "#1A1A2E", secondary: "#16213E", accent: "#E94560" };
  return { primary: "#2B5250", secondary: "#5AA6A6", accent: "#E8A14B" }; // Neutras default
}

/** Convert SVG string to robust data URL */
function svgToDataUrl(svgCode: string): string {
  try {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCode.trim())}`;
  } catch {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;
  }
}

// ---------------------------------------------------------------------------
// Default brand (Microsistec — kept for demo purposes)
// ---------------------------------------------------------------------------
const defaultMicrosistec: Brand = {
  id: "microsistec",
  name: "Microsistec",
  description: "Sistema de identidade visual robusto e minimalista construído para a Microsistec.",
  mission: "Tornar a tecnologia previsível para empresas que dependem dela todos os dias.",
  vision: "Ser o sistema invisível por trás das operações digitais mais confiáveis do país.",
  promise: "Precisão de engenheiro, clareza de designer, ritmo de operador.",
  values: [
    { name: "Precisão", description: "Grid rígido, alinhamentos exatos, números monoespaçados." },
    { name: "Confiança", description: "Verde profundo, contraste alto, tipografia sem ornamentos." },
    { name: "Inovação", description: "Espaço negativo generoso, transições sutis, geometria limpa." },
    { name: "Simplicidade", description: "Menos elementos, mais hierarquia. Sempre uma ação primária." },
  ],
  palette: {
    primary: [
      { name: "Microsistec Teal", hex: "#2B5250", role: "Cor primária. Logo, headers, CTAs principais.", token: "--teal-deep" },
      { name: "Graphite Ink", hex: "#1A1A1A", role: "Wordmark e texto principal.", token: "--ink" },
    ],
    secondary: [
      { name: "Aqua Signal", hex: "#5AA6A6", role: "Apoio, ícones, destaques sutis.", token: "--teal-mid" },
      { name: "Mint Lume", hex: "#7CC1C1", role: "Backgrounds suaves, ilustrações.", token: "--teal-light" },
      { name: "Deep Shade", hex: "#1B2A2A", role: "Profundidade, dark UI.", token: "--teal-shadow" },
    ],
    accent: [
      { name: "Signal Amber", hex: "#E8A14B", role: "Alertas, badges, hover ativos.", token: "--amber" },
      { name: "Paper Cream", hex: "#F7F3EA", role: "Fundo alternativo, materiais impressos.", token: "--cream" },
    ],
    neutrals: [
      { name: "Snow", hex: "#FAFBFB" },
      { name: "Fog", hex: "#E8EDED" },
      { name: "Slate", hex: "#6B7878" },
      { name: "Ink", hex: "#1A1A1A" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FlowBadge({ flow }: { flow?: "A" | "B" }) {
  if (!flow) return null;
  if (flow === "A") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 border border-teal-500/20">
        <ImagePlus className="w-2.5 h-2.5" />
        Logo Própria
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 border border-violet-500/20">
      <Sparkles className="w-2.5 h-2.5" />
      Criada pela IA
    </span>
  );
}

function UploadZone({
  label, required, preview, onClear, onUpload, darkPreview, accept,
}: {
  label: string; required?: boolean; preview?: string; onClear: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  darkPreview?: boolean; accept?: string;
}) {
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">
        {label} {required && <span className="text-red-500 font-semibold">*</span>}
      </label>
      <div className="border-2 border-dashed border-border/80 hover:border-primary/55 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-muted/20 relative min-h-[130px] transition-colors">
        {preview ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={preview}
              alt="Preview"
              className={`max-h-14 object-contain ${darkPreview ? "bg-neutral-900 p-2 rounded" : ""}`}
            />
            <button type="button" onClick={onClear} className="text-xs font-medium text-destructive hover:underline">
              Remover
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 text-muted-foreground mb-1" />
            <p className="text-xs font-medium">{label}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{accept ?? "SVG, PNG ou JPG"}</p>
            <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Component
// ---------------------------------------------------------------------------
function Dashboard() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([defaultMicrosistec]);
  const serverBrandsRef = useRef<Brand[]>([]);

  // ── Modal visibility ──
  const [showFlowSelector, setShowFlowSelector] = useState(false);
  const [showFlowAModal, setShowFlowAModal] = useState(false);
  const [showFlowBModal, setShowFlowBModal] = useState(false);

  // ── Flow A states ──
  const [isGeneratingFlowA, setIsGeneratingFlowA] = useState(false);
  const [faBrandName, setFaBrandName] = useState("");
  const [faLogoBase64, setFaLogoBase64] = useState("");
  const [faSymbolBase64, setFaSymbolBase64] = useState("");
  const [faLogoReverseBase64, setFaLogoReverseBase64] = useState("");
  const [faSymbolReverseBase64, setFaSymbolReverseBase64] = useState("");
  const [faPrimaryColor, setFaPrimaryColor] = useState("#4f46e5");
  const [faSecondaryColor, setFaSecondaryColor] = useState("#06b6d4");
  const [faAccentColor, setFaAccentColor] = useState("#f59e0b");
  const [faCustomDomain, setFaCustomDomain] = useState("");
  const [faNicho, setFaNicho] = useState("");
  const [faPublicoAlvo, setFaPublicoAlvo] = useState("");
  const [faTomDeVoz, setFaTomDeVoz] = useState("");
  const [faEstiloVisual, setFaEstiloVisual] = useState("");
  const [faValores, setFaValores] = useState("");
  const [faDiferenciais, setFaDiferenciais] = useState("");
  const [faMission, setFaMission] = useState("");
  const [faVision, setFaVision] = useState("");
  const [faPromise, setFaPromise] = useState("");

  // ── Flow B states ──
  const [flowBStep, setFlowBStep] = useState<"briefing" | "loading-logos" | "logos" | "loading-manual">("briefing");
  const [fbNome, setFbNome] = useState("");
  const [fbNicho, setFbNicho] = useState("");
  const [fbPublicoAlvo, setFbPublicoAlvo] = useState("");
  const [fbProposito, setFbProposito] = useState("");
  const [fbValores, setFbValores] = useState("");
  const [fbPersonalidade, setFbPersonalidade] = useState("");
  const [fbDiferenciais, setFbDiferenciais] = useState("");
  const [fbReferencias, setFbReferencias] = useState("");
  const [fbObservacoes, setFbObservacoes] = useState("");
  const [fbEstiloVisual, setFbEstiloVisual] = useState("");
  const [fbTomDeVoz, setFbTomDeVoz] = useState("");
  const [fbPrefCores, setFbPrefCores] = useState("");
  const [fbCorFavorita, setFbCorFavorita] = useState("#4f46e5");
  const [generatedLogos, setGeneratedLogos] = useState<[GeneratedLogo, GeneratedLogo] | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [refinementNotes, setRefinementNotes] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // ── Drag-drop ──
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── Delete Brand Modal ──
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [isDeletingBrand, setIsDeletingBrand] = useState(false);

  // ── Utils ──
  const getMergedBrands = useCallback((): Brand[] => {
    const localStored = localStorage.getItem("custom_brands");
    const deletedIds: string[] = JSON.parse(localStorage.getItem("deleted_brand_ids") || "[]");
    let localBrands: Brand[] = [];
    if (localStored) { try { localBrands = JSON.parse(localStored); } catch { /* ignore */ } }
    const map = new Map<string, Brand>();
    for (const b of serverBrandsRef.current) { if (!deletedIds.includes(b.id)) map.set(b.id, b); }
    for (const b of localBrands) { if (!deletedIds.includes(b.id)) map.set(b.id, b); }
    return Array.from(map.values());
  }, []);

  const saveBrandToStorage = useCallback((newBrand: Brand) => {
    const currentMerged = getMergedBrands();
    const filtered = currentMerged.filter(b => b.id !== newBrand.id);
    const updated = [...filtered, newBrand];
    localStorage.setItem("custom_brands", JSON.stringify(updated));
    const deletedIds: string[] = JSON.parse(localStorage.getItem("deleted_brand_ids") || "[]");
    localStorage.setItem("deleted_brand_ids", JSON.stringify(deletedIds.filter(id => id !== newBrand.id)));
    saveBrandServer({ data: newBrand }).catch((err: any) => console.error("Failed to sync brand:", err));
    setBrands([defaultMicrosistec, ...updated]);
  }, [getMergedBrands]);

  // Load brands
  useEffect(() => {
    loadBrandsServer()
      .then((serverBrands: Brand[]) => {
        serverBrandsRef.current = serverBrands;
        setBrands([defaultMicrosistec, ...getMergedBrands()]);
      })
      .catch(() => setBrands([defaultMicrosistec, ...getMergedBrands()]));
  }, [getMergedBrands]);

  // Domain redirect
  useEffect(() => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;
    if (new URLSearchParams(window.location.search).get("bypass") === "true") return;
    const matched = brands.find(b => b.customDomain?.toLowerCase().trim() === host.toLowerCase().trim());
    if (matched) router.navigate({ to: "/brand/$brandId", params: { brandId: matched.id } });
  }, [brands, router]);

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  // ── Flow A handlers ──
  const handleFaLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result as string;
      setFaLogoBase64(b64);
      toast.info("Analisando logo para extrair cores...");
      try {
        const colors = await extractColorsFromImage(b64);
        setFaPrimaryColor(colors.primary);
        setFaSecondaryColor(colors.secondary);
        toast.success("Cores detectadas automaticamente!");
      } catch { /* ignore */ }
    };
    reader.readAsDataURL(file);
  };

  const resetFlowA = () => {
    setFaBrandName(""); setFaLogoBase64(""); setFaSymbolBase64("");
    setFaLogoReverseBase64(""); setFaSymbolReverseBase64("");
    setFaPrimaryColor("#4f46e5"); setFaSecondaryColor("#06b6d4"); setFaAccentColor("#f59e0b");
    setFaCustomDomain(""); setFaNicho(""); setFaPublicoAlvo(""); setFaTomDeVoz("");
    setFaEstiloVisual(""); setFaValores(""); setFaDiferenciais("");
    setFaMission(""); setFaVision(""); setFaPromise("");
  };

  const handleCreateBrandFlowA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faBrandName.trim()) { toast.error("Preencha o nome da marca."); return; }
    if (!faNicho.trim()) { toast.error("Preencha o Nicho/Segmento."); return; }
    if (!faPublicoAlvo.trim()) { toast.error("Preencha o Público-alvo."); return; }
    if (!faLogoBase64 || !faLogoReverseBase64 || !faSymbolBase64 || !faSymbolReverseBase64) {
      toast.error("Envie todas as 4 variações de logo obrigatórias."); return;
    }

    setIsGeneratingFlowA(true);
    const loadingToastId = toast.loading("A IA está analisando o briefing e gerando o manual...");

    try {
      const briefing: BriefingData = {
        nome: faBrandName.trim(),
        nicho: faNicho.trim(),
        publicoAlvo: faPublicoAlvo.trim(),
        proposito: faMission.trim() || undefined,
        valores: faValores.trim() || undefined,
        diferenciais: faDiferenciais.trim() || undefined,
        tomDeVoz: faTomDeVoz || undefined,
        estiloVisual: faEstiloVisual || undefined,
        corFavorita: faPrimaryColor,
      };

      const manualContent = await generateManualWithAI({
        data: { briefing, primaryColor: faPrimaryColor, secondaryColor: faSecondaryColor, accentColor: faAccentColor },
      });

      const newBrandId = faBrandName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const newBrand: Brand = {
        id: newBrandId,
        name: faBrandName.trim(),
        description: manualContent.description,
        heroTitle: manualContent.heroTitle,
        voiceExamples: manualContent.voiceExamples,
        logoUrl: faLogoBase64,
        symbolUrl: faSymbolBase64,
        logoReverseUrl: faLogoReverseBase64,
        symbolReverseUrl: faSymbolReverseBase64,
        mission: faMission.trim() || manualContent.mission,
        vision: faVision.trim() || manualContent.vision,
        promise: (faPromise.trim() && faPromise.trim().length <= 80 && !faPromise.includes(":"))
          ? faPromise.trim()
          : manualContent.promise,
        values: manualContent.values,
        palette: manualContent.palette,
        customDomain: faCustomDomain.trim() || undefined,
        flow: "A",
        briefing,
        createdAt: new Date().toISOString(),
      };

      saveBrandToStorage(newBrand);
      toast.success("Manual de Marca gerado com sucesso!", { id: loadingToastId });
      setShowFlowAModal(false);
      resetFlowA();
      router.navigate({ to: `/brand/${newBrandId}` });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar o manual. Tente novamente.", { id: loadingToastId });
    } finally {
      setIsGeneratingFlowA(false);
    }
  };

  // ── Flow B handlers ──
  const getFlowBBriefing = (): Partial<BriefingData> => ({
    nome: fbNome, nicho: fbNicho, publicoAlvo: fbPublicoAlvo,
    proposito: fbProposito || undefined, valores: fbValores || undefined,
    personalidade: fbPersonalidade || undefined, diferenciais: fbDiferenciais || undefined,
    referencias: fbReferencias || undefined, observacoes: fbObservacoes || undefined,
    estiloVisual: fbEstiloVisual || undefined, tomDeVoz: fbTomDeVoz || undefined,
    prefCores: fbPrefCores || undefined, corFavorita: fbCorFavorita || undefined,
  });

  const resetFlowB = () => {
    setFlowBStep("briefing");
    setFbNome(""); setFbNicho(""); setFbPublicoAlvo(""); setFbProposito("");
    setFbValores(""); setFbPersonalidade(""); setFbDiferenciais("");
    setFbReferencias(""); setFbObservacoes(""); setFbEstiloVisual("");
    setFbTomDeVoz(""); setFbPrefCores(""); setFbCorFavorita("#4f46e5");
    setGeneratedLogos(null); setSelectedLogoId(null); setRefinementNotes("");
  };

  const handleFlowBGenerateLogos = async () => {
    if (!fbNome.trim() || !fbNicho.trim() || !fbPublicoAlvo.trim()) {
      toast.error("Preencha os campos obrigatórios: Nome, Nicho e Público-alvo.");
      return;
    }
    setFlowBStep("loading-logos");
    try {
      const result = await generateLogosWithAI({ data: getFlowBBriefing() as BriefingData });
      setGeneratedLogos(result.logos);
      setSelectedLogoId(result.logos[0].id);
      setFlowBStep("logos");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar logos. Verifique a conexão e tente novamente.");
      setFlowBStep("briefing");
    }
  };

  const handleFlowBRefine = async () => {
    if (!selectedLogoId) { toast.error("Selecione uma logo para refinar."); return; }
    if (!refinementNotes.trim()) { toast.error("Descreva o que deve ser melhorado."); return; }
    const selectedLogo = generatedLogos?.find(l => l.id === selectedLogoId);
    if (!selectedLogo) return;

    setIsRefining(true);
    try {
      const refined = await refineLogoWithAI({
        data: { briefing: getFlowBBriefing() as BriefingData, existingSvg: selectedLogo.svgCode, refinementNotes },
      });
      setGeneratedLogos(prev => {
        if (!prev) return prev;
        const updated = prev.map(l => l.id === selectedLogoId ? refined : l);
        return updated as [GeneratedLogo, GeneratedLogo];
      });
      setSelectedLogoId(refined.id);
      setRefinementNotes("");
      toast.success("Logo refinada com sucesso!");
    } catch (err) {
      toast.error("Erro ao refinar a logo.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleFlowBRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateAllLogosWithAI({ data: getFlowBBriefing() as BriefingData });
      setGeneratedLogos(result.logos);
      setSelectedLogoId(result.logos[0].id);
      setRefinementNotes("");
      toast.success("Novas opções geradas!");
    } catch (err) {
      toast.error("Erro ao regerar logos.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFlowBApprove = async () => {
    const selectedLogo = generatedLogos?.find(l => l.id === selectedLogoId);
    if (!selectedLogo) { toast.error("Selecione uma logo para prosseguir."); return; }

    setFlowBStep("loading-manual");
    try {
      const briefing = getFlowBBriefing();
      const colors = deriveColorsFromBriefing(briefing);

      const manualContent = await generateManualWithAI({
        data: { briefing: briefing as BriefingData, primaryColor: colors.primary, secondaryColor: colors.secondary, accentColor: colors.accent },
      });

      const brandName = fbNome.trim();
      const newBrandId = brandName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      // Gera as 4 variações oficiais a partir do SVG aprovado:
      const variations = generateBrandSvgVariations(selectedLogo.svgCode);
      const logoUrl = svgToDataUrl(variations.logoSvg);
      const logoReverseUrl = svgToDataUrl(variations.logoReverseSvg);
      const symbolUrl = svgToDataUrl(variations.symbolSvg);
      const symbolReverseUrl = svgToDataUrl(variations.symbolReverseSvg);

      const newBrand: Brand = {
        id: newBrandId,
        name: brandName,
        description: manualContent.description,
        heroTitle: manualContent.heroTitle,
        voiceExamples: manualContent.voiceExamples,
        logoUrl,
        logoReverseUrl,
        symbolUrl,
        symbolReverseUrl,
        mission: manualContent.mission,
        vision: manualContent.vision,
        promise: manualContent.promise,
        values: manualContent.values,
        palette: manualContent.palette,
        flow: "B",
        briefing: briefing as BriefingData,
        createdAt: new Date().toISOString(),
      };

      saveBrandToStorage(newBrand);
      toast.success("Identidade Visual criada com sucesso!");
      setShowFlowBModal(false);
      resetFlowB();
      router.navigate({ to: `/brand/${newBrandId}` });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar o manual. Tente novamente.");
      setFlowBStep("logos");
    }
  };

  // ── Drag-drop handlers ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === "microsistec") { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (targetId === "microsistec") return;
    const dragId = e.dataTransfer.getData("text/plain");
    if (!dragId || dragId === targetId || dragId === "microsistec") return;
    try {
      const customBrands = getMergedBrands();
      const draggedIndex = customBrands.findIndex(b => b.id === dragId);
      const targetIndex = customBrands.findIndex(b => b.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return;
      const updated = [...customBrands];
      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, removed);
      localStorage.setItem("custom_brands", JSON.stringify(updated));
      saveAllBrandsServer({ data: updated }).catch((err: any) => console.error(err));
      setBrands([defaultMicrosistec, ...updated]);
      toast.success("Ordem atualizada!");
    } catch (err) { console.error(err); }
    setDraggedId(null); setDragOverId(null);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  // ── Export/Import ──
  const handleExportBrand = (brand: Brand) => {
    const blob = new Blob([JSON.stringify({ ...brand, _exportVersion: "2.0", _exportDate: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `manual-${brand.id}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Manual "${brand.name}" exportado!`);
  };

  const handleImportBrand = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.id || !data.name || !data.palette) { toast.error("Arquivo inválido."); return; }
        if (data.id === "microsistec") { toast.error("Não é possível importar o manual Microsistec."); return; }
        const { _exportVersion, _exportDate, ...brandData } = data;
        saveBrandToStorage(brandData as Brand);
        toast.success(`Manual "${brandData.name}" importado!`);
      } catch { toast.error("Erro ao ler o arquivo."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Delete Brand ──
  const handleConfirmDelete = async () => {
    if (!brandToDelete) return;
    setIsDeletingBrand(true);
    try {
      const id = brandToDelete.id;
      // 1. Remove from custom_brands in localStorage
      const stored = localStorage.getItem("custom_brands");
      if (stored) {
        try {
          const parsed: Brand[] = JSON.parse(stored);
          const filtered = parsed.filter(b => b.id !== id);
          localStorage.setItem("custom_brands", JSON.stringify(filtered));
        } catch { /* ignore */ }
      }
      // 2. Track as deleted
      const deletedIds: string[] = JSON.parse(localStorage.getItem("deleted_brand_ids") || "[]");
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("deleted_brand_ids", JSON.stringify(deletedIds));
      }
      // 3. Delete from server
      await deleteBrandServer({ data: { id } }).catch((err: any) => console.error("Error deleting from server:", err));

      // 4. Update UI
      setBrands(prev => prev.filter(b => b.id !== id));
      toast.success(`Manual "${brandToDelete.name}" excluído com sucesso!`);
      setBrandToDelete(null);
    } catch (err) {
      console.error("Failed to delete brand:", err);
      toast.error("Erro ao excluir o manual. Tente novamente.");
    } finally {
      setIsDeletingBrand(false);
    }
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Toaster position="top-center" duration={3500} richColors />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl shadow-lg">M</div>
            <div>
              <span className="font-display font-semibold tracking-tight text-lg block leading-none">Manual de Marca</span>
              <span className="text-[10px] text-muted-foreground font-mono">Gerador & Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground px-3 py-2.5 text-sm font-medium transition-all cursor-pointer" title="Importar manual (.json)">
              <FileUp className="w-4 h-4" />
              <span className="hidden sm:inline">Importar</span>
              <input type="file" accept=".json,application/json" onChange={handleImportBrand} className="hidden" />
            </label>
            <button
              onClick={() => setShowFlowSelector(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novo Manual
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="max-w-3xl mb-10">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-tight">
            Central de <span className="text-primary">Identidade Visual</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Padronize sua logo existente ou crie uma identidade visual completa do zero com inteligência artificial.
          </p>
        </div>

        {/* ── CTA Cards ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          <button
            onClick={() => setShowFlowAModal(true)}
            className="group relative text-left rounded-2xl border border-border bg-card hover:border-primary/60 hover:shadow-xl p-6 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ImagePlus className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-full mb-3">
                Fluxo A
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">
                Padronizar minha Marca
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você já tem um logo. Faça o upload dos assets e a IA gera o manual de identidade visual completo baseado no seu briefing.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary">
                Gerar Manual para minha Logo
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowFlowBModal(true)}
            className="group relative text-left rounded-2xl border border-border bg-card hover:border-violet-500/60 hover:shadow-xl p-6 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-full mb-3">
                Fluxo B
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 group-hover:text-violet-600 transition-colors">
                Criar Identidade Visual Completa
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você parte do zero. A IA cria as opções de logo, você escolhe e refina, depois gera o manual completo.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-violet-600">
                Criar do Zero com IA
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* ── Brand Cards Grid ── */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold">Manuais Criados</h2>
          <span className="text-xs font-mono text-muted-foreground">{brands.length} {brands.length === 1 ? "manual" : "manuais"}</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              draggable={brand.id !== "microsistec"}
              onDragStart={(e) => handleDragStart(e, brand.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, brand.id)}
              onDragEnd={handleDragEnd}
              onDragEnter={() => { if (brand.id !== "microsistec") setDragOverId(brand.id); }}
              onDragLeave={() => setDragOverId(null)}
              className={`group rounded-2xl border p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 ${
                brand.id !== "microsistec" ? "cursor-grab active:cursor-grabbing hover:border-primary/50" : "hover:border-primary/30"
              } ${draggedId === brand.id ? "opacity-30 scale-[0.97] border-dashed" : ""} ${
                dragOverId === brand.id ? "border-dashed border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-5">
                  <div className="h-12 w-auto max-w-[150px] flex items-center">
                    <DynamicLogoMark
                      logoUrl={brand.logoUrl} symbolUrl={brand.symbolUrl}
                      logoReverseUrl={brand.logoReverseUrl} symbolReverseUrl={brand.symbolReverseUrl}
                      brandName={brand.name} variant="original" withWordmark={false}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {brand.palette.primary.slice(0, 1).map(c => (
                      <span key={c.hex} className="w-4 h-4 rounded-full border border-border/20 shadow-inner" style={{ backgroundColor: c.hex }} title={c.name} />
                    ))}
                    {brand.palette.secondary?.slice(0, 1).map(c => (
                      <span key={c.hex} className="w-4 h-4 rounded-full border border-border/20 shadow-inner" style={{ backgroundColor: c.hex }} title={c.name} />
                    ))}
                  </div>
                </div>

                {/* Flow Badge */}
                <div className="mb-2">
                  <FlowBadge flow={brand.flow} />
                </div>

                <h3 className="font-display font-semibold text-xl group-hover:text-primary transition-colors">{brand.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{getCleanHeroDescription(brand)}</p>
              </div>

              <div className="mt-5 pt-5 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-muted-foreground uppercase">v1.0</span>
                  {brand.id !== "microsistec" && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportBrand(brand); }}
                        className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                        title="Exportar manual como JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setBrandToDelete(brand); }}
                        className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-all"
                        title={`Excluir manual ${brand.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <Link
                  to="/brand/$brandId"
                  params={{ brandId: brand.id }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 group-hover:translate-x-1 transition-all"
                >
                  Ver Manual <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Create new card */}
          <div
            onClick={() => setShowFlowSelector(true)}
            className="rounded-2xl border border-dashed border-border/80 hover:border-primary/60 bg-card/40 hover:bg-card/80 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-xl">Criar Novo Manual</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">Com logo própria ou criada do zero pela IA.</p>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════
          MODAL: Seletor de Fluxo
      ════════════════════════════════════════════════════════════════ */}
      {showFlowSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-7 relative">
            <button onClick={() => setShowFlowSelector(false)} className="absolute top-5 right-5 p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-display font-bold">Como quer começar?</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Escolha o fluxo de criação que melhor se encaixa na sua situação.</p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowFlowSelector(false); setShowFlowAModal(true); }}
                className="w-full text-left p-4 rounded-2xl border border-border hover:border-teal-500/60 hover:bg-teal-500/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm group-hover:text-teal-700 transition-colors">Padronizar minha Marca</div>
                    <div className="text-xs text-muted-foreground">Já tenho um logo — quero gerar o manual</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </div>
              </button>
              <button
                onClick={() => { setShowFlowSelector(false); setShowFlowBModal(true); }}
                className="w-full text-left p-4 rounded-2xl border border-border hover:border-violet-500/60 hover:bg-violet-500/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm group-hover:text-violet-700 transition-colors">Criar Identidade Visual Completa</div>
                    <div className="text-xs text-muted-foreground">Não tenho logo — a IA cria tudo do zero</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL: FLUXO A — Padronizar Marca com Logo Existente
      ════════════════════════════════════════════════════════════════ */}
      {showFlowAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border shadow-2xl p-6 md:p-8 relative">
            <button onClick={() => { setShowFlowAModal(false); resetFlowA(); }} className="absolute top-6 right-6 p-2 rounded-full border border-border hover:bg-muted text-muted-foreground transition-all">
              <X className="w-4 h-4" />
            </button>

            <div className="mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-full">Fluxo A</span>
            </div>
            <h2 className="text-2xl font-display font-bold mt-2">Padronizar minha Marca</h2>
            <p className="text-sm text-muted-foreground mt-1">Faça upload das variações de logo e preencha o briefing — a IA gera o manual completo.</p>

            <form onSubmit={handleCreateBrandFlowA} className="mt-7 space-y-6">
              {/* Assets */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary border-b border-border/80 pb-2 mb-4">Assets da Marca</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <UploadZone label="Logotipo Completo" required preview={faLogoBase64} onClear={() => setFaLogoBase64("")} onUpload={handleFaLogoUpload} />
                  <UploadZone label="Símbolo Isolado (Ícone)" required preview={faSymbolBase64} onClear={() => setFaSymbolBase64("")} onUpload={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { setFaSymbolBase64(r.result as string); toast.success("Símbolo carregado!"); }; r.readAsDataURL(f); } }} />
                  <UploadZone label="Logotipo Reverso" required darkPreview preview={faLogoReverseBase64} onClear={() => setFaLogoReverseBase64("")} onUpload={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { setFaLogoReverseBase64(r.result as string); toast.success("Logo reversa carregada!"); }; r.readAsDataURL(f); } }} />
                  <UploadZone label="Símbolo Reverso" required darkPreview preview={faSymbolReverseBase64} onClear={() => setFaSymbolReverseBase64("")} onUpload={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { setFaSymbolReverseBase64(r.result as string); toast.success("Símbolo reverso carregado!"); }; r.readAsDataURL(f); } }} />
                </div>
              </div>

              {/* Info básica */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary border-b border-border/80 pb-2 mb-4">Informações da Marca</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Nome da Marca <span className="text-red-500">*</span></label>
                    <input type="text" required value={faBrandName} onChange={e => setFaBrandName(e.target.value)} placeholder="Ex: Microsistec" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Nicho / Segmento <span className="text-red-500">*</span></label>
                    <input type="text" required value={faNicho} onChange={e => setFaNicho(e.target.value)} placeholder="Ex: SaaS B2B, Clínica de Estética" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Público-alvo <span className="text-red-500">*</span></label>
                    <input type="text" required value={faPublicoAlvo} onChange={e => setFaPublicoAlvo(e.target.value)} placeholder="Ex: Empreendedores 25-40 anos, PMEs do setor de serviços" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Tom de Voz</label>
                    <select value={faTomDeVoz} onChange={e => setFaTomDeVoz(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors">
                      <option value="">Selecione...</option>
                      <option>Formal e Técnico</option>
                      <option>Profissional e Direto</option>
                      <option>Descontraído e Humano</option>
                      <option>Inspiracional e Ousado</option>
                      <option>Jovem e Criativo</option>
                      <option>Luxo e Refinado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Estilo Visual</label>
                    <select value={faEstiloVisual} onChange={e => setFaEstiloVisual(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors">
                      <option value="">Selecione...</option>
                      <option>Minimalista</option>
                      <option>Bold e Expressivo</option>
                      <option>Orgânico e Natural</option>
                      <option>Corporativo</option>
                      <option>Tecnológico</option>
                      <option>Luxo e Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Valores da Marca</label>
                    <input type="text" value={faValores} onChange={e => setFaValores(e.target.value)} placeholder="Ex: Inovação, Confiança, Simplicidade" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Diferenciais</label>
                    <input type="text" value={faDiferenciais} onChange={e => setFaDiferenciais(e.target.value)} placeholder="Ex: Suporte 24h, Sem contratos longos" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
              </div>

              {/* Essência (opcional - se deixar vazio a IA gera) */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary border-b border-border/80 pb-2 mb-4">
                  Essência da Marca <span className="text-muted-foreground font-sans lowercase font-normal tracking-normal">(opcional — IA gera automaticamente)</span>
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Missão</label>
                    <textarea value={faMission} onChange={e => setFaMission(e.target.value)} placeholder="A IA vai criar baseada no briefing..." rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Visão</label>
                    <textarea value={faVision} onChange={e => setFaVision(e.target.value)} placeholder="A IA vai criar baseada no briefing..." rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Promessa</label>
                    <textarea value={faPromise} onChange={e => setFaPromise(e.target.value)} placeholder="A IA vai criar baseada no briefing..." rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary resize-none" />
                  </div>
                </div>
              </div>

              {/* Paleta */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary border-b border-border/80 pb-2 mb-4">Paleta de Cores</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Principal", value: faPrimaryColor, onChange: setFaPrimaryColor },
                    { label: "Secundária", value: faSecondaryColor, onChange: setFaSecondaryColor },
                    { label: "Acento", value: faAccentColor, onChange: setFaAccentColor },
                  ].map(({ label, value, onChange }) => (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <label className="text-[11px] font-semibold text-center">{label}</label>
                      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-14 h-10 rounded-lg cursor-pointer border border-border p-0.5 bg-background" />
                      <span className="text-[10px] font-mono text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Domínio */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Domínio Personalizado <span className="text-[10px] font-sans lowercase font-normal">(opcional)</span></label>
                <input type="text" value={faCustomDomain} onChange={e => setFaCustomDomain(e.target.value)} placeholder="Ex: manual.suamarca.com.br" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => { setShowFlowAModal(false); resetFlowA(); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors" disabled={isGeneratingFlowA}>
                  Cancelar
                </button>
                <button type="submit" disabled={isGeneratingFlowA} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
                  {isGeneratingFlowA ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando com IA...</> : <><Wand2 className="w-4 h-4" /> Gerar Manual de Marca</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL: FLUXO B — Criar Identidade Visual do Zero
      ════════════════════════════════════════════════════════════════ */}
      {showFlowBModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border shadow-2xl relative">

            {/* Header fixo do modal */}
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 md:px-8 py-5 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> Fluxo B
                </div>
                <h2 className="text-xl font-display font-bold mt-1.5">
                  {flowBStep === "briefing" && "Criar Identidade Visual Completa"}
                  {flowBStep === "loading-logos" && "Gerando opções de logo..."}
                  {flowBStep === "logos" && "Escolha sua Logo"}
                  {flowBStep === "loading-manual" && "Gerando o Manual..."}
                </h2>
                {flowBStep === "briefing" && <p className="text-xs text-muted-foreground mt-0.5">Preencha o briefing para a IA criar suas opções de logo.</p>}
                {flowBStep === "logos" && <p className="text-xs text-muted-foreground mt-0.5">Aprove, refine ou regenere as opções abaixo.</p>}
              </div>
              <button
                onClick={() => { setShowFlowBModal(false); resetFlowB(); }}
                className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Passo 1: Briefing ── */}
            {flowBStep === "briefing" && (
              <div className="p-6 md:p-8 space-y-6">
                {/* Obrigatório */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-primary border-b border-border/80 pb-2 mb-4">
                    O Essencial <span className="text-red-500">*</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Nome da Empresa <span className="text-red-500">*</span></label>
                      <input type="text" value={fbNome} onChange={e => setFbNome(e.target.value)} placeholder="Ex: Kinetic Studio" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Nicho / Segmento <span className="text-red-500">*</span></label>
                      <input type="text" value={fbNicho} onChange={e => setFbNicho(e.target.value)} placeholder="Ex: Estúdio de Design UX/UI, Clínica de Fisioterapia Esportiva" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Público-alvo <span className="text-red-500">*</span></label>
                      <input type="text" value={fbPublicoAlvo} onChange={e => setFbPublicoAlvo(e.target.value)} placeholder="Ex: Startups early-stage buscando identidade profissional" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Posicionamento */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border/80 pb-2 mb-4">Posicionamento <span className="text-muted-foreground font-sans lowercase font-normal tracking-normal">(opcional, mas melhora muito o resultado)</span></h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1">Missão / Propósito</label>
                      <textarea value={fbProposito} onChange={e => setFbProposito(e.target.value)} placeholder="Por que esta empresa existe? O que a move no dia a dia?" rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold block mb-1">Valores</label>
                        <input type="text" value={fbValores} onChange={e => setFbValores(e.target.value)} placeholder="Ex: Liberdade criativa, Qualidade artesanal" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1">Personalidade da Marca</label>
                        <select value={fbPersonalidade} onChange={e => setFbPersonalidade(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors">
                          <option value="">Selecione...</option>
                          <option>Ousada e Disruptiva</option>
                          <option>Clássica e Atemporal</option>
                          <option>Moderna e Tecnológica</option>
                          <option>Amigável e Próxima</option>
                          <option>Luxuosa e Exclusiva</option>
                          <option>Jovem e Descontraída</option>
                          <option>Séria e Confiável</option>
                          <option>Criativa e Artística</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold block mb-1">Diferenciais</label>
                        <input type="text" value={fbDiferenciais} onChange={e => setFbDiferenciais(e.target.value)} placeholder="O que só você oferece?" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1">Referências / Concorrentes</label>
                        <input type="text" value={fbReferencias} onChange={e => setFbReferencias(e.target.value)} placeholder="Ex: Notion, Figma, Linear" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Observações livres</label>
                      <textarea value={fbObservacoes} onChange={e => setFbObservacoes(e.target.value)} placeholder="Qualquer coisa relevante que a IA deva saber sobre a marca..." rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none" />
                    </div>
                  </div>
                </div>

                {/* Direção Visual */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border/80 pb-2 mb-4">Direção Visual</h3>
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold block mb-1">Estilo Visual</label>
                        <select value={fbEstiloVisual} onChange={e => setFbEstiloVisual(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors">
                          <option value="">Sem preferência</option>
                          <option>Minimalista</option>
                          <option>Bold e Impactante</option>
                          <option>Orgânico e Natural</option>
                          <option>Geométrico e Preciso</option>
                          <option>Corporativo e Sério</option>
                          <option>Handcrafted e Artesanal</option>
                          <option>Futurista e Tecnológico</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1">Tom de Voz</label>
                        <select value={fbTomDeVoz} onChange={e => setFbTomDeVoz(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors">
                          <option value="">Sem preferência</option>
                          <option>Formal e Técnico</option>
                          <option>Profissional e Direto</option>
                          <option>Descontraído e Humano</option>
                          <option>Inspiracional e Motivacional</option>
                          <option>Jovem e Criativo</option>
                          <option>Luxo e Refinado</option>
                          <option>Pragmático e Objetivo</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-2">Temperatura de Cores</label>
                      <div className="flex flex-wrap gap-2">
                        {["Quentes", "Frias", "Neutras", "Terrosas", "Vibrantes", "Escuras/Dark"].map(opt => (
                          <button
                            key={opt} type="button"
                            onClick={() => setFbPrefCores(fbPrefCores === opt ? "" : opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${fbPrefCores === opt ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Cor Favorita / Referência <span className="text-muted-foreground font-normal">(opcional)</span></label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={fbCorFavorita} onChange={e => setFbCorFavorita(e.target.value)} className="w-12 h-9 rounded-lg cursor-pointer border border-border p-0.5 bg-background" />
                        <span className="text-sm font-mono text-muted-foreground">{fbCorFavorita}</span>
                        <button type="button" onClick={() => setFbCorFavorita("")} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Limpar</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => { setShowFlowBModal(false); resetFlowB(); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleFlowBGenerateLogos}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar Opções de Logo
                  </button>
                </div>
              </div>
            )}

            {/* ── Passo 2: Loading Logos ── */}
            {flowBStep === "loading-logos" && (
              <div className="p-8 flex flex-col items-center justify-center min-h-[340px] gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <Sparkles className="w-9 h-9 text-violet-500" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl border-2 border-violet-500/30 animate-ping" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-display font-semibold">A IA está criando suas logos...</h3>
                  <p className="text-sm text-muted-foreground">Estamos gerando 2 opções únicas baseadas no seu briefing.<br />Isso pode levar alguns segundos.</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-violet-500" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Passo 3: Logos geradas ── */}
            {flowBStep === "logos" && generatedLogos && (
              <div className="p-6 md:p-8 space-y-6">
                {/* Logo cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {generatedLogos.map((logo, idx) => (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => setSelectedLogoId(logo.id)}
                      className={`relative rounded-2xl border-2 p-4 transition-all duration-300 text-left ${
                        selectedLogoId === logo.id
                          ? "border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                          : "border-border hover:border-violet-500/40 bg-card"
                      }`}
                    >
                      {selectedLogoId === logo.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className="aspect-[5/2] rounded-xl bg-white border border-border/40 flex items-center justify-center p-3 mb-3 overflow-hidden shadow-xs [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:object-contain"
                        dangerouslySetInnerHTML={{ __html: logo.svgCode }}
                      />
                      <div className="text-[10px] font-mono uppercase tracking-widest text-violet-600 mb-0.5">Opção {idx + 1}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{logo.concept}</div>
                    </button>
                  ))}
                </div>

                {/* Refinamento */}
                {selectedLogoId && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">
                      <Pencil className="w-3 h-3 inline mr-1" />
                      Refinar a logo selecionada
                    </label>
                    <textarea
                      value={refinementNotes}
                      onChange={e => setRefinementNotes(e.target.value)}
                      placeholder="Descreva o que melhorar... Ex: 'Tornar mais minimalista', 'Usar cores mais quentes', 'Menos elementos, mais espaço negativo'"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleFlowBRefine}
                        disabled={isRefining || !refinementNotes.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        {isRefining ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Refinando...</> : <><Wand2 className="w-3.5 h-3.5" /> Refinar Logo Selecionada</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleFlowBRegenerate}
                    disabled={isRegenerating}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {isRegenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerando...</> : <><RefreshCw className="w-3.5 h-3.5" /> Regerar Tudo</>}
                  </button>

                  <button
                    type="button"
                    onClick={handleFlowBApprove}
                    disabled={!selectedLogoId}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    Aprovar e Gerar Manual
                  </button>
                </div>
              </div>
            )}

            {/* ── Passo 4: Loading Manual ── */}
            {flowBStep === "loading-manual" && (
              <div className="p-8 flex flex-col items-center justify-center min-h-[340px] gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Palette className="w-9 h-9 text-primary" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl border-2 border-primary/30 animate-ping" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-display font-semibold">Gerando o Manual de Identidade Visual...</h3>
                  <p className="text-sm text-muted-foreground">A IA está criando missão, visão, valores, paleta e<br />diretrizes de tom de voz. Quase pronto!</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de Confirmação de Exclusão ── */}
      {brandToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 relative">
            <button
              onClick={() => !isDeletingBrand && setBrandToDelete(null)}
              disabled={isDeletingBrand}
              className="absolute top-4 right-4 p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-foreground">Excluir Manual de Marca</h3>
                <p className="text-xs text-muted-foreground font-mono">Ação irreversível</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-3.5 my-4">
              <div className="w-10 h-10 rounded-xl bg-background border border-border/80 flex items-center justify-center p-1 shrink-0">
                <DynamicLogoMark
                  logoUrl={brandToDelete.logoUrl}
                  symbolUrl={brandToDelete.symbolUrl}
                  logoReverseUrl={brandToDelete.logoReverseUrl}
                  symbolReverseUrl={brandToDelete.symbolReverseUrl}
                  brandName={brandToDelete.name}
                  variant="original"
                  withWordmark={false}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{brandToDelete.name}</div>
                <div className="text-xs text-muted-foreground truncate">{brandToDelete.flow === "B" ? "Criado com IA do zero" : "Padronizado via upload"}</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Tem certeza que deseja excluir o manual de <strong>{brandToDelete.name}</strong>? Todas as diretrizes de cores, tipografia, aplicações e variações serão removidas permanentemente.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingBrand}
                onClick={() => setBrandToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingBrand}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingBrand ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Manual
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
