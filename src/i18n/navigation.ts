import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation helpers. Use these instead of next/link and
// next/navigation throughout the app so locale prefixing is handled for us.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
