/**
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 * Server function para geração de conteúdo do manual de marca via Google Gemini AI
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "./ai-logo.functions";
import type { BriefingData, BrandPalette } from "../types";
import { getCleanHeroTitle, getCleanHeroDescription } from "../brand-utils";

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

const InputSchema = z.object({
  briefing: BriefingSchema,
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
});

// ---------------------------------------------------------------------------
// Tipo de retorno do manual gerado
// ---------------------------------------------------------------------------
export interface ManualContent {
  description: string;
  mission: string;
  vision: string;
  promise: string;
  heroTitle: string;
  values: { name: string; description: string }[];
  voiceExamples: { ok: string[]; no: string[] };
  palette: BrandPalette;
}

// ---------------------------------------------------------------------------
// Helpers: Construção do prompt anti-clichê
// ---------------------------------------------------------------------------

/**
 * Regras de anti-clichê baseadas no nicho e tom.
 * O objetivo é proibir explicitamente os textos genéricos de cada categoria.
 */
function buildAntiClicheRules(briefing: BriefingData): string {
  const nicho = briefing.nicho?.toLowerCase() ?? "";
  const tom = briefing.tomDeVoz?.toLowerCase() ?? "";

  const rules: string[] = [
    "REGRAS CRÍTICAS - VIOLAÇÃO RESULTA EM RESPOSTA INVÁLIDA:",
    `1. Missão, Visão e Promessa devem ser 100% únicas para ${briefing.nome}. Derivadas do cruzamento: Nicho="${briefing.nicho}" + Tom="${briefing.tomDeVoz || "neutro"}" + Público="${briefing.publicoAlvo}".`,
    `2. PROIBIDO usar estas palavras soltas como ideia central: "transformar", "inovar", "excelência", "qualidade", "soluções", "resultados", "impacto".`,
    `3. Os 4 Valores devem ser específicos do contexto "${briefing.nicho}". PROIBIDO: apenas "Inovação", "Qualidade", "Transparência", "Compromisso" sem adjetivo diferenciador.`,
    `4. Cada Valor deve ter descrição visual/comportamental, não apenas conceitual.`,
  ];

  // Regras por nicho
  if (nicho.includes("tech") || nicho.includes("software") || nicho.includes("saas") || nicho.includes("tecnologia") || nicho.includes("ti ") || nicho.includes("digital")) {
    rules.push(
      `5. [NICHO TECH] PROIBIDO como heroTitle: "Tecnologia que transforma", "Inovação digital", "Precisão visual". Use metáforas do cotidiano operacional real do cliente.`,
      `6. [NICHO TECH] A missão NÃO pode começar com "Ser a empresa de tecnologia que..." - seja mais específico ao sub-nicho (${briefing.nicho}).`,
    );
  } else if (nicho.includes("saúde") || nicho.includes("saude") || nicho.includes("clínica") || nicho.includes("clinica") || nicho.includes("médico") || nicho.includes("medico") || nicho.includes("hospital") || nicho.includes("estética")) {
    rules.push(
      `5. [NICHO SAÚDE] PROIBIDO como missão: "Cuidar de pessoas", "Transformar vidas", "Saúde com carinho". Aprofunde no mecanismo real de cuidado do contexto "${briefing.nicho}".`,
      `6. [NICHO SAÚDE] Transmita confiança e competência técnica, não apenas emoção genérica.`,
    );
  } else if (nicho.includes("imóvel") || nicho.includes("imobiliária") || nicho.includes("construção") || nicho.includes("arquitetura") || nicho.includes("construtora")) {
    rules.push(
      `5. [NICHO IMOBILIÁRIO] PROIBIDO: "Construindo sonhos", "O lar que você merece", "Seu próximo passo". Seja concreto sobre o tipo de imóvel e o cliente específico.`,
    );
  } else if (nicho.includes("moda") || nicho.includes("fashion") || nicho.includes("vestuário") || nicho.includes("luxury") || nicho.includes("luxo") || nicho.includes("joalheria") || nicho.includes("acessórios")) {
    rules.push(
      `5. [NICHO MODA/LUXO] PROIBIDO: "Estilo que fala por você", "Vista-se com atitude". A linguagem de luxo é discreta, não exclamativa.`,
      `6. [NICHO MODA/LUXO] Os valores devem ter nomes de conceitos de design ou filosofia estética, não de adjetivos genéricos.`,
    );
  } else if (nicho.includes("aliment") || nicho.includes("restaurante") || nicho.includes("food") || nicho.includes("gastronomia") || nicho.includes("café") || nicho.includes("padaria")) {
    rules.push(
      `5. [NICHO FOOD] PROIBIDO: "Sabor que conecta", "Comida com amor", "Mais que um prato". Foque na experiência sensorial específica do ${briefing.nicho}.`,
    );
  } else if (nicho.includes("educação") || nicho.includes("educacao") || nicho.includes("ensino") || nicho.includes("escola") || nicho.includes("curso") || nicho.includes("treinamento")) {
    rules.push(
      `5. [NICHO EDUCAÇÃO] PROIBIDO: "Transformando o futuro", "Aprendizado que muda vidas". Foque no método e resultado mensurável específico.`,
    );
  } else if (nicho.includes("finanças") || nicho.includes("financas") || nicho.includes("investimento") || nicho.includes("contabilidade") || nicho.includes("crédito") || nicho.includes("credito")) {
    rules.push(
      `5. [NICHO FINANCEIRO] PROIBIDO: "Realizando sonhos financeiros", "Seu dinheiro trabalhando por você". Seja técnico e específico sobre o mecanismo de valor entregue.`,
    );
  }

  // Regras por tom de voz
  if (tom.includes("formal") || tom.includes("corporativo") || tom.includes("técnico") || tom.includes("tecnico")) {
    rules.push(
      `${rules.length + 1}. [TOM FORMAL/TÉCNICO] Use linguagem precisa e objetiva. Sem metáforas poéticas. Verbos no infinitivo ou indicativo. Frase curta e direta.`,
    );
  } else if (tom.includes("descontraído") || tom.includes("descontraido") || tom.includes("humano") || tom.includes("casual") || tom.includes("próximo") || tom.includes("proximo")) {
    rules.push(
      `${rules.length + 1}. [TOM DESCONTRAÍDO] Use verbos de ação na primeira pessoa do plural. Contrações válidas. Humor sutil permitido. Evite jargão corporativo.`,
    );
  } else if (tom.includes("inspiracional") || tom.includes("motivacional") || tom.includes("ousado") || tom.includes("criativo")) {
    rules.push(
      `${rules.length + 1}. [TOM INSPIRACIONAL] Use metáforas poderosas e concretas (não clichês). Frases curtas de alto impacto. Ritmo e cadência na promessa.`,
    );
  } else if (tom.includes("direto") || tom.includes("objetivo") || tom.includes("pragmático") || tom.includes("pragmatico")) {
    rules.push(
      `${rules.length + 1}. [TOM DIRETO] Sem rodeios. Cada frase tem exatamente um ponto. Sem adjetivos desnecessários. Números e fatos quando possível.`,
    );
  }

  return rules.join("\n");
}

