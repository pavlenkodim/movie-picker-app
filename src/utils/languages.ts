export const BASE_LANGUAGE = "en";

// Extra languages for movie translations from LANGUAGES env, e.g. "ru,de".
// English is the base language stored in movies, so it is never in this list.
export function getSupportedLanguages(): string[] {
  return (process.env.LANGUAGES ?? "")
    .split(",")
    .map((lang) => lang.trim().toLowerCase())
    .filter((lang) => lang && lang !== BASE_LANGUAGE);
}
