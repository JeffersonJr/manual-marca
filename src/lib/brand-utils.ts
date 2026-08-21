/**
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 * Utilitários de sanitização, síntese e formatação de textos de marca
 */
import type { Brand, BriefingData } from "./types";

/**
 * Remove quebras de linha desnecessárias, espaços duplicados e pontuação estranha
 */
function cleanString(str?: string): string {
  if (!str) return "";
  return str
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Detecta se uma string se parece com uma lista de valores ou bloco cru de texto
 * (ex: "Transparência e Ética: Conduta clara... Atendimento: Foco...")
 */
function isDumpedOrListText(text: string): boolean {
  if (!text) return false;
  // Múltiplos dois-pontos indicam lista de chave-valor
  const colonCount = (text.match(/:/g) || []).length;
  if (colonCount >= 2) return true;
  // Mais de 110 caracteres com marcadores ou frases desconexas
  if (text.length > 110 && (text.includes(":") || text.includes(";") || text.includes("•") || text.includes("- "))) {
    return true;
  }
  return false;
}

/**
 * Extrai o nicho e termos-chave a partir dos dados da marca
 */
function extractContextKeywords(brand: Partial<Brand> & { briefing?: BriefingData }): {
  nicho: string;
  location?: string;
  coreValues: string[];
} {
  const nicho = (brand.briefing?.nicho || "").toLowerCase();
  const allText = [
    brand.name,
    brand.description,
    brand.mission,
    brand.vision,
    brand.promise,
    brand.briefing?.nicho,
    brand.briefing?.valores,
    brand.briefing?.proposito,
    brand.briefing?.diferenciais,
    ...(brand.values?.map((v) => `${v.name} ${v.description}`) || []),
  ]
    .filter(Boolean)
    .join(" ");

  // Detecção de localização comum (ex: Atibaia, São Paulo, etc.)
  let location: string | undefined;
  const locationMatch = allText.match(/\b(Atibaia|São Paulo|Campinas|Rio de Janeiro|Belo Horizonte|Curitiba|Florianópolis|Salvador|Brasília|Santos|Jundiaí|Sorocaba|Bragança)\b/i);
  if (locationMatch) {
    location = locationMatch[1];
  }

  // Extrai valores principais se disponíveis
  const coreValues: string[] = [];
  if (brand.values && brand.values.length > 0) {
    for (const v of brand.values) {
      if (v.name && v.name.length < 30) coreValues.push(v.name.trim());
    }
  }

  return { nicho, location, coreValues };
}

/**
 * Sintetiza um título H1 elegante, curto e com alto impacto de site (máx ~65 caracteres)
 * baseado na marca, nicho, missão, visão e valores.
 */
function synthesizeHeroHeadline(brand: Partial<Brand> & { briefing?: BriefingData }): string {
  const name = (brand.name || "Marca").trim();
  const { nicho, location, coreValues } = extractContextKeywords(brand);
  const tom = (brand.briefing?.tomDeVoz || "").toLowerCase();

  // Se houver uma missão ou visão curta e poderosa (<= 55 caracteres sem dois pontos)
  if (brand.mission && brand.mission.length <= 55 && !isDumpedOrListText(brand.mission) && !brand.mission.toLowerCase().startsWith("ser a")) {
    return brand.mission.endsWith(".") ? brand.mission : `${brand.mission}.`;
  }

  // Se houver valores marcantes
  const hasTransparencia = coreValues.some((v) => /transpar[êe]ncia|confian[çc]a|seguran[çc]a|ética/i.test(v)) || /transpar[êe]ncia|confian[çc]a/i.test(brand.description || "");
  const hasInovacao = coreValues.some((v) => /inova[çc][ãa]o|tecnologia|agilidade|precis[ãa]o/i.test(v));

  // 1. Nicho Imobiliário / Arquitetura / Construção
  if (nicho.includes("imóv") || nicho.includes("imobil") || nicho.includes("constru") || nicho.includes("arquit") || /imobili[áa]r|im[óo]veis/i.test(brand.description || "")) {
    if (location) {
      return `${name} — Imóveis e consultoria de confiança em ${location}.`;
    }
    if (hasTransparencia) {
      return `${name} — Negociações imobiliárias com transparência total.`;
    }
    return `${name} — Encontre o imóvel ideal com segurança e agilidade.`;
  }

  // 2. Nicho Tech / Software / SaaS / Digital
  if (nicho.includes("tech") || nicho.includes("software") || nicho.includes("saas") || nicho.includes("tecnolog") || nicho.includes("digital")) {
    if (tom.includes("direto") || tom.includes("formal")) {
      return `${name} — Tecnologia inteligente para operações críticas.`;
    }
    return `${name} — Soluções digitais que simplificam o seu negócio.`;
  }

  // 3. Nicho Saúde / Clínica / Estética
  if (nicho.includes("saúd") || nicho.includes("saude") || nicho.includes("clínic") || nicho.includes("médic") || nicho.includes("estétic")) {
    return `${name} — Cuidado humanizado e excelência em saúde.`;
  }

  // 4. Nicho Moda / Luxo / Design
  if (nicho.includes("moda") || nicho.includes("fashion") || nicho.includes("luxo") || nicho.includes("design")) {
    return `${name} — Design autêntico e sofisticação contemporânea.`;
  }

  // 5. Nicho Gastronomia / Alimentação
  if (nicho.includes("aliment") || nicho.includes("restauran") || nicho.includes("food") || nicho.includes("café")) {
    return `${name} — Experiência gastronômica com sabor e essência.`;
  }

  // 6. Nicho Educação / Cursos
  if (nicho.includes("educa") || nicho.includes("ensino") || nicho.includes("curso")) {
    return `${name} — Conhecimento prático que transforma trajetórias.`;
  }

  // 7. Nicho Financeiro / Contábil / Jurídico / Consultoria
  if (nicho.includes("finan") || nicho.includes("contab") || nicho.includes("juríd") || nicho.includes("advoc") || nicho.includes("consult")) {
    return `${name} — Gestão estratégica com máxima precisão e segurança.`;
  }

  // Fallback genérico elegante
  if (hasInovacao) {
    return `${name} — Inovação prática para o seu dia a dia.`;
  }
  return `${name} — Identidade e propósito que geram valor real.`;
}

/**
 * Retorna um H1 de site limpo, moderno e de comprimento controlado (máx 75 caracteres)
 * para qualquer manual (seja antigo/já salvo ou recém-gerado).
 */
export function getCleanHeroTitle(brand: Partial<Brand> & { heroTitle?: string; briefing?: BriefingData }): string {
  if (!brand) return "Manual de Identidade Visual";

  const brandName = (brand.name || "Marca").trim();

  // 1. Se já tem heroTitle curto, limpo e sem listas de valores
  if (brand.heroTitle) {
    const cleaned = cleanString(brand.heroTitle);
    if (cleaned.length >= 6 && cleaned.length <= 75 && !isDumpedOrListText(cleaned)) {
      return cleaned;
    }
  }

  // 2. Se tem promise curta e limpa (<= 65 caracteres)
  if (brand.promise) {
    const cleanedPromise = cleanString(brand.promise);
    if (cleanedPromise.length >= 8 && cleanedPromise.length <= 65 && !isDumpedOrListText(cleanedPromise)) {
      // Se não começa com o nome da marca e é uma frase solta, pode prefixar ou usar direto
      if (!cleanedPromise.toLowerCase().includes(brandName.toLowerCase()) && cleanedPromise.length <= 45) {
        const combined = `${brandName} — ${cleanedPromise}`;
        if (combined.length <= 75) return combined;
      }
      return cleanedPromise;
    }
  }

  // 3. Sintetiza automaticamente baseado no contexto, valores e nicho da marca
  const synthesized = synthesizeHeroHeadline(brand);
  if (synthesized.length <= 75) {
    return synthesized;
  }

  // Corte de segurança estrito
  return `${brandName} — Identidade que comunica valor.`;
}

/**
 * Retorna uma descrição/apresentação limpa para o subtítulo do hero
 * garantindo que blocos crus de valores não poluam o topo da página.
 */
export function getCleanHeroDescription(brand: Partial<Brand> & { briefing?: BriefingData }): string {
  if (!brand) return "Sistema de identidade visual e manual de marca.";

  const desc = cleanString(brand.description);
  const name = (brand.name || "Marca").trim();
  const nicho = brand.briefing?.nicho || "";

  // Se a descrição é limpa, tem tamanho adequado (entre 20 e 220 chars) e não é uma lista despejada
  if (desc && desc.length >= 20 && desc.length <= 220 && !isDumpedOrListText(desc)) {
    return desc;
  }

  // Se o briefing tem propósito claro e curto
  if (brand.briefing?.proposito && brand.briefing.proposito.length <= 160 && !isDumpedOrListText(brand.briefing.proposito)) {
    return `Manual oficial de identidade visual da ${name}. ${cleanString(brand.briefing.proposito)}`;
  }

  // Se a missão é elegante
  if (brand.mission && brand.mission.length <= 160 && !isDumpedOrListText(brand.mission)) {
    return `Diretrizes de identidade e posicionamento da ${name}: ${cleanString(brand.mission)}`;
  }

  // Fallback elegante e profissional
  if (nicho) {
    return `Sistema de identidade visual e diretrizes da ${name}, desenvolvido estrategicamente para o segmento de ${nicho}.`;
  }
  return `Manual de identidade visual e diretrizes de aplicação da marca ${name} em todas as superfícies físicas e digitais.`;
}

// ---------------------------------------------------------------------------
// Voz e Tom da Marca
// ---------------------------------------------------------------------------

export interface BrandVoiceGuidelines {
  summary: string;
  okExamples: string[];
  noExamples: string[];
  contextTones: {
    comercial: { label: string; desc: string };
    produto: { label: string; desc: string };
    suporte: { label: string; desc: string };
  };
  pillars: { name: string; desc: string }[];
}

/**
 * Gera diretrizes de voz e exemplos 100% calibrados para o nicho, missão,
 * visão, valores e proposta real de qualquer marca (antiga ou nova).
 */
export function getBrandVoiceGuidelines(brand: Partial<Brand> & { heroTitle?: string; briefing?: BriefingData; voiceExamples?: { ok: string[]; no: string[] } }): BrandVoiceGuidelines {
  const name = (brand.name || "A marca").trim();
  const { nicho, location, coreValues } = extractContextKeywords(brand);
  const tom = (brand.briefing?.tomDeVoz || "profissional e próximo").toLowerCase();
  const publico = brand.briefing?.publicoAlvo || "clientes e parceiros";

  // Se a IA já gerou voiceExamples válidos e customizados (não vazios)
  const hasCustomOk = brand.voiceExamples?.ok && brand.voiceExamples.ok.length >= 2 && !brand.voiceExamples.ok.some(ex => ex.includes("Resolvemos o problema direto, sem rodeios."));
  const hasCustomNo = brand.voiceExamples?.no && brand.voiceExamples.no.length >= 2 && !brand.voiceExamples.no.some(ex => ex.includes("Sinergias disruptivas que revolucionam"));

  let okExamples: string[] = [];
  let noExamples: string[] = [];
  let summary = "";
  let contextTones = {
    comercial: { label: "Comercial e Vendas", desc: "Confiante, fundamentado em valor real e sem promessas vazias." },
    produto: { label: "Produto e Serviço", desc: "Claro, direto ao ponto e focado na experiência prática do usuário." },
    suporte: { label: "Atendimento e Suporte", desc: "Empático, ágil, prestativo e resolutivo em cada contato." },
  };
  let pillars = [
    { name: "Clareza", desc: "Comunicação sem ruídos ou termos técnicos desnecessários." },
    { name: "Autenticidade", desc: "Falar o que realmente entregamos, com honestidade e segurança." },
    { name: "Respeito", desc: "Foco nas necessidades reais e no tempo de cada cliente." },
  ];

  // 1. Nicho Imobiliário / Arquitetura / Construção
  if (nicho.includes("imóv") || nicho.includes("imobil") || nicho.includes("constru") || nicho.includes("arquit") || /imobili[áa]r|im[óo]veis/i.test(brand.description || "") || /imobili[áa]r|im[óo]veis/i.test(brand.mission || "")) {
    const locStr = location ? ` em ${location}` : "";
    summary = `Tom consultivo, transparente e seguro. Transmite profundo conhecimento do mercado imobiliário${locStr}, valorizando a segurança jurídica, a escolha criteriosa de imóveis e o atendimento humanizado para ${publico}.`;
    
    okExamples = [
      `"Apresentamos opções selecionadas com documentação rigorosamente verificada e assessoria do início ao fim${locStr}."`,
      `"Cada detalhe do imóvel é apresentado com total transparência: metragem, condições e histórico real."`,
      `"Nosso foco é encontrar a melhor solução para seu momento de vida ou investimento, sem pressão comercial."`,
    ];
    noExamples = [
      `"O imóvel dos seus sonhos com o menor preço do universo, compre já antes que acabe!" (apelo exagerado)`,
      `"Oportunidade única e imperdível sem burocracia nenhuma." (promessa vaga e duvidosa)`,
      `"Temos as melhores casas de luxo que vão mudar sua vida para sempre." (clichê sensacionalista)`,
    ];
    contextTones = {
      comercial: { label: "Apresentação e Vendas", desc: "Consultivo, detalhado e fundamentado no valor do metro quadrado e segurança patrimonial." },
      produto: { label: "Portfólio de Imóveis", desc: "Descritivo e preciso: metragens exatas, infraestrutura, condomínio e localização real." },
      suporte: { label: "Assessoria e Pós-venda", desc: "Transparente, prestativo e orientador em cada etapa documental e contratual." },
    };
    pillars = [
      { name: "Transparência", desc: "Informações claras de preços, taxas e condições desde o primeiro contato." },
      { name: "Conhecimento Local", desc: `Expertise sobre os bairros, condomínios e mercado${locStr}.` },
      { name: "Segurança Jurídica", desc: "Rigor na documentação para garantir negociações protegidas." },
    ];
  }
  // 2. Nicho Tech / Software / SaaS / Digital
  else if (nicho.includes("tech") || nicho.includes("software") || nicho.includes("saas") || nicho.includes("tecnolog") || nicho.includes("digital")) {
    summary = `Tom direto, técnico e acessível. Elimina jargões corporativos vazios para focar em precisão operacional, velocidade de resposta e impacto tangível no dia a dia de ${publico}.`;
    
    okExamples = [
      `"${name} automatiza rotinas e centraliza seus dados em um ambiente seguro e em tempo real."`,
      `"Integração rápida via API, documentação completa e suporte com engenheiros especializados."`,
      `"Menos tempo configurando ferramentas, mais foco nos resultados da sua operação."`,
    ];
    noExamples = [
      `"Sinergias disruptivas 4.0 que transformam o ecossistema digital global." (jargão vazio)`,
      `"A plataforma mais perfeita do mundo com inteligência quântica revolucionária." (promessa irreal)`,
      `"Nossa tecnologia mágica resolve todos os seus problemas instantaneamente." (falta de especificidade)`,
    ];
    contextTones = {
      comercial: { label: "Proposta e Demonstração", desc: "Focado em ROI, tempo de implementação e ganhos de produtividade mensuráveis." },
      produto: { label: "Plataforma e UI", desc: "Intuitivo, sem fricção visual e com orientações claras passo a passo." },
      suporte: { label: "Suporte e SLA", desc: "Rápido, analítico e focado em resolver a causa-raiz do chamado." },
    };
    pillars = [
      { name: "Precisão", desc: "Linguagem objetiva com números, prazos e especificações exatas." },
      { name: "Simplicidade", desc: "Tornar conceitos complexos fáceis de entender e usar." },
      { name: "Confiabilidade", desc: "Estabilidade e compromisso contínuo com a segurança do cliente." },
    ];
  }
  // 3. Nicho Saúde / Clínica / Estética / Odontologia
  else if (nicho.includes("saúd") || nicho.includes("saude") || nicho.includes("clínic") || nicho.includes("médic") || nicho.includes("estétic") || nicho.includes("odonto")) {
    summary = `Tom acolhedor, humanizado e de rigor técnico. Transmite empatia, respeito aos sentimentos do paciente e precisão médica em todos os momentos de cuidado com ${publico}.`;
    
    okExamples = [
      `"Acolhemos cada paciente com escuta atenta e planos de cuidado individualizados."`,
      `"Explicamos seu diagnóstico e as opções terapêuticas de forma calma, clara e transparente."`,
      `"Tecnologia médica moderna aliada ao carinho e atenção que sua saúde merece."`,
    ];
    noExamples = [
      `"Cure qualquer dor em 3 minutos com nosso método milagroso patenteado!" (antiético e enganoso)`,
      `"Procedimentos estéticos para você ficar jovem e perfeita para sempre." (superficial e apelativo)`,
      `"O melhor tratamento de todos os tempos pelo preço mais barato do mercado." (desvaloriza o ato médico)`,
    ];
    contextTones = {
      comercial: { label: "Acolhimento e Agendamento", desc: "Caloroso, ágil e atencioso às dúvidas e necessidades de horário do paciente." },
      produto: { label: "Orientações e Procedimentos", desc: "Didático, reconfortante e focado em tranquilizar o paciente sobre cada etapa." },
      suporte: { label: "Pós-atendimento e Cuidados", desc: "Presente, cuidadoso e disponível para acompanhar a recuperação." },
    };
    pillars = [
      { name: "Humanização", desc: "Olhar para o indivíduo antes do sintoma, com empatia genuína." },
      { name: "Ética e Rigor", desc: "Condutas respaldadas na ciência e na verdade técnica." },
      { name: "Acolhimento", desc: "Ambiente seguro e respeitoso em qualquer ponto de contato." },
    ];
  }
  // 4. Nicho Moda / Luxo / Design / Decoração
  else if (nicho.includes("moda") || nicho.includes("fashion") || nicho.includes("luxo") || nicho.includes("design") || nicho.includes("joalheria")) {
    summary = `Tom elegante, sofisticado e sensorial. Comunicação autêntica e contida, que valoriza o acabamento, a história dos materiais e a expressão estética de ${publico}.`;
    
    okExamples = [
      `"Peças com design atemporal, materiais nobres e acabamento impecável em cada costura."`,
      `"Uma curadoria que equilibra elegância discreta e expressão de personalidade."`,
      `"Design concebido para acompanhar sua rotina com conforto e distinção."`,
    ];
    noExamples = [
      `"Compre roupas maravilhosas com desconto imperdível agora mesmo!!!" (linguagem exclamativa barata)`,
      `"A marca mais chique e exclusiva do planeta que todos invejam." (arrogância cafona)`,
      `"Arrase com o look que vai bombar nas redes sociais hoje." (efêmero e genérico)`,
    ];
    contextTones = {
      comercial: { label: "Apresentação de Coleção", desc: "Sensorial, poético na medida certa e focado na nobreza dos detalhes." },
      produto: { label: "Especificações e Guia", desc: "Rico em informações de caimento, composição têxtil e cuidados de conservação." },
      suporte: { label: "Concierge e Atendimento", desc: "Polido, exclusivo, prestativo e atento a preferências individuais." },
    };
    pillars = [
      { name: "Sofisticação", desc: "Menos ruído, mais essência e requinte nos detalhes." },
      { name: "Autenticidade", desc: "Identidade própria que transcende tendências passageiras." },
      { name: "Curadoria", desc: "Atenção meticulosa à qualidade de matérias-primas e acabamentos." },
    ];
  }
  // 5. Nicho Gastronomia / Alimentos / Café / Restaurante
  else if (nicho.includes("aliment") || nicho.includes("restauran") || nicho.includes("food") || nicho.includes("gastronom") || nicho.includes("café") || nicho.includes("padaria")) {
    summary = `Tom caloroso, sensorial e apaixonado. Valoriza o frescor dos ingredientes, a memória afetiva do paladar e o prazer de compartilhar bons momentos com ${publico}.`;
    
    okExamples = [
      `"Ingredientes frescos de produtores selecionados, preparados com técnica e paixão."`,
      `"Receitas que respeitam o tempo de cada sabor e celebram a boa mesa."`,
      `"Venha viver uma experiência onde o acolhimento é tão importante quanto o prato."`,
    ];
    noExamples = [
      `"A comida mais saborosa do mundo com entrega instantânea e precinho camarada." (vulgar e genérico)`,
      `"Sabor que explode na boca para você ficar viciado." (apelo agressivo)`,
      `"Refeições rápidas de última geração para quem não tem tempo a perder." (frio e impessoal)`,
    ];
    contextTones = {
      comercial: { label: "Cardápio e Reservas", desc: "Apetitoso, claro quanto a ingredientes, alérgenos e harmonizações." },
      produto: { label: "Apresentação dos Pratos", desc: "Sensorial, destacando a origem dos insumos e o método de preparo." },
      suporte: { label: "Hospitalidade e Feedback", desc: "Atencioso, generoso e pronto para superar expectativas." },
    };
    pillars = [
      { name: "Sabor e Origem", desc: "Respeito à procedência e ao frescor de cada ingrediente." },
      { name: "Hospitalidade", desc: "Fazer cada cliente se sentir bem-vindo e querido." },
      { name: "Consistência", desc: "A mesma qualidade impecável em cada visita ou pedido." },
    ];
  }
  // 6. Nicho Educação / Cursos / Treinamentos
  else if (nicho.includes("educa") || nicho.includes("ensino") || nicho.includes("curso") || nicho.includes("treina") || nicho.includes("escola")) {
    summary = `Tom inspirador, didático e motivador. Incentiva a evolução contínua, o pensamento crítico e a aplicação prática do conhecimento para ${publico}.`;
    
    okExamples = [
      `"Metodologia prática focada em habilidades reais que o mercado exige."`,
      `"Acompanhamento próximo de mentores que vivem os desafios da área no dia a dia."`,
      `"Transforme seu potencial em resultados sólidos com um plano de estudos estruturado."`,
    ];
    noExamples = [
      `"Fique rico em 7 dias sem esforço com nosso curso infalível!" (promessa charlatã)`,
      `"O método secreto que ninguém quer que você saiba para ter sucesso." (sensacionalismo)`,
      `"Aulas teóricas intermináveis sobre tudo que você nunca vai usar." (desconexão da prática)`,
    ];
    contextTones = {
      comercial: { label: "Matrículas e Informações", desc: "Transparente sobre a ementa, carga horária e objetivos de aprendizado." },
      produto: { label: "Ambiente de Aprendizagem", desc: "Estimulante, claro, com feedbacks construtivos e materiais práticos." },
      suporte: { label: "Secretaria e Apoio ao Aluno", desc: "Prestativo, incentivador e focado em remover barreiras no estudo." },
    };
    pillars = [
      { name: "Prática Real", desc: "Conhecimento aplicável aos desafios reais do mercado." },
      { name: "Didática Clara", desc: "Explicar conceitos com clareza e ritmo adequado." },
      { name: "Evolução Contínua", desc: "Incentivo constante ao crescimento e autonomia do aluno." },
    ];
  }
  // 7. Nicho Financeiro / Contábil / Jurídico / Consultoria
  else if (nicho.includes("finan") || nicho.includes("contab") || nicho.includes("juríd") || nicho.includes("advoc") || nicho.includes("consult") || nicho.includes("invest")) {
    summary = `Tom seguro, analítico e estratégico. Transmite solidez técnica, confidencialidade rigorosa e clareza nas decisões patrimoniais e legais para ${publico}.`;
    
    okExamples = [
      `"Análises fundamentadas em dados concretos e total conformidade com a legislação vigente."`,
      `"Estratégias personalizadas para proteger seu patrimônio e otimizar resultados tributários."`,
      `"Transparência absoluta em relatórios periódicos, taxas e estimativas de cenários."`,
    ];
    noExamples = [
      `"Multiplique seu dinheiro sem risco nenhum em poucos dias com a gente." (irresponsável e ilegal)`,
      `"Deixe seus impostos no zero com fórmulas milagrosas que criamos." (duvidoso e perigoso)`,
      `"Somos a consultoria mais genial do país com soluções infalíveis." (arrogância sem provas)`,
    ];
    contextTones = {
      comercial: { label: "Diagnóstico e Proposta", desc: "Analítico, confidencial e focado em segurança financeira e legal." },
      produto: { label: "Relatórios e Pareceres", desc: "Estruturado, preciso, com gráficos claros e conclusões fundamentadas." },
      suporte: { label: "Assessoria Contínua", desc: "Proativo, ágil e disponível para orientar tomadas de decisão importantes." },
    };
    pillars = [
      { name: "Segurança e Ética", desc: "Conformidade irrestrita e respeito ao patrimônio do cliente." },
      { name: "Visão Estratégica", desc: "Antecipação de cenários e soluções sob medida." },
      { name: "Transparência", desc: "Clareza nos relatórios, riscos e remuneração de serviços." },
    ];
  }
  // 8. Nicho Geral / Customizado
  else {
    summary = `Tom ${tom}. Desenvolvido sob medida para a ${name}, comunicando com clareza a proposta de valor, a missão e os valores da marca para ${publico}.`;
    
    okExamples = [
      `"${name} entrega soluções com consistência, qualidade e comprometimento real em cada ponto de contato."`,
      `"Comunicação direta, transparente e orientada para resolver as necessidades reais do cliente."`,
      `"Cada detalhe reflete nossa dedicação em entregar valor sustentável e duradouro."`,
    ];
    noExamples = [
      `"Somos a empresa que revoluciona tudo com inovação de ponta a ponta." (vago e clichê)`,
      `"A melhor marca do mundo para qualquer pessoa em qualquer lugar." (sem foco nem diferencial)`,
      `"Sua satisfação é nossa meta número um." (frase feita sem personalidade)`,
    ];
  }

  // Se a IA tinha fornecido exemplos customizados, preserve-os se forem ricos
  if (hasCustomOk && brand.voiceExamples?.ok) {
    okExamples = brand.voiceExamples.ok;
  }
  if (hasCustomNo && brand.voiceExamples?.no) {
    noExamples = brand.voiceExamples.no;
  }

  return {
    summary,
    okExamples,
    noExamples,
    contextTones,
    pillars,
  };
}

