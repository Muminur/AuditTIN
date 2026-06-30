import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ScanLine,
  EyeOff,
  Link2Off,
  Ban,
  Gauge,
  Database,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const POINT_KEYS = [
  { key: "exact", icon: ScanLine },
  { key: "noLog", icon: EyeOff },
  { key: "noUrl", icon: Link2Off },
  { key: "noBulk", icon: Ban },
  { key: "rateLimit", icon: Gauge },
  { key: "minimal", icon: Database },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <p className="max-w-2xl text-lg leading-relaxed text-paper/85">
        {t("intro")}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {POINT_KEYS.map(({ key, icon: Icon }) => (
          <section key={key} className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-paper">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-jade/15 text-jade">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              {t(`points.${key}.t`)}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-paper/75">
              {t(`points.${key}.d`)}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-md border border-line bg-ink-2/40 p-5 text-sm text-paper/80">
        {t("contact")}
      </p>
    </div>
  );
}
