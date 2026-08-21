/**
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 * Server functions para geração e refinamento de logos via Google Gemini AI
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";
import path from "node:path";
import type { BriefingData, GeneratedLogo, LogoGenerationResult } from "../types";

// ---------------------------------------------------------------------------
// Schemas de validação
// ---------------------------------------------------------------------------
const BriefingSchema = z.object({
  nome: z.string().min(1),
  nicho: z.string().min(1),
  publicoAlvo: z.string().min(1),
  proposito: z.string().optional(),
  valores: z.string().optional(),
  personalidade: z.string().optional(),
  diferenciais: z.string().optional(),
  referencias: z.string().optional(),
  observacoes: z.string().optional(),
  estiloVisual: z.string().optional(),
  tomDeVoz: z.string().optional(),
  prefCores: z.string().optional(),
  corFavorita: z.string().optional(),
});

const RefineLogoSchema = z.object({
  briefing: BriefingSchema,
  existingSvg: z.string(),
  refinementNotes: z.string(),
});

// ---------------------------------------------------------------------------
// Helper de carregamento de chave de API
// ---------------------------------------------------------------------------
export function getGeminiApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim() !== "") {
    return process.env.VITE_GEMINI_API_KEY.trim();
  }
  try {
    const cwd = process.cwd();
    const envPaths = [path.resolve(cwd, ".env"), path.resolve(cwd, ".env.local")];
    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match =
          content.match(/^GEMINI_API_KEY=(.+)$/m) ||
          content.match(/^VITE_GEMINI_API_KEY=(.+)$/m);
        if (match && match[1]) {
          const key = match[1].trim().replace(/^["']|["']$/g, "");
          if (key) {
            process.env.GEMINI_API_KEY = key;
            return key;
          }
        }
      }
    }
  } catch (err) {
    console.error("[ai-logo] ⚠️ Erro ao carregar .env local:", err);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Mapeamento Tipográfico Inteligente por Nicho e Tom
// ---------------------------------------------------------------------------
function selectGoogleFont(briefing: BriefingData): { fontName: string; fontUrl: string } {
  const nicho = (briefing.nicho || "").toLowerCase();
  const estilo = (briefing.estiloVisual || "").toLowerCase();
  const tom = (briefing.tomDeVoz || "").toLowerCase();
  const personalidade = (briefing.personalidade || "").toLowerCase();

  // Nichos de Luxo, Moda, Alta Gastronomia ou Estilo Clássico
  if (
    nicho.includes("moda") ||
    nicho.includes("fashion") ||
    nicho.includes("luxo") ||
    nicho.includes("luxury") ||
    nicho.includes("joia") ||
    estilo.includes("luxo") ||
    personalidade.includes("clássic") ||
    tom.includes("refinado")
  ) {
    return {
      fontName: "Playfair Display",
      fontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500&display=swap",
    };
  }

  // Nichos de Tecnologia, SaaS, Engenharia, Dados
  if (
    nicho.includes("tech") ||
    nicho.includes("software") ||
    nicho.includes("saas") ||
    nicho.includes("ia") ||
    nicho.includes("data") ||
    estilo.includes("futurist") ||
    estilo.includes("tecnológico")
  ) {
    return {
      fontName: "Inter",
      fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Space+Grotesk:wght@500;700&display=swap",
    };
  }

  // Estilo Bold, Ousado ou Corporativo Marcante
  if (estilo.includes("bold") || personalidade.includes("ousad") || tom.includes("direto")) {
    return {
      fontName: "Montserrat",
      fontUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&family=Inter:wght@400;500&display=swap",
    };
  }

  // Padrão versátil e contemporâneo (Outfit)
  return {
    fontName: "Outfit",
    fontUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap",
  };
}

// ---------------------------------------------------------------------------
// Geração de Cores Harmônicas
// ---------------------------------------------------------------------------
function resolvePaletteColors(briefing: BriefingData, optionNumber: 1 | 2): { primaryHex: string; secondaryHex: string } {
  if (briefing.corFavorita) {
    return {
      primaryHex: briefing.corFavorita,
      secondaryHex: optionNumber === 1 ? "#06B6D4" : "#8B5CF6",
    };
  }

  const pref = (briefing.prefCores || "").toLowerCase();
  if (pref.includes("quent")) return { primaryHex: "#E11D48", secondaryHex: "#F97316" };
  if (pref.includes("fri")) return { primaryHex: "#0284C7", secondaryHex: "#06B6D4" };
  if (pref.includes("terr")) return { primaryHex: "#854D0E", secondaryHex: "#D97706" };
  if (pref.includes("vibrant")) return { primaryHex: "#7C3AED", secondaryHex: "#EC4899" };
  if (pref.includes("escur") || pref.includes("dark")) return { primaryHex: "#0F172A", secondaryHex: "#475569" };

  // Neutras / Default
  return optionNumber === 1
    ? { primaryHex: "#1E293B", secondaryHex: "#3B82F6" }
    : { primaryHex: "#0F766E", secondaryHex: "#14B8A6" };
}

// ---------------------------------------------------------------------------
// Prompts do Gemini
// ---------------------------------------------------------------------------

/**
 * Monta o System Prompt profissional para geração de logo completa com Ícone + Tipografia.
 */
