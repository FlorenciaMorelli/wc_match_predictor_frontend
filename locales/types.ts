export type ModelKey = "dixon_coles" | "bivariate_poisson" | "poisson_simple";

export type Translations = {
  meta: { title: string; description: string; dateLocale: string };
  nav: { title: string; predict: string; fixture: string };
  hero: {
    badge: string;
    heading1: string;
    heading2: string;
    description: string;
    ctaPredict: string;
    ctaFixture: string;
  };
  countdown: {
    started: string;
    label: string;
    days: string;
    hours: string;
    min: string;
    sec: string;
  };
  fixture: {
    sectionLabel: string;
    heading: string;
    rounds: Record<string, string>;
    matchday: (n: number) => string;
    pendingTitle: string;
    pendingDescription: string;
    description: string;
    emptyState: string;
    loadMore: string;
    today: string;
    tomorrow: string;
    jumpUpcoming: string;
    viewAnalysis: string;
    viewPrediction: string;
    retry: string;
    errorLoad: string;
    errorPredict: string;
    vs: string;
    utcSuffix: string;
    status: Record<string, string>;
  };
  predictor: {
    sectionLabel: string;
    heading: string;
    description: string;
    errorLoad: string;
    errorPredict: string;
    teamALabel: string;
    teamBLabel: string;
    placeholderA: string;
    placeholderB: string;
    dateAriaLabel: string;
    knockout: string;
    calculating: string;
    predict: string;
    clear: string;
    sameTeam: string;
    loadingTitle: string;
    loadingSteps: string[];
  };
  teamPicker: { placeholder: string; search: string; noResults: string };
  modelPicker: {
    label: string;
    recommended: string;
    dixon_coles: { label: string; description: string };
    bivariate_poisson: { label: string; description: string };
    poisson_simple: { label: string; description: string };
  };
  modal: { close: string };
  theme: { toLight: string; toDark: string };
  footer: {
    madeBy: string;
  };
  result: {
    draw: string;
    winsTeamHeadline: (name: string) => string;
    advancesTeamLabel: (name: string) => string;
    mostLikelyScores: string;
    lineupConfirmed: string;
    lineupPending: string;
    lineupView: string;
    lineupHide: string;
    lineupApprox: string;
    lineupPendingNote: string;
    lineupUnavailableLive: string;
    lineupUnavailableFinished: string;
    absencesLabel: string;
    absencesNote: string;
    lineGk: string;
    lineDef: string;
    lineMid: string;
    lineFwd: string;
    probabilitiesAt90: string;
    penaltiesProbability: string;
    analysis: string;
    summary: {
      win: (winner: string, loser: string, gf: number, ga: number) => string;
      draw: (teamA: string, teamB: string, goals: number) => string;
      blowout: string;
      narrow: string;
      highScoring: string;
      expected: string;
      surprise: (prob: string) => string;
    };
    goalsHeading: string;
    penaltyTag: string;
    ownGoalTag: string;
    squadFormation: string;
    mostLikelyResult: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    confidencePhrase: (level: string) => string;
    score: string;
    vs: string;
    venueNeutral: string;
    venueHome: (name: string) => string;
    compare: {
      actual: string;
      surprise: string;
      goalsLabel: string;
      goalsMore: string;
      goalsFewer: string;
      goalsAsExpected: string;
      goalsMixed: (
        teamA: string,
        teamAMore: boolean,
        teamB: string,
        teamBMore: boolean
      ) => string;
      scoreTop: string;
      scoreRanked: (rank: number) => string;
      scoreOutside: string;
    };
  };
};
