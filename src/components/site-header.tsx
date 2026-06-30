import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LangToggle } from "./lang-toggle";
import { MobileNav } from "./mobile-nav";

const NAV = [
  { href: "/", key: "home" },
  { href: "/statistics", key: "statistics" },
  { href: "/about", key: "about" },
  { href: "/faq", key: "faq" },
  { href: "/privacy", key: "privacy" },
] as const;

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");

  const items = NAV.map((n) => ({ href: n.href, label: t(n.key) }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur supports-[backdrop-filter]:bg-ink/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-paper transition-opacity hover:opacity-90"
        >
          <span className="grid h-9 w-9 place-items-center rounded-md bg-nbr-green text-paper">
            <ShieldCheck aria-hidden className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold tracking-tight">
              {tc("appNameShort")}
            </span>
            <span className="eyebrow mt-0.5 text-[0.6rem]">
              {tc("unofficial")}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-paper/80 transition-colors hover:bg-ink-2 hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle />
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  );
}
