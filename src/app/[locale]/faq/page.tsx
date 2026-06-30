import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const ITEM_KEYS = [
  "what",
  "official",
  "store",
  "partial",
  "notListed",
  "wrong",
  "year",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");

  const items = ITEM_KEYS.map((k) => ({
    q: t(`items.${k}.q`),
    a: t(`items.${k}.a`),
  }));

  // FAQPage structured data for SEO.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="space-y-3">
        {items.map((it, i) => (
          <details
            key={i}
            className="group card overflow-hidden"
            {...(i === 0 ? { open: true } : {})}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-display font-medium text-paper marker:content-none [&::-webkit-details-marker]:hidden">
              {it.q}
              <ChevronDown
                aria-hidden
                className="h-5 w-5 shrink-0 text-jade transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="px-5 pb-5 text-paper/75">{it.a}</div>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
