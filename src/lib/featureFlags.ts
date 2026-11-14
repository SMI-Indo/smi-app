export const liturgyQuizEnabled = process.env.ENABLE_LITURGY_QUIZ === "true";
export const previewBetaNavbarEnabled =
  process.env.VERCEL_ENV === "preview" && process.env.PREVIEW_BETA_NAVBAR === "true";
