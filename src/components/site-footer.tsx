import { getTranslations } from "next-intl/server";
import { ShieldAlert, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getMeta } from "@/lib/meta";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const meta = getMeta();

  return (
    <footer className="mt-auto border-t border-line bg-ink-2/40">
      {/* Persistent unofficial disclaimer — present on every page (§3). */}
      <div className="border-b border-line/60 bg-stamp/10">
        <div className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-3 text-sm text-stamp-soft sm:px-6">
          <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("disclaimer")}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        <div className="space-y-2">
          <p className="font-display text-sm font-semibold text-paper">
            {tn("home")}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-mute">
            <Lock aria-hidden className="h-3.5 w-3.5" />
            {t("builtWith")}
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-1.5 text-sm">
          <Link href="/about" className="text-paper/80 hover:text-jade">
            {tn("about")}
          </Link>
          <Link href="/faq" className="text-paper/80 hover:text-jade">
            {tn("faq")}
          </Link>
          <Link href="/privacy" className="text-paper/80 hover:text-jade">
            {tn("privacy")}
          </Link>
          <Link href="/admin" className="text-mute hover:text-jade">
            {tn("admin")}
          </Link>
        </nav>

        <div className="space-y-1.5 text-xs text-mute md:text-right">
          <p>{t("dataset", { label: meta.label, date: meta.publishedAt })}</p>
          <p>{t("rights")}</p>
        </div>
      </div>
    </footer>
  );
}