/**
 * Monta o prompt completo para geração do conteúdo textual do manual.
 */
function buildManualPrompt(briefing: BriefingData): string {
  const antiCliche = buildAntiClicheRules(briefing);

  const briefingLines: string[] = [
    `EMPRESA: ${briefing.nome}`,
    `NICHO/SEGMENTO: ${briefing.nicho}`,
    `PÚBLICO-ALVO: ${briefing.publicoAlvo}`,
  ];
  if (briefing.proposito) briefingLines.push(`PROPÓSITO DECLARADO: ${briefing.proposito}`);
  if (briefing.valores) briefingLines.push(`VALORES DECLARADOS: ${briefing.valores}`);
  if (briefing.personalidade) briefingLines.push(`PERSONALIDADE DA MARCA: ${briefing.personalidade}`);
  if (briefing.diferenciais) briefingLines.push(`DIFERENCIAIS: ${briefing.diferenciais}`);
  if (briefing.referencias) briefingLines.push(`REFERÊNCIAS/CONCORRENTES: ${briefing.referencias}`);
  if (briefing.observacoes) briefingLines.push(`OBSERVAÇÕES ADICIONAIS: ${briefing.observacoes}`);
  if (briefing.estiloVisual) briefingLines.push(`ESTILO VISUAL: ${briefing.estiloVisual}`);
  if (briefing.tomDeVoz) briefingLines.push(`TOM DE VOZ: ${briefing.tomDeVoz}`);
  if (briefing.prefCores) briefingLines.push(`PREFERÊNCIA DE CORES: ${briefing.prefCores}`);

  return `Você é um estrategista de marca sênior especializado em identidade visual e copywriting de marca. Sua tarefa é criar o conteúdo textual completo de um Manual de Identidade Visual.

=== BRIEFING COMPLETO ===
${briefingLines.join("\n")}

=== ${antiCliche} ===

=== INSTRUÇÕES DE OUTPUT ===
Gere um objeto JSON com EXATAMENTE este schema. Não adicione campos extras. Não use markdown.

{
  "description": "string - 2 frases curtas e elegantes (máximo de 160 caracteres) apresentando o sistema de identidade visual da marca para o nicho ${briefing.nicho}. NÃO liste valores aqui.",
  "mission": "string - 1-2 frases. A razão de existir da marca no dia a dia. Verbo ativo. Específico ao nicho.",
  "vision": "string - 1-2 frases. Onde a marca quer chegar. Tangível e ousado, não vago.",
  "promise": "string - 1 frase curta e direta (máximo de 10 palavras ou 70 caracteres). O compromisso inegociável com o cliente.",
  "heroTitle": "string - OBRIGATÓRIO: Um título H1 de site de alto impacto, extremamente conciso (máximo de 4 a 8 palavras, limite estrito de 60 caracteres). Exemplo: 'Imóveis exclusivos com transparência total.' ou 'Tecnologia que impulsiona operações reais.' NUNCA inclua listas, múltiplos tópicos, dois pontos (:) ou explicações longas.",
  "values": [
    { "name": "string - 1-2 palavras. Nome do valor.", "description": "string - 1 frase curta descrevendo o valor em termos visuais ou comportamentais concretos." },
    { "name": "...", "description": "..." },
    { "name": "...", "description": "..." },
    { "name": "...", "description": "..." }
  ],
  "voiceExamples": {
    "ok": [
      "string - exemplo de comunicação CORRETA da marca (1 frase)",
      "string - exemplo de comunicação CORRETA da marca (1 frase)",
      "string - exemplo de comunicação CORRETA da marca (1 frase)"
    ],
    "no": [
      "string - exemplo de comunicação INCORRETA (fuja deste tom) (1 frase)",
      "string - exemplo de comunicação INCORRETA (fuja deste tom) (1 frase)",
      "string - exemplo de comunicação INCORRETA (fuja deste tom) (1 frase)"
    ]
  },
  "paletteNames": {
    "primary": "string - nome criativo para a cor primária (2-3 palavras, ligado ao universo da marca)",
    "secondary": "string - nome criativo para a cor secundária",
    "accent": "string - nome criativo para a cor de acento"
  }
}

IMPORTANTE: Retorne APENAS o JSON. Sem texto antes, sem texto depois, sem blocos de código.`;
}

