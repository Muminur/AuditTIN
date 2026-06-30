import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Info, FileText, Search, ArrowRight, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getMeta } from "@/lib/meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("intro") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const meta = getMeta();

  const sections = [
    { icon: FileText, title: t("sourceTitle"), body: t("sourceBody", { label: meta.label, date: meta.publishedAt }) },
    { icon: Search, title: t("meaningTitle"), body: t("meaningBody") },
    { icon: ArrowRight, title: t("nextTitle"), body: t("nextBody") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title={t("title")} />

      <p className="flex items-start gap-3 text-lg leading-relaxed text-paper/85">
        <Info aria-hidden className="mt-1 h-5 w-5 shrink-0 text-jade" />
        {t("intro")}
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-paper">
              <s.icon aria-hidden className="h-5 w-5 text-jade" />
              {s.title}
            </h2>
            <p className="mt-2 leading-relaxed text-paper/75">{s.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-lg border-l-2 border-stamp bg-stamp/10 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stamp-soft">
          <ShieldAlert aria-hidden className="h-5 w-5" />
          {t("unofficialTitle")}
        </h2>
        <p className="mt-2 leading-relaxed text-paper/80">
          {t("unofficialBody")}
        </p>
      </section>
    </div>
  );
}
