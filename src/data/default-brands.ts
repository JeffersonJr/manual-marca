import { Brand } from "@/lib/types";

export const defaultMicrosistec: Brand = {
  id: "microsistec",
  name: "Microsistec",
  description: "Sistema de identidade visual robusto e minimalista construído para a Microsistec.",
  mission: "Tornar a tecnologia previsível para empresas que dependem dela todos os dias.",
  vision: "Ser o sistema invisível por trás das operações digitais mais confiáveis do país.",
  promise: "Precisão de engenheiro, clareza de designer, ritmo de operador.",
  values: [
    {
      name: "Precisão",
      description: "Grid rígido, alinhamentos exatos, números monoespaçados."
    },
    {
      name: "Confiança",
      description: "Verde profundo, contraste alto, tipografia sem ornamentos."
    },
    {
      name: "Inovação",
      description: "Espaço negativo generoso, transições sutis, geometria limpa."
    },
    {
      name: "Simplicidade",
      description: "Direto ao ponto, sem adereços desnecessários."
    }
  ],
  palette: {
    primary: [
      {
        name: "Deep Teal",
        hex: "#2B5250",
        role: "Cor principal da marca. Usada em fundos nobres, botões primários e cabeçalhos.",
        token: "--teal-deep"
      },
      {
        name: "Dark Charcoal",
        hex: "#1A1A1A",
        role: "Wordmark e texto principal.",
        token: "--ink"
      }
    ],
    secondary: [
      {
        name: "Mid Teal",
        hex: "#5AA6A6",
        role: "Elementos de suporte, ícones e linhas de grid.",
        token: "--teal-mid"
      },
      {
        name: "Light Teal",
        hex: "#7CC1C1",
        role: "Hover states e badges informativos.",
        token: "--teal-light"
      },
      {
        name: "Shadow Teal",
        hex: "#1B2A2A",
        role: "Sombras coloridas e elementos de profundidade.",
        token: "--teal-shadow"
      }
    ],
    accent: [
      {
        name: "Warm Amber",
        hex: "#E8A14B",
        role: "Acentos dinâmicos, alertas e pontos de foco.",
        token: "--amber"
      },
      {
        name: "Canvas Cream",
        hex: "#F7F3EA",
        role: "Fundo principal da aplicação e cartões claros.",
        token: "--cream"
      }
    ],
    neutrals: [
      {
        name: "White",
        hex: "#FFFFFF"
      },
      {
        name: "Light Gray",
        hex: "#E8EDED"
      },
      {
        name: "Slate",
        hex: "#6B7878"
      },
      {
        name: "Ink",
        hex: "#1A1A1A"
      }
    ]
  }
};

export const DEFAULT_BRANDS: Brand[] = [defaultMicrosistec];