// ---------------------------------------------------------------------------
// Helpers: Construção da paleta e fallback
// ---------------------------------------------------------------------------

function buildPalette(
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  paletteNames: { primary: string; secondary: string; accent: string },
): BrandPalette {
  // Calcular um tint 15% opaco da cor secundária
  const secondaryTint = secondaryColor.length === 7 ? `${secondaryColor}26` : secondaryColor;

  return {
    primary: [
      { name: paletteNames.primary, hex: primaryColor, role: "Cor principal da identidade - logotipo, CTAs e elementos de destaque.", token: "--color-brand-primary" },
      { name: "Graphite Ink", hex: "#1A1A1A", role: "Wordmark e texto principal em fundos claros.", token: "--ink" },
    ],
    secondary: [
      { name: paletteNames.secondary, hex: secondaryColor, role: "Cor de suporte para ícones, destaques e elementos secundários.", token: "--color-brand-secondary" },
      { name: `${paletteNames.secondary} Tint`, hex: secondaryTint, role: "Backgrounds suaves, hover states e realces.", token: "--color-brand-secondary-tint" },
      { name: "Deep Shadow", hex: "#111827", role: "Fundos escuros e dark UI.", token: "--color-brand-dark" },
    ],
    accent: [
      { name: paletteNames.accent, hex: accentColor, role: "Acento dinâmico - alertas, badges e elementos interativos.", token: "--color-brand-accent" },
      { name: "Off-White Canvas", hex: "#FDFBF7", role: "Fundo alternativo para materiais impressos e áreas de respiro.", token: "--color-brand-cream" },
    ],
    neutrals: [
      { name: "Snow", hex: "#FAFAFA" },
      { name: "Mist", hex: "#E5E7EB" },
      { name: "Slate", hex: "#6B7280" },
      { name: "Charcoal", hex: "#171717" },
    ],
  };
}