function buildLogoPrompt(briefing: BriefingData, optionNumber: 1 | 2): string {
  const { fontName, fontUrl } = selectGoogleFont(briefing);
  const { primaryHex, secondaryHex } = resolvePaletteColors(briefing, optionNumber);

  const variationConcept =
    optionNumber === 1
      ? "OPÇÃO 1 — Conceito Estruturado & Geométrico: Ícone vetor com linhas precisas, equilíbrio clássico e alta autoridade."
      : "OPÇÃO 2 — Conceito Dinâmico & Conceitual: Ícone vetor com curvas fluídas, formas sobrepostas ou gradientes que transmitem evolução e modernidade.";

  // Ajuste inteligente de tamanho de fonte para evitar quebras em nomes longos
  const nameLength = briefing.nome.length;
  const brandFontSize = nameLength > 16 ? "34px" : nameLength > 12 ? "40px" : "48px";
  const brandYPos = nameLength > 16 ? "102" : "105";

  return `Você é um Engenheiro de SVG e Designer de Identidades Visuais Sênior especializado em criar logos premiados para grandes marcas mundiais.

Sua missão é gerar APENAS o código SVG válido, limpo e profissional para a marca descrita abaixo. O logotipo DEVE ser composto por um SÍMBOLO (Ícone Vetorial de alto padrão) à esquerda e a TIPOGRAFIA (Nome + Nicho) à direita.

=== INFORMAÇÕES DO BRIEFING ===
• Nome da Empresa: ${briefing.nome}
• Nicho / Segmento: ${briefing.nicho}
• Público-Alvo: ${briefing.publicoAlvo}
• Personalidade da Marca: ${briefing.personalidade || "Profissional e Confiável"}
• Estilo Visual Desejado: ${briefing.estiloVisual || "Moderno e Minimalista"}
• Tom de Voz: ${briefing.tomDeVoz || "Profissional"}
• Cores Sugeridas: Primária ${primaryHex}, Secundária ${secondaryHex}

=== DIRETRIZ DESTE CONCEITO ===
${variationConcept}

=== ESQUELETO OBRIGATÓRIO DO SVG (Siga estritamente esta estrutura) ===
<svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('${fontUrl}');
      .brand-name { font-family: '${fontName}', sans-serif; font-size: ${brandFontSize}; font-weight: 700; fill: #1A1A1A; }
      .brand-niche { font-family: '${fontName}', sans-serif; font-size: 16px; font-weight: 400; fill: #666666; letter-spacing: 3px; text-transform: uppercase; }
    </style>
    <linearGradient id="brandGrad_${optionNumber}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryHex}" />
      <stop offset="100%" stop-color="${secondaryHex}" />
    </linearGradient>
  </defs>
  <!-- Ícone Minimalista e Profissional -->
  <g transform="translate(30, 40)">
     <!-- DESENHE AQUI O ÍCONE VETORIAL RICO COM <path>, <circle>, <polygon>, <rect> etc. Cabendo em ~110x110px -->
  </g>
  <!-- Tipografia da Marca -->
  <text x="160" y="${brandYPos}" class="brand-name">${briefing.nome}</text>
  <text x="162" y="135" class="brand-niche">${briefing.nicho}</text>
</svg>

=== REGRAS FUNDAMENTAIS DE DESIGN ===
1. Ícone Vetorial: Desenhe um símbolo abstrato, geométrico ou orgânico com curvas bezier elegantes, alta precisão matemática e relevância com o nicho de ${briefing.nicho}. NUNCA faça ícones simplórios ou clichês banais.
2. Paleta: Utilize ${primaryHex} e ${secondaryHex} (ou o gradiente id="brandGrad_${optionNumber}") nos elementos do ícone.
3. Coerência: O ícone dentro de <g transform="translate(30, 40)"> deve estar perfeitamente centralizado e alinhado verticalmente com os textos <text> à direita.

=== REGRA DE SAÍDA ===
Retorne ESTRITAMENTE o código SVG puro. Inicie com <svg e termine com </svg>. Não inclua explicações, comentários Markdown ou qualquer texto fora do SVG.`;
}

