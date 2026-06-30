import { getTranslations, setRequestLocale } from "next-intl/server";
import { BarChart3, FlaskConical } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LookupTerminal } from "@/components/lookup-terminal";
import { getStats } from "@/lib/meta";
import { formatCount } from "@/lib/utils";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const stats = getStats();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-3 text-balance font-display text-3xl font-bold leading-tight text-paper sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-paper/75 sm:text-lg">
          {t("subhead")}
        </p>
      </div>

      <div className="mt-10">
        <LookupTerminal />
      </div>

      {/* Stats teaser */}
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-paper/70">
          {t("statsTeaser", {
            count: formatCount(stats.totalSelected, locale),
            zones: formatCount(stats.zonesCount, locale),
          })}
        </p>
        <Link
          href="/statistics"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-jade hover:underline"
        >
          <BarChart3 aria-hidden className="h-4 w-4" />
          {t("statsTeaserLink")}
        </Link>
      </div>

      {stats.sample && (
        <p className="mx-auto mt-8 flex max-w-xl items-start gap-2 rounded-md border border-line bg-ink-2/40 px-4 py-3 text-xs text-mute">
          <FlaskConical aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {t("exampleNote")}
        </p>
      )}
    </div>
  );
}