/**
 * Conteúdo de fallback caso a API não esteja disponível ou falhe.
 * Usa os dados do briefing para gerar textos mais personalizados que os templates antigos.
 */
function generateFallbackManual(
  briefing: BriefingData,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
): ManualContent {
  const nicho = briefing.nicho;
  const nome = briefing.nome;
  const tom = briefing.tomDeVoz || "profissional";
  const publico = briefing.publicoAlvo;

  const palette = buildPalette(primaryColor, secondaryColor, accentColor, {
    primary: `${nome} Primary`,
    secondary: `${nome} Secondary`,
    accent: `${nome} Accent`,
  });

  const rawDescription = `Sistema de identidade visual de ${nome}, desenvolvido para o segmento de ${nicho}.`;
  const cleanDesc = getCleanHeroDescription({ name: nome, description: rawDescription, briefing });
  const cleanHero = getCleanHeroTitle({ name: nome, briefing, promise: briefing.diferenciais });

  return {
    description: cleanDesc,
    mission: briefing.proposito || `Entregar soluções de ${nicho.toLowerCase()} de alto valor para ${publico}, com comprometimento e consistência.`,
    vision: `Ser referência de confiança e excelência no segmento de ${nicho} para ${publico}.`,
    promise: briefing.diferenciais
      ? `${briefing.diferenciais.split(",")[0].trim()} com consistência e confiança.`
      : `${nome}: excelência e compromisso no segmento de ${nicho.toLowerCase()}.`,
    heroTitle: cleanHero,
    values: [
      { name: "Autenticidade", description: `Comunicar o que ${nome} realmente entrega, com clareza para ${publico}.` },
      { name: "Consistência", description: `Cada aplicação da marca reforça a mesma mensagem em todos os pontos de contato.` },
      { name: "Relevância", description: `Diretrizes orientadas para o contexto real de ${nicho} e o dia a dia de ${publico}.` },
      { name: "Clareza", description: `Hierarquia visual nítida, linguagem ${tom} e sem ruído entre a marca e o cliente.` },
    ],
    voiceExamples: {
      ok: [
        `"${nome} resolve [problema específico] de ${publico} com excelência."`,
        `"Confira como ${nome} apoia [tipo de cliente] com [resultado concreto]."`,
        `"[Frase direta e clara sobre o serviço de ${nicho}]."`,
      ],
      no: [
        `"Somos a empresa que transforma seu negócio." (genérico demais)`,
        `"Qualidade e inovação em tudo que fazemos." (vago e sem contexto)`,
        `"Sua satisfação é nossa prioridade." (clichê sem diferencial)`,
      ],
    },
    palette,
  };
}

