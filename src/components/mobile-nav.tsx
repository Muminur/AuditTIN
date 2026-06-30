"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface NavItem {
  href: string;
  label: string;
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-paper hover:border-jade/60 hover:text-jade"
      >
        {open ? (
          <X aria-hidden className="h-5 w-5" />
        ) : (
          <Menu aria-hidden className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="absolute left-0 right-0 top-16 border-b border-line bg-ink/95 px-4 py-3 backdrop-blur"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-paper/90 hover:bg-ink-2 hover:text-paper"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
