import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Run on all paths EXCEPT API routes, Next internals, Vercel internals,
  // and any file with an extension (favicon, robots.txt, images, …).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