// ---------------------------------------------------------------------------
// Server Function Principal
// ---------------------------------------------------------------------------

/**
 * Gera o conteúdo completo do manual de identidade via Gemini AI.
 * Recebe briefing + cores selecionadas; retorna todos os textos e a paleta nomeada.
 */
export const generateManualWithAI = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }): Promise<ManualContent> => {
    const { briefing, primaryColor, secondaryColor, accentColor } = data;
    const apiKey = getGeminiApiKey();

    console.log("=== DEBUG GEMINI ===");
    console.log("Chave carregada?", !!process.env.GEMINI_API_KEY);
    console.log("Tamanho da chave:", process.env.GEMINI_API_KEY?.length);

    if (!apiKey) {
      console.warn("[ai-manual] ⚠️ GEMINI_API_KEY não configurada. Usando conteúdo de fallback.");
      return generateFallbackManual(briefing as BriefingData, primaryColor, secondaryColor, accentColor);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildManualPrompt(briefing as BriefingData);

    try {
      console.log(`[ai-manual] ⏳ Enviando prompt do manual ao Gemini 3.6 Flash...`);
      let rawText = "";
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.6-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8,
          },
        });
        const result = await model.generateContent(prompt);
        rawText = result.response.text().trim();
      } catch (err36: any) {
        console.warn(`[ai-manual] ⚠️ gemini-3.6-flash falhou (${err36?.message}). Tentando gemini-flash-latest...`);
        const modelFallback = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8,
          },
        });
        const resultFallback = await modelFallback.generateContent(prompt);
        rawText = resultFallback.response.text().trim();
      }

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Tenta extrair JSON se houver texto em volta
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Resposta da IA não contém JSON válido");
        parsed = JSON.parse(jsonMatch[0]);
      }

      // Validação básica dos campos obrigatórios
      if (!parsed.mission || !parsed.vision || !parsed.promise || !parsed.values || !Array.isArray(parsed.values)) {
        throw new Error("JSON retornado não contém os campos obrigatórios");
      }

      const paletteNames = parsed.paletteNames ?? {
        primary: `${briefing.nome} Principal`,
        secondary: `${briefing.nome} Secundária`,
        accent: `${briefing.nome} Acento`,
      };

      const palette = buildPalette(primaryColor, secondaryColor, accentColor, paletteNames);

      // Sanitiza estritamente heroTitle e description
      const cleanHero = getCleanHeroTitle({
        name: briefing.nome,
        heroTitle: parsed.heroTitle,
        promise: parsed.promise,
        mission: parsed.mission,
        briefing: briefing as BriefingData,
        values: parsed.values,
      });

      const cleanDesc = getCleanHeroDescription({
        name: briefing.nome,
        description: parsed.description,
        briefing: briefing as BriefingData,
        mission: parsed.mission,
      });

      return {
        description: cleanDesc,
        mission: parsed.mission,
        vision: parsed.vision,
        promise: parsed.promise,
        heroTitle: cleanHero,
        values: (parsed.values as any[]).slice(0, 4).map((v: any) => ({
          name: String(v.name ?? "Valor"),
          description: String(v.description ?? ""),
        })),
        voiceExamples: {
          ok: Array.isArray(parsed.voiceExamples?.ok) ? parsed.voiceExamples.ok.slice(0, 3) : [],
          no: Array.isArray(parsed.voiceExamples?.no) ? parsed.voiceExamples.no.slice(0, 3) : [],
        },
        palette,
      };
    } catch (err: any) {
      console.error("[ai-manual] ❌ Falha detalhada na geração via Gemini:", {
        message: err?.message,
        status: err?.status,
        stack: err?.stack,
        raw: err,
      });
      return generateFallbackManual(briefing as BriefingData, primaryColor, secondaryColor, accentColor);
    }
  });
