/**
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 * Tipos compartilhados para o sistema de Identidade Visual
 */

// ---------------------------------------------------------------------------
// Briefing — dados coletados nos formulários de criação (Fluxo A e B)
// ---------------------------------------------------------------------------
export interface BriefingData {
  // === Obrigatório ===
  nome: string;
  nicho: string; // Ex: "SaaS B2B", "Clínica de Estética", "E-commerce Fashion"
  publicoAlvo: string; // Ex: "Empreendedores 25-40 anos, tomadores de decisão"

  // === Posicionamento ===
  proposito?: string; // Missão/Propósito da marca
  valores?: string; // Ex: "Inovação, Transparência, Foco no cliente"
  personalidade?: string; // Ex: "Ousada", "Clássica", "Moderna", "Amigável", "Técnica"
  diferenciais?: string; // O que diferencia da concorrência
  referencias?: string; // Concorrentes ou marcas de referência
  observacoes?: string; // Campo livre para observações adicionais

  // === Direção Visual ===
  estiloVisual?: string; // Ex: "Minimalista", "Bold", "Orgânico", "Corporativo", "Luxo"
  tomDeVoz?: string; // Ex: "Formal", "Descontraído", "Técnico", "Inspiracional", "Direto"
  prefCores?: string; // Ex: "Quentes", "Frias", "Neutras", "Terrosas", "Vibrantes"
  corFavorita?: string; // Cor favorita em HEX (opcional)
}

// ---------------------------------------------------------------------------
// Paleta de cores da marca
// ---------------------------------------------------------------------------
export interface ColorSwatch {
  name: string;
  hex: string;
  role: string;
  token: string;
}

export interface BrandPalette {
  primary: ColorSwatch[];
  secondary: ColorSwatch[];
  accent: ColorSwatch[];
  neutrals: { name: string; hex: string }[];
}

// ---------------------------------------------------------------------------
// Brand — entidade principal armazenada no KV e localStorage
// ---------------------------------------------------------------------------
export interface Brand {
  id: string;
  name: string;
  description: string;

  // Assets visuais (base64 ou SVG inline)
  logoUrl?: string;
  symbolUrl?: string;
  logoReverseUrl?: string;
  symbolReverseUrl?: string;

  // Essência da marca
  mission: string;
  vision: string;
  promise: string;
  heroTitle?: string;
  voiceExamples?: { ok: string[]; no: string[] };

  // Valores estratégicos
  values: { name: string; description: string }[];

  // Paleta cromática
  palette: BrandPalette;

  // Configurações opcionais
  customDomain?: string;

  // === Novos campos de persistência e fluxo ===
  /** Origem do projeto: "A" = logo própria | "B" = criado do zero pela IA */
  flow?: "A" | "B";

  /** Dados do briefing que originaram este manual */
  briefing?: BriefingData;

  /** Timestamp ISO 8601 de criação */
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Resultado da geração de logo pela IA
// ---------------------------------------------------------------------------
export interface GeneratedLogo {
  /** ID único para identificar qual das opções geradas é esta */
  id: string;
  /** Código SVG limpo e válido */
  svgCode: string;
  /** Conceito descritivo do design */
  concept: string;
}

export interface LogoGenerationResult {
  logos: [GeneratedLogo, GeneratedLogo];
}
