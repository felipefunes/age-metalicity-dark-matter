import type { Dictionary } from "../dictionary";

export const pt: Dictionary = {
  common: {
    loading: "Carregando…",
    close: "Fechar",
    error: "Erro",
    siteTitle: "Matéria Escura, Metalicidade e Idade Galáctica",
  },
  axis: {
    metallicity_kk04: {
      label: "Metalicidade KK04 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pt05: {
      label: "Metalicidade PT05 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pilyugin2014: {
      label: "Metalicidade (Pilyugin+2014)",
      source: "Pilyugin, Grebel & Kniazev 2014",
    },
    age_proxy_ssfr: {
      label: "Proxy de idade: log₁₀ sSFR (z0MGS)",
      source: "z0MGS (Leroy et al. 2019)",
    },
    age_proxy_dn4000: {
      label: "Dn4000 (proxy de idade, espectro SDSS)",
      source: "espectros SDSS (Balogh et al. 1999)",
    },
    age_proxy_hdelta_a: {
      label: "Hδ_A (proxy de idade, espectro SDSS)",
      source: "espectros SDSS (Worthey & Ottaviani 1997)",
    },
    dm_fraction: {
      label: "Fração de matéria escura (f_DM)",
      source: null,
    },
    mass: {
      label: "Massa L[3.6] (10⁹ L☉)",
      source: null,
    },
    mhi: {
      label: "Massa de HI (10⁹ M☉)",
      source: null,
    },
    hubble_type: {
      label: "Tipo de Hubble (T)",
      source: null,
    },
  },
  matchMethod: {
    name_match: "Por nome (Simbad)",
    coordinate_match: "Por coordenadas (NED + Simbad)",
  },
  detail: {
    ra: "Ascensão reta (RA)",
    dec: "Declinação (Dec)",
    distance: "Distância",
    outerRadius: "Raio externo modelado",
    vobsOuter: "Vobs (raio externo)",
    vbarOuter: "Vbar (raio externo)",
    clipped: "(cortado)",
    qualityFlag: "Indicador de qualidade (SPARC)",
    noData: "sem dado",
    lickResolutionNote: "resolução Lick",
    closeAriaLabel: "Fechar painel de detalhes",
    hiiRegionsSuffix: (n) => `(${n} regiões HII)`,
    pxSuffix: (n) => `(${n} px)`,
  },
  filter: {
    axesTitle: "Eixos do gráfico de dispersão",
    xAxisLabel: "Eixo X",
    yAxisLabel: "Eixo Y",
    axesHint: "Escolha quais variáveis comparar no gráfico de dispersão acima.",
    massTitlePrefix: "Massa",
    massHint: "Restrinja o intervalo de massa estelar (L[3.6]) para comparar galáxias de tamanho semelhante.",
    massAriaLabelMin: "Massa mínima",
    massAriaLabelMax: "Massa máxima",
    qualityTitle: "Qualidade",
    excludeLowQuality: "Excluir quality_flag baixo (Q=3)",
    qualityHint: "O SPARC marca com Q=3 as curvas de rotação menos confiáveis; você pode excluí-las.",
    matchMethodTitle: "Método de correspondência de identidade",
    matchMethodHint:
      "Como cada galáxia foi identificada em catálogos externos: por nome ou, se isso falhar, por coordenadas.",
    ageTitle: "Idade estelar",
    requireAge: "Apenas galáxias com idade estelar estrita disponível",
    ageHint: "Limita a galáxias com uma medição direta de idade estelar (não um proxy), quando disponível.",
    resetButton: "Redefinir filtros",
    mobileToggle: "Filtros",
  },
  chart: {
    controlForMass: "Controlar correlação por massa",
    errorPrefix: "Erro ao carregar dados",
    spearman: "Spearman",
    spearmanPartialMass: "Spearman parcial (controle: massa)",
    sourcePrefix: "Fonte:",
    nPlotted: (n) => `n = ${n} galáxias plotadas`,
    scatterEmptyState: (xLabel, yLabel) =>
      `Não há galáxias com dados disponíveis para ${xLabel} e ${yLabel} com os filtros atuais.`,
    scatterHint:
      "Passe o mouse sobre um ponto para ver detalhes, clique para abrir a ficha completa da galáxia. Arraste para dar zoom.",
    scatterLogSuffix: " (escala log)",
    hoverCrossLabel: "correspondência:",
    notSignificantPrefix: "Sem correlação significativa",
    hubbleTitle: "f_DM por tipo de Hubble (proxy morfológico de idade)",
    hubbleEmptyState: "Não há galáxias com T e f_DM disponíveis com os filtros atuais.",
    hubbleHint:
      "Cada caixa resume a fração de matéria escura das galáxias daquele tipo morfológico; os pontos são galáxias individuais, clicáveis.",
    hubbleSourceSuffix: "— T discreto/ordinal, agrupado por tipo",
    hubbleRawStatLabel: "Spearman bruto",
    hubbleMassStatLabel: "Controlando pela massa",
  },
  nav: {
    brand: "Matéria Escura",
    dataLink: "Dados",
    sourcesLink: "Fontes",
    galaxiesLink: "Galáxias",
    languageLabel: "Idioma",
  },
  hero: {
    leadQuestion:
      "As galáxias mais velhas ou evoluídas têm mais matéria escura do que as jovens? Este projeto busca responder essa pergunta com dados públicos reais — e mostra tanto o que encontramos quanto os limites do que esses dados realmente podem nos dizer.",
    howItWorksSummary: "Como isso funciona?",
    intro1Before: "Esta ferramenta cruza dados públicos de cinemática galáctica (",
    intro1After:
      ") com metalicidade e idade estelar de catálogos externos (HyperLeda, NED), resolvidos a um identificador canônico PGC por galáxia.",
    intro2Before:
      "O objetivo é explorar se existe correlação entre a fração de matéria escura de uma galáxia e sua metalicidade ou idade, ",
    intro2Bold: "controlando pela massa",
    intro2After:
      " — porque uma correlação bruta entre metalicidade e matéria escura pode ser espúria se ambas dependem da massa da galáxia.",
    disclaimer: "Esta é uma ferramenta exploratória, não uma fonte de conclusões validadas por revisão por pares.",
  },
  reliability: {
    heading: "Mapa de confiabilidade",
    columnVariable: "Variável",
    columnMeasures: "O que mede",
    columnCoverage: "Cobertura",
    columnConfidence: "Quão confiável",
    rows: [
      {
        variable: "Tipo de Hubble (morfologia)",
        measures: 'proxy grosseiro de "estágio evolutivo"',
        coverage: "163/163 galáxias",
        confidence: "Alta — amostra completa",
      },
      {
        variable: "sSFR (z0MGS)",
        measures: "proxy de formação estelar recente",
        coverage: "126/163",
        confidence: "Alta cobertura, resultado: nenhuma correlação detectada",
      },
      {
        variable: "Dn4000 / Hδ_A",
        measures: "idade estelar medida diretamente do espectro",
        coverage: "41/163",
        confidence: "Média — amostra pequena, validado contra catálogos oficiais",
      },
      {
        variable: "Metalicidade (Moustakas/Pilyugin)",
        measures: "composição química medida",
        coverage: "22/163",
        confidence: "Baixa — amostra pequena, resultados preliminares",
      },
    ],
    fourVariablesNote:
      "Por que quatro variáveis diferentes de idade/composição em vez de uma só? Cada uma vem de uma fonte e um método distintos, com sua própria cobertura — nenhuma cobre toda a amostra. Todas são documentadas por transparência, não para confundir.",
  },
  section: {
    fuentesTitle: "Fontes de dados",
  },
  sources: {
    sparc: "cinemática, tipo de Hubble, luminosidade [3.6μm], massa de HI.",
    hyperleda: "parâmetros extragalácticos por objeto (metalicidade/idade quando disponíveis).",
    nedSimbad: "resolução de identidade para PGC (por nome ou, se isso falhar, por coordenadas).",
    moustakas: "metalicidade (duas calibrações, KK04 e PT05).",
    pilyugin: "metalicidade, fonte independente.",
    z0mgs: "proxy de idade via sSFR, não uma idade estelar em sentido estrito.",
    dn4000Hdelta:
      "Dn4000 e Hδ_A medidos diretamente a partir de espectros do SDSS (não um catálogo pré-calculado), seguindo o método de Kauffmann et al. (2003, MNRAS, 341, 33 e 54).",
    andConnector: "e",
    sdssImaging: "imagens ópticas para a galeria de fotos (SDSS DR18 SkyServer).",
    legacyImaging:
      "imagens ópticas de reserva, cobertura maior que a do SDSS (DESI Legacy Imaging Survey, camada DR10).",
    wiseImaging:
      "imagens de infravermelho médio (~3.4 μm) de todo o céu, último recurso quando não há cobertura óptica (WISE/unWISE, via o visualizador do DESI Legacy Imaging).",
  },
  footer: {
    openSourceText: "Este é um projeto de código aberto no",
    licenseNote: "Código sob licença MIT.",
  },
  galaxies: {
    pageTitle: "Galáxias",
    pageHint:
      "As 163 galáxias SPARC resolvidas para PGC, com uma imagem real quando há cobertura de algum levantamento público. Clique em uma para vê-la maior.",
    sourceSdss: "Imagem: SDSS",
    sourceLegacyOptical: "Imagem: DESI Legacy Imaging Survey (óptico)",
    sourceLegacyWise: "Imagem: WISE (infravermelho médio, ~3.4 μm)",
    noImage: "Sem imagem disponível nos levantamentos consultados",
    viewFullRecord: "Ver ficha completa",
    modalCloseAriaLabel: "Fechar imagem",
  },
};