/**
 * Monta o System Prompt para refinamento cirúrgico de uma logo existente.
 */
function buildRefinementPrompt(briefing: BriefingData, existingSvg: string, refinementNotes: string): string {
  const { fontName, fontUrl } = selectGoogleFont(briefing);

  return `Você é um Engenheiro de SVG e Designer de Identidades Visuais Sênior.

Sua tarefa é REFINAR cirurgicamente um logotipo SVG existente conforme as instruções específicas solicitadas pelo cliente, mantendo a estrutura profissional intacta.

=== BRIEFING DA MARCA ===
• Empresa: ${briefing.nome}
• Nicho: ${briefing.nicho}
• Público-alvo: ${briefing.publicoAlvo}

=== LOGO SVG ATUAL (Base para refinar) ===
${existingSvg}

=== SOLICITAÇÃO DE REFINAMENTO DO CLIENTE ===
"${refinementNotes}"

=== REGRAS DE REFINAMENTO ===
1. Mantenha estritamente o esqueleto viewBox="0 0 500 200", com importação de Google Fonts, grupo do ícone <g transform="translate(30, 40)"> e textos <text x="160"...> à direita.
2. Aplique com máxima fidelidade e maestria estética EXATAMENTE as alterações pedidas pelo cliente (ex: simplificar formas, alterar cores de fill/stroke, mudar espessura de traços, deixar mais orgânico ou mais geométrico).
3. Mantenha os nomes e textos corretos: Nome "${briefing.nome}" e Nicho "${briefing.nicho}".
4. Retorne apenas o código SVG completo, válido e limpo.

=== REGRA DE SAÍDA ===
Retorne APENAS o código SVG (<svg ...> ... </svg>). Sem markdown, sem explicações adicionais.`;
}

// ---------------------------------------------------------------------------
// Extrator de SVG Seguro
// ---------------------------------------------------------------------------
function extractSvgFromResponse(rawResponse: string): string {
  let cleaned = rawResponse
    .replace(/```(?:svg|xml|html)?\n?/gi, "")
    .replace(/```\n?/gi, "")
    .trim();

  const svgMatch = cleaned.match(/<svg[\s\S]*<\/svg>/i);
  if (svgMatch) {
    cleaned = svgMatch[0];
  }

  // Sanitização básica contra handlers
  cleaned = cleaned.replace(/on\w+="[^"]*"/gi, "").replace(/javascript:/gi, "");
  return cleaned;
}

