"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Toggle between English and বাংলা, preserving the current page. */
export function LangToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const other = locale === "en" ? "bn" : "en";
  const label = other === "bn" ? "বাংলা" : "English";

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => router.replace(pathname, { locale: other }))
      }
      disabled={isPending}
      aria-label={`Switch language to ${label}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-sm font-medium text-paper/90 transition-colors hover:border-jade/60 hover:text-jade disabled:opacity-50",
        className,
      )}
    >
      <Languages aria-hidden className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
