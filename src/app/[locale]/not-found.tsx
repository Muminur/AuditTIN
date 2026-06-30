import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const tc = await getTranslations("common");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-6xl font-bold text-jade">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-paper">
        {t("notFoundPageTitle")}
      </h1>
      <p className="mt-2 text-paper/70">{t("notFoundPageBody")}</p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-nbr-green px-5 py-2.5 font-medium text-paper transition-colors hover:bg-jade hover:text-ink"
      >
        {tc("backHome")}
      </Link>
    </div>
  );
}
