"use client";

import { useTranslations } from "next-intl";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-paper">
        {t("genericPageTitle")}
      </h1>
      <p className="mt-2 text-paper/70">{t("genericPageBody")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md bg-nbr-green px-5 py-2.5 font-medium text-paper transition-colors hover:bg-jade hover:text-ink"
      >
        {t("server")}
      </button>
    </div>
  );
}