// ---------------------------------------------------------------------------
// Fallback SVG Profissional (Garante padrão 500x200 com Ícone + Tipografia)
// ---------------------------------------------------------------------------
function generateFallbackSvg(briefing: BriefingData, optionNumber: 1 | 2, seed?: number): string {
  const { fontName, fontUrl } = selectGoogleFont(briefing);
  const { primaryHex, secondaryHex } = resolvePaletteColors(briefing, optionNumber);
  const hash = seed ?? (briefing.nome.charCodeAt(0) + briefing.nicho.length + optionNumber * 17);
  const gradId = `fallbackGrad_${optionNumber}_${hash % 1000}`;

  const iconOption1 = `
    <rect width="110" height="110" rx="28" fill="url(#${gradId})" opacity="0.12" />
    <path d="M55 18 L92 39 L92 81 L55 102 L18 81 L18 39 Z" stroke="url(#${gradId})" stroke-width="4" fill="none" stroke-linejoin="round"/>
    <path d="M55 18 L55 102 M18 39 L92 81 M18 81 L92 39" stroke="url(#${gradId})" stroke-width="2.5" opacity="0.6"/>
    <circle cx="55" cy="60" r="14" fill="url(#${gradId})" />
    <circle cx="55" cy="60" r="6" fill="#FFFFFF" />
  `;

  const iconOption2 = `
    <rect width="110" height="110" rx="28" fill="url(#${gradId})" opacity="0.12" />
    <circle cx="55" cy="55" r="42" stroke="url(#${gradId})" stroke-width="4.5" stroke-dasharray="135 30" fill="none" stroke-linecap="round" />
    <path d="M36 55 C36 38, 74 38, 74 55 C74 72, 36 72, 36 55" fill="none" stroke="url(#${gradId})" stroke-width="5" stroke-linecap="round" />
    <circle cx="55" cy="55" r="12" fill="url(#${gradId})" />
    <circle cx="74" cy="40" r="6" fill="${secondaryHex}" />
  `;

  const chosenIcon = optionNumber === 1 ? iconOption1 : iconOption2;
  const nameLength = briefing.nome.length;
  const nameFontSize = nameLength > 16 ? "34px" : nameLength > 12 ? "40px" : "48px";
  const nameYPos = nameLength > 16 ? "102" : "105";

  return `<svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('${fontUrl}');
      .brand-name { font-family: '${fontName}', sans-serif; font-size: ${nameFontSize}; font-weight: 700; fill: #1A1A1A; }
      .brand-niche { font-family: '${fontName}', sans-serif; font-size: 16px; font-weight: 400; fill: #666666; letter-spacing: 3px; text-transform: uppercase; }
    </style>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryHex}" />
      <stop offset="100%" stop-color="${secondaryHex}" />
    </linearGradient>
  </defs>
  <!-- Ícone Minimalista e Profissional -->
  <g transform="translate(30, 40)">
    ${chosenIcon}
  </g>
  <!-- Tipografia da Marca -->
  <text x="160" y="${nameYPos}" class="brand-name">${briefing.nome}</text>
  <text x="162" y="135" class="brand-niche">${briefing.nicho}</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Gerador de Variações de SVG (Logo Principal, Logo Reverso, Símbolo Isolado e Símbolo Reverso)
// ---------------------------------------------------------------------------
export interface SvgVariations {
  logoSvg: string;
  logoReverseSvg: string;
  symbolSvg: string;
  symbolReverseSvg: string;
}

/**
 * A partir do SVG mestre gerado pelo Gemini (que possui Ícone + Tipografia),
 * gera automaticamente todas as 4 aplicações oficiais da marca.
 */
export function generateBrandSvgVariations(svgCode: string): SvgVariations {
  const cleanSvg = svgCode.trim();

  // 1. Logo Principal (Original)
  const logoSvg = cleanSvg;

  // 2. Logo Reverso (Tipografia em branco/cinza claro para aplicação sobre fundos escuros)
  let logoReverseSvg = cleanSvg
    .replace(/(fill:\s*#)1A1A1A/gi, "$1FFFFFF")
    .replace(/(fill:\s*#)111827/gi, "$1FFFFFF")
    .replace(/(fill:\s*#)0F172A/gi, "$1FFFFFF")
    .replace(/(fill:\s*#)000000/gi, "$1FFFFFF")
    .replace(/(fill:\s*#)666666/gi, "$194A3B8")
    .replace(/(fill:\s*#)6B7280/gi, "$194A3B8");

  // Garante que o CSS contenha as regras de cor invertida
  if (!logoReverseSvg.includes("#FFFFFF")) {
    logoReverseSvg = logoReverseSvg.replace(
      /<\/style>/i,
      `  .brand-name { fill: #FFFFFF !important; }\n  .brand-niche { fill: #94A3B8 !important; }\n</style>`
    );
  }

  // 3. Símbolo Isolado (Sem os textos de nome e nicho, centralizado em viewBox 0 0 120 120)
  const defsMatch = cleanSvg.match(/<defs[\s\S]*?<\/defs>/i);
  const defsContent = defsMatch ? defsMatch[0] : "";

  // Procura o grupo do ícone <g transform="translate(...)">...</g>
  let iconInner = "";
  const groupMatch = cleanSvg.match(/<g[^>]*transform=["'][^"']*translate\([^)]*\)[^"']*["'][^>]*>([\s\S]*?)<\/g>/i);

  if (groupMatch && groupMatch[1]) {
    iconInner = groupMatch[1].trim();
  } else {
    // Fallback: remove todas as tags <text>...</text>
    iconInner = cleanSvg
      .replace(/<svg[^>]*>/i, "")
      .replace(/<\/svg>/i, "")
      .replace(/<defs[\s\S]*?<\/defs>/i, "")
      .replace(/<text[\s\S]*?<\/text>/gi, "")
      .trim();
  }

  const symbolSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  ${defsContent}
  <g transform="translate(5, 5)">
    ${iconInner}
  </g>
</svg>`;

  // 4. Símbolo Reverso
  const symbolReverseSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  ${defsContent}
  <g transform="translate(5, 5)">
    ${iconInner}
  </g>
</svg>`;

  return {
    logoSvg,
    logoReverseSvg,
    symbolSvg,
    symbolReverseSvg,
  };
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Gera 2 opções completas de logotipo via Gemini AI.
 */
export const generateLogosWithAI = createServerFn({ method: "POST" })
  .inputValidator(BriefingSchema)
  .handler(async ({ data: briefing }): Promise<LogoGenerationResult> => {
    const apiKey = getGeminiApiKey();

    console.log("=== DEBUG GEMINI ===");
    console.log("Chave carregada?", !!process.env.GEMINI_API_KEY);
    console.log("Tamanho da chave:", process.env.GEMINI_API_KEY?.length);

    if (!apiKey) {
      console.warn("[ai-logo] ⚠️ GEMINI_API_KEY não configurada. Usando SVGs profissionais de fallback.");
      return {
        logos: [
          {
            id: `logo-${Date.now()}-1`,
            svgCode: generateFallbackSvg(briefing as BriefingData, 1),
            concept: "Opção 1 — Identidade Sólida & Estruturada com Ícone e Tipografia (Modo Offline)",
          },
          {
            id: `logo-${Date.now()}-2`,
            svgCode: generateFallbackSvg(briefing as BriefingData, 2),
            concept: "Opção 2 — Identidade Dinâmica & Contemporânea com Ícone e Tipografia (Modo Offline)",
          },
        ],
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const callGeminiWithRetry = async (prompt: string, temperature = 0.7): Promise<string> => {
      const candidateModels = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];
      
      for (let attempt = 0; attempt < 3; attempt++) {
        for (const modelName of candidateModels) {
          try {
            console.log(`[ai-logo] ⏳ Chamando Gemini (${modelName})...`);
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: { temperature },
            });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text && text.trim().length > 0) return text;
          } catch (err: any) {
            const isRetryable = err?.status === 503 || err?.status === 429 || String(err?.message).includes("503") || String(err?.message).includes("high demand");
            console.warn(`[ai-logo] ⚠️ Modelo ${modelName} falhou (${err?.message?.substring(0, 100)}).`);
            if (!isRetryable && !String(err?.message).includes("not found")) {
              // Se não for temporário ou 404, continua para próximo modelo
            }
          }
        }
        // Pequena pausa antes da próxima rodada de tentativa
        if (attempt < 2) {
          console.log(`[ai-logo] 🔄 Aguardando ${(attempt + 1) * 800}ms para tentar novamente...`);
          await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 800));
        }
      }
      throw new Error("Todos os modelos retornaram instabilidade temporária.");
    };

    const generateSingleLogo = async (optionNumber: 1 | 2): Promise<GeneratedLogo> => {
      const prompt = buildLogoPrompt(briefing as BriefingData, optionNumber);

      try {
        // Pequeno escalonamento entre as chamadas para não sobrecarregar a quota instantânea
        if (optionNumber === 2) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        const rawText = await callGeminiWithRetry(prompt, 0.7);
        const svgCode = extractSvgFromResponse(rawText);

        if (!svgCode.includes("<svg")) {
          console.error(`[ai-logo] ❌ Resposta da Opção ${optionNumber} não continha tag <svg>. Texto bruto:`, rawText.substring(0, 300));
          throw new Error("Resposta da IA não contém SVG válido");
        }

        console.log(`[ai-logo] ✅ Opção ${optionNumber} gerada com sucesso! (${svgCode.length} bytes)`);

        const concepts: Record<1 | 2, string> = {
          1: "Opção 1 — Identidade Sólida & Estruturada com Símbolo e Tipografia",
          2: "Opção 2 — Identidade Dinâmica & Contemporânea com Símbolo e Tipografia",
        };

        return {
          id: `logo-${Date.now()}-${optionNumber}`,
          svgCode,
          concept: concepts[optionNumber],
        };
      } catch (err: any) {
        console.error(`[ai-logo] ❌ Erro ao gerar Opção ${optionNumber}:`, {
          message: err?.message,
          stack: err?.stack,
        });

        return {
          id: `logo-${Date.now()}-${optionNumber}-fallback`,
          svgCode: generateFallbackSvg(briefing as BriefingData, optionNumber),
          concept: `Opção ${optionNumber} — gerada localmente (${err?.message || "falha na API"})`,
        };
      }
    };

    const [logo1, logo2] = await Promise.all([generateSingleLogo(1), generateSingleLogo(2)]);
    return { logos: [logo1, logo2] };
  });

