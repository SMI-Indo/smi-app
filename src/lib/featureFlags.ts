const quizEnabled = () => process.env.ENABLE_LITURGY_QUIZ === "true";
export const liturgyQuizEnabled = quizEnabled();

const navigationFeatures = ["event", "merchandise", "video", "quiz", "coin", "membership"] as const;
export type NavigationFeature = (typeof navigationFeatures)[number];

export function getNavigationRelease() {
  const environment = process.env.VERCEL_ENV;
  const configured = new Set(process.env.NAV_COMING_SOON?.split(",").map((value) => value.trim()));
  return {
    showBeta: environment === "production" || (environment === "preview" && process.env.PREVIEW_BETA_NAVBAR === "true"),
    showQuiz: quizEnabled(),
    comingSoon: navigationFeatures.filter((feature) => configured.has(feature)),
  };
}

export type NavigationRelease = ReturnType<typeof getNavigationRelease>;
