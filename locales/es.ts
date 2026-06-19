import type { Translations } from "./types";

export const es: Translations = {
  meta: {
    title: "Predictor del Mundial 2026",
    description:
      "Elegí dos selecciones y conocé las probabilidades del resultado, calculadas con modelos estadísticos sobre partidos reales.",
    dateLocale: "es-AR",
  },
  nav: {
    title: "Mundial 2026",
    predict: "Predecir",
    fixture: "Fixture",
  },
  hero: {
    badge: "Mundial FIFA 2026",
    heading1: "Predecí quién gana",
    heading2: "cada partido",
    description:
      "Elegí dos selecciones y conocé las probabilidades del resultado, calculadas con modelos estadísticos sobre partidos reales.",
    ctaPredict: "Probar el predictor",
    ctaFixture: "Ver el fixture",
  },
  countdown: {
    started: "El Mundial ya está en marcha",
    label: "El Mundial arranca en",
    days: "días",
    hours: "horas",
    min: "min",
    sec: "seg",
  },
  fixture: {
    sectionLabel: "Fixture",
    heading: "Próximos partidos",
    rounds: {
      "group-stage": "Fase de grupos",
      "round-of-32": "Dieciseisavos de final",
      "round-of-16": "Octavos de final",
      "quarter-finals": "Cuartos de final",
      "semi-finals": "Semifinales",
      final: "Final",
      "third-place": "Tercer puesto",
    },
    matchday: (n: number) => `Fecha ${n}`,
    pendingTitle: "Por definir",
    pendingDescription: "Los cruces se definen al avanzar el torneo.",
    description:
      'Tocá "Ver predicción" en cualquier partido y mirá el análisis completo.',
    emptyState: "No hay partidos programados en este período.",
    loadMore: "Ver más partidos",
    today: "Hoy",
    tomorrow: "Mañana",
    jumpUpcoming: "Próximos",
    viewAnalysis: "Ver análisis",
    viewPrediction: "Ver predicción",
    retry: "Reintentar",
    errorLoad: "No pudimos cargar el fixture. Intentá de nuevo.",
    errorPredict: "No pudimos calcular la predicción. Intentá de nuevo.",
    vs: "vs",
    utcSuffix: "UTC",
    status: {
      "en juego": "En juego",
      descanso: "Entretiempo",
      STATUS_HALFTIME: "Entretiempo",
      finalizado: "Finalizado",
      postergado: "Postergado",
      cancelado: "Cancelado",
      suspendido: "Suspendido",
      programado: "Programado",
      STATUS_FULL_TIME: "Finalizado",
      STATUS_FIRST_HALF: "Primer tiempo",
      STATUS_SECOND_HALF: "Segundo tiempo",
    },
  },
  predictor: {
    sectionLabel: "Predictor",
    heading: "Predecí un partido",
    description:
      "Elegí dos selecciones y el modelo calcula las probabilidades del resultado con datos de partidos reales.",
    errorLoad:
      "No pudimos cargar las selecciones. Revisá tu conexión e intentá de nuevo en unos segundos.",
    errorPredict: "No pudimos calcular la predicción. Intentá de nuevo.",
    teamALabel: "Equipo A",
    teamBLabel: "Equipo B",
    placeholderA: "Selección A",
    placeholderB: "Selección B",
    dateAriaLabel: "Fecha del partido",
    knockout: "Eliminatoria",
    calculating: "Calculando...",
    predict: "Predecir",
    clear: "Limpiar",
    sameTeam: "Elegí dos selecciones distintas.",
    loadingTitle: "Simulando el partido",
    loadingSteps: [
      "Analizando planteles…",
      "Corriendo 100.000 simulaciones…",
      "Calculando probabilidades…",
      "Casi listo…",
    ],
  },
  teamPicker: {
    placeholder: "Elegir selección",
    search: "Buscar...",
    noResults: "Sin resultados",
  },
  modelPicker: {
    label: "Modelo",
    recommended: "Recomendado",
    dixon_coles: {
      label: "Dixon-Coles",
      description:
        "El más preciso. Ajusta los partidos de pocos goles y da más peso a los resultados recientes.",
    },
    bivariate_poisson: {
      label: "Poisson bivariado",
      description:
        "Estima los goles de ambos equipos teniendo en cuenta la correlación entre sí.",
    },
    poisson_simple: {
      label: "Poisson simple",
      description:
        "Modelo base. Estima los goles de cada equipo de forma independiente.",
    },
  },
  footer: {
    madeBy: "Desarrollado por",
    modelAccuracy: "Sobre el modelo",
    responsibleUse:
      "Predicciones estadísticas con fines informativos y de entretenimiento. No promovemos las apuestas; si jugás, hacelo con responsabilidad.",
  },
  eval: {
    title: "Sobre el modelo",
    subtitle:
      "Cómo funciona el predictor, qué tan acertado fue contra los resultados reales del Mundial 2026 y cómo interpretarlo.",
    back: "Volver",
    how: {
      title: "¿Cómo funciona?",
      intro:
        "Para cada partido, el modelo estima cuántos goles puede marcar cada selección y simula el partido muchas veces para calcular las probabilidades.",
      steps: [
        "Estima la fuerza de cada selección a partir de su historial, dándole más peso a su forma reciente.",
        "Calcula los goles esperados de cada equipo y ajusta los partidos de pocos goles.",
        "Simula el partido 100.000 veces y cuenta con qué frecuencia ocurre cada marcador.",
        "De esas simulaciones salen las probabilidades 1X2 y los marcadores más probables; en eliminatorias también simula alargue y penales.",
      ],
      models: "Podés comparar tres enfoques:",
    },
    modelLabel: "Modelo",
    computing: (done, total) => `Evaluando ${done}/${total} partidos…`,
    empty: "Todavía no hay partidos finalizados para evaluar.",
    metricsTitle: "Qué tan acertado fue",
    metrics: {
      winner: "Acierto de ganador",
      winnerHelp:
        "Partidos donde el desenlace más probable (1X2) coincidió con el real.",
      brier: "Brier score",
      brierHelp:
        "Calibración de las probabilidades (0 = perfecto, menor es mejor).",
      exact: "Marcador exacto",
      exactHelp:
        "Partidos donde el marcador más probable coincidió con el real.",
      matches: "Partidos evaluados",
      matchesHelp: "Finalizados con marcador, usados en el cálculo.",
    },
    calibrationTitle: "¿Son confiables las probabilidades?",
    calibrationIntro:
      "Agrupamos todas las probabilidades que dio el modelo en rangos de 10% y, para cada rango, comparamos el promedio que predijo con la frecuencia real con que esos resultados ocurrieron.",
    calibrationExample:
      "Por ejemplo: de los resultados a los que el modelo les asignó entre 60% y 70%, uno bien calibrado acierta cerca del 65% de las veces. Cuanto más se parecen las barras de “predicho” y “observado”, mejor calibrado está.",
    calBucket: "Rango",
    calMatches: "Casos",
    calPredicted: "Predicho",
    calObserved: "Observado",
    note: "Las predicciones se calculan contra cada partido finalizado y se guardan en tu navegador; la primera vez el cálculo puede tardar unos segundos.",
    limits: {
      title: "Límites y uso responsable",
      body: "Estas predicciones son estimaciones estadísticas, no certezas: el modelo se equivoca y el fútbol es impredecible. La herramienta es informativa y de entretenimiento, y no promueve las apuestas. Si decidís apostar, hacelo con responsabilidad y nunca como una forma de ganar dinero; si el juego deja de ser un juego, buscá ayuda profesional.",
    },
  },
  modal: { close: "Cerrar" },
  theme: {
    toLight: "Cambiar a modo claro",
    toDark: "Cambiar a modo oscuro",
  },
  result: {
    draw: "Empate",
    winsTeamHeadline: (name) => `Gana ${name}`,
    advancesTeamLabel: (name) => `Avanza ${name}`,
    mostLikelyScores: "Marcadores más probables",
    lineupConfirmed: "Formación confirmada",
    lineupPending: "Formación por confirmar",
    lineupView: "Ver formación",
    lineupHide: "Ocultar formación",
    lineupApprox: "Orden de ESPN · posiciones aproximadas",
    lineupPendingNote: "Las alineaciones se publican ~1 h antes del partido.",
    lineupUnavailableLive: "Formación no disponible.",
    lineupUnavailableFinished: "No hay datos de formación de este partido.",
    absencesLabel: "Ausencias destacadas",
    absencesNote: "Figuras que no están en el XI confirmado.",
    lineGk: "ARQ",
    lineDef: "DEF",
    lineMid: "MED",
    lineFwd: "DEL",
    probabilitiesAt90: "Probabilidades a 90'",
    penaltiesProbability: "Probabilidad de definición por penales:",
    analysis: "Análisis",
    summary: {
      win: (winner, loser, gf, ga) =>
        `${winner} se impuso ${gf}-${ga} a ${loser}`,
      draw: (teamA, teamB, goals) =>
        `${teamA} y ${teamB} igualaron ${goals}-${goals}`,
      blowout: "con una goleada",
      narrow: "por la mínima",
      highScoring: "en un partido de muchos goles",
      expected: "En línea con el pronóstico del modelo",
      surprise: (prob) =>
        `Un desenlace que el modelo veía poco probable (${prob})`,
    },
    goalsHeading: "Goles",
    penaltyTag: "P",
    ownGoalTag: "EC",
    squadFormation: "Plantilla y formación",
    mostLikelyResult: "Resultado más probable",
    confidenceHigh: "Alta",
    confidenceMedium: "Media",
    confidenceLow: "Baja",
    confidencePhrase: (level) => `confianza ${level.toLowerCase()}`,
    score: "Marcador",
    vs: "vs",
    venueNeutral: "Cancha neutral",
    venueHome: (name) => `Local: ${name}`,
    compare: {
      actual: "real",
      surprise: "Resultado inesperado",
      goalsLabel: "Goles",
      goalsMore: "Más goles de los esperados",
      goalsFewer: "Menos goles de los esperados",
      goalsAsExpected: "Goles dentro de lo previsto",
      goalsMixed: (teamA, teamAMore, teamB, teamBMore) =>
        `${teamA} marcó por ${teamAMore ? "encima" : "debajo"} de lo esperado y ${teamB} por ${
          teamBMore ? "encima" : "debajo"
        }`,
      scoreTop: "El resultado fue el marcador más probable",
      scoreRanked: (rank) =>
        `El resultado fue el ${rank}º marcador más probable`,
      scoreOutside: "El resultado no estaba entre los 8 más probables",
    },
  },
  errors: {
    retry: "Reintentar",
    offline: { title: "Sin conexión", body: "Revisá tu internet y reintentá." },
    waking: {
      title: "Despertando el servidor",
      body: "Estaba en reposo. Esperá unos segundos y reintentá.",
    },
    slow: {
      title: "Tardó demasiado",
      body: "El servidor está lento. Reintentá en un momento.",
    },
    server: {
      title: "Algo salió mal",
      body: "Tuvimos un problema. Reintentá.",
    },
  },
};