/**
 * Refina cirurgicamente a logo escolhida via Gemini AI.
 */
export const refineLogoWithAI = createServerFn({ method: "POST" })
  .inputValidator(RefineLogoSchema)
  .handler(async ({ data }): Promise<GeneratedLogo> => {
    const { briefing, existingSvg, refinementNotes } = data;
    const apiKey = getGeminiApiKey();

    console.log("=== DEBUG GEMINI ===");
    console.log("Chave carregada?", !!process.env.GEMINI_API_KEY);
    console.log("Tamanho da chave:", process.env.GEMINI_API_KEY?.length);

    if (!apiKey) {
      console.warn("[ai-logo] ⚠️ GEMINI_API_KEY não configurada. Retornando SVG atual.");
      return {
        id: `logo-refined-${Date.now()}`,
        svgCode: existingSvg,
        concept: "Logo mantida (configure GEMINI_API_KEY para refinamento por IA)",
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildRefinementPrompt(briefing as BriefingData, existingSvg, refinementNotes);

    try {
      let rawText = "";
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.6-flash",
          generationConfig: { temperature: 0.5 },
        });
        const result = await model.generateContent(prompt);
        rawText = result.response.text();
      } catch {
        const modelFallback = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
          generationConfig: { temperature: 0.5 },
        });
        const resultFallback = await modelFallback.generateContent(prompt);
        rawText = resultFallback.response.text();
      }

      const svgCode = extractSvgFromResponse(rawText);

      if (!svgCode.includes("<svg")) {
        throw new Error("Resposta do refinamento não contém SVG válido");
      }

      console.log(`[ai-logo] ✅ Refinamento aplicado com sucesso!`);
      return {
        id: `logo-refined-${Date.now()}`,
        svgCode,
        concept: `Refinada: "${refinementNotes.substring(0, 60)}${refinementNotes.length > 60 ? "..." : ""}"`,
      };
    } catch (err: any) {
      console.error("[ai-logo] ❌ Erro no refinamento:", err?.message);
      return {
        id: `logo-refined-${Date.now()}-fallback`,
        svgCode: existingSvg,
        concept: `Refinamento não concluído (${err?.message || "erro"}). SVG original mantido.`,
      };
    }
  });

