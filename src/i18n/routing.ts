import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // English first for broad accessibility; বাংলা is a first-class, one-click toggle.
  locales: ["en", "bn"],
  defaultLocale: "en",
  // `/` and `/about` are English; `/bn`, `/bn/about` are Bangla.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/** Type guard: is the given value one of our supported locales? */
export function isValidLocale(value: string | undefined | null): value is Locale {
  return (
    typeof value === "string" &&
    (routing.locales as readonly string[]).includes(value)
  );
}
