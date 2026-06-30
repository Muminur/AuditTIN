/**
 * gen-seo.ts — emit static public/robots.txt and public/sitemap.xml.
 *
 * Served from /public so Next.js delivers them directly (highest priority),
 * avoiding the `[locale]` dynamic-segment collision that turns app-root
 * metadata routes into 404s under `localePrefix: "as-needed"`.
 *
 * Runs in `prebuild`, after ingest. The base URL is resolved from the
 * environment at build time (Vercel injects VERCEL_PROJECT_PRODUCTION_URL).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

const BASE = baseUrl();
const PATHS = ["", "/statistics", "/about", "/faq", "/privacy"];

const robots = `# Audit Status Portal
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /bn/admin

Sitemap: ${BASE}/sitemap.xml
Host: ${BASE}
`;

const urls = PATHS.map((path) => {
  const en = `${BASE}${path || "/"}`;
  const bn = `${BASE}/bn${path}`;
  const priority = path === "" ? "1.0" : "0.7";
  return `  <url>
    <loc>${en}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${en}" />
    <xhtml:link rel="alternate" hreflang="bn" href="${bn}" />
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

mkdirSync(PUBLIC_DIR, { recursive: true });
writeFileSync(join(PUBLIC_DIR, "robots.txt"), robots, "utf8");
writeFileSync(join(PUBLIC_DIR, "sitemap.xml"), sitemap, "utf8");

console.log(`✓ SEO: public/robots.txt + public/sitemap.xml (base ${BASE})`);