/**
 * Regenera ambas as logos do zero via Gemini AI.
 */
export const regenerateAllLogosWithAI = createServerFn({ method: "POST" })
  .inputValidator(BriefingSchema)
  .handler(async ({ data: briefing }): Promise<LogoGenerationResult> => {
    const apiKey = getGeminiApiKey();
    const timestamp = Date.now();

    console.log("=== DEBUG GEMINI ===");
    console.log("Chave carregada?", !!process.env.GEMINI_API_KEY);
    console.log("Tamanho da chave:", process.env.GEMINI_API_KEY?.length);

    if (!apiKey) {
      return {
        logos: [
          {
            id: `logo-regen-${timestamp}-1`,
            svgCode: generateFallbackSvg(briefing as BriefingData, 1, timestamp % 100),
            concept: "Nova opção 1 — gerada localmente",
          },
          {
            id: `logo-regen-${timestamp}-2`,
            svgCode: generateFallbackSvg(briefing as BriefingData, 2, (timestamp + 50) % 100),
            concept: "Nova opção 2 — gerada localmente",
          },
        ],
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const buildRegenPrompt = (optionNumber: 1 | 2): string => {
      const base = buildLogoPrompt(briefing as BriefingData, optionNumber);
      return (
        base +
        `\n\nATENÇÃO ADICIONAL: O cliente descartou opções anteriores. Crie um conceito de ícone radicalmente NOVO e DISTINTO!`
      );
    };

    const generateSingleLogo = async (optionNumber: 1 | 2): Promise<GeneratedLogo> => {
      const prompt = buildRegenPrompt(optionNumber);
      try {
        let rawText = "";
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-3.6-flash",
            generationConfig: { temperature: 0.8 },
          });
          const result = await model.generateContent(prompt);
          rawText = result.response.text();
        } catch {
          const modelFallback = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { temperature: 0.8 },
          });
          const resultFallback = await modelFallback.generateContent(prompt);
          rawText = resultFallback.response.text();
        }

        const svgCode = extractSvgFromResponse(rawText);

        if (!svgCode.includes("<svg")) throw new Error("SVG inválido");

        return {
          id: `logo-regen-${timestamp}-${optionNumber}`,
          svgCode,
          concept: `Nova opção ${optionNumber} — regenerada`,
        };
      } catch (err: any) {
        console.error(`[ai-logo] ❌ Erro ao regenerar opção ${optionNumber}:`, err?.message);
        return {
          id: `logo-regen-${timestamp}-${optionNumber}-fallback`,
          svgCode: generateFallbackSvg(briefing as BriefingData, optionNumber, timestamp % 100 + optionNumber * 20),
          concept: `Nova opção ${optionNumber} — gerada localmente`,
        };
      }
    };

    const [logo1, logo2] = await Promise.all([generateSingleLogo(1), generateSingleLogo(2)]);
    return { logos: [logo1, logo2] };
  });
