/**
 * Mask a TIN for display in admin/aggregate views, e.g. "441234567337" → "44****7337".
 * Shows the first 2 and last 4 digits; the middle is fixed-width to avoid
 * leaking the exact length and to match the house style in CLAUDE.md §3.
 */
export function maskTin(tin: string): string {
  if (tin.length < 6) return "****";
  return `${tin.slice(0, 2)}****${tin.slice(-4)}`;
}

/** Group a 12-digit TIN into readable blocks: "1234 5678 9012". */
export function formatTinGroups(tin: string): string {
  return tin.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Format an integer with locale grouping (e.g. 5014 → "5,014"). */
export function formatCount(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(n);
  } catch {
    return String(n);
  }
}

/** Tailwind-friendly className combiner (no extra dep). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
