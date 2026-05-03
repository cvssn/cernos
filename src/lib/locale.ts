const LOCALE_RE = /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8}){0,3}$/;

export function getBrowserLocale(): string {
  if (typeof navigator === "undefined") return "en";
  const cand =
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    "en";
  return sanitizeLocale(cand);
}

export function sanitizeLocale(locale: string | undefined | null): string {
  if (!locale) return "en";
  const trimmed = locale.trim();
  if (!LOCALE_RE.test(trimmed)) return "en";
  return trimmed;
}

export function getLanguageDisplayName(
  locale: string,
  displayLocale: string = "en"
): string {
  const safe = sanitizeLocale(locale);
  try {
    const dn = new Intl.DisplayNames([displayLocale], { type: "language" });
    return dn.of(safe) ?? safe;
  } catch {
    return safe;
  }
}
