# PLANNING.md — Audit Status Portal

> Strategic companion to the PRD. The PRD (`PRD_Audit_Status_Portal.md`) is the full spec; this file is **how we build it, in what order, and why**. Task-level breakdown lives in `TASKS.md`.

---

## 1. Vision
Turn the NBR 129-page audit-selection PDF (AY 2023-2024, ~5,014 individuals) into a fast, private, bilingual web terminal where a person types their 12-digit TIN and learns in under a second whether they were selected — with the handling zone and circle — without making mass enumeration any easier than the already-public PDF.

## 2. Scope
**In (v1):** single-TIN exact-match lookup, public aggregate statistics (no TINs), about/FAQ/privacy, authenticated official console (browse/filter/export + audit log), bilingual বাংলা/English.
**Out (v1):** filing/payment/appeals, taxpayer accounts/login, any PII beyond the published list, shareable TIN-bearing URLs, being the system of record.

## 3. Architecture at a glance
Dataset is tiny (~5k rows, <500 KB), so the public path uses **no database**:

```
git push → Vercel build → ingest.ts (CSV/PDF → normalize → validate)
         → data/audit-2023-2024.json (TIN-keyed) + meta.json + stats.json  (bundled)

Edge POST /api/lookup  →  Map.get(tin)  (O(1), no DB, no cold start)   ┐
Edge /api/stats   →  cached aggregate (no TINs)                        ├─ Vercel KV (Upstash):
Node /api/admin/* →  auth + full search/export + audit log            ┘   rate limits, counters, audit log

Functions pinned to sin1 (Singapore) / bom1 (Mumbai) for BD latency.
```

**Upgrade path:** swap bundled JSON → Vercel Postgres/Neon behind the same API contract if writes, history, or >100k rows are ever needed. Frontend unchanged.

## 4. Tech stack (condensed)
Next.js 15 (App Router, RSC) · React 19 · TypeScript 5 strict · Tailwind v4 (`@theme` tokens) · Radix-grade components · Framer Motion · next-intl (bn/en) · Zod · Vercel KV + @upstash/ratelimit · Auth.js v5 (admin) · SheetJS (export) · Recharts (stats) · Vitest + Playwright · Vercel hosting (`sin1`). Full table in PRD §9.

## 5. Data flow
1. Source export lands in `/source` (CSV preferred over the PDF).
2. `prebuild` runs `ingest.ts`: parse → normalize zones (fix PDF line-wraps + casing) → Zod-validate (reject + report) → dedupe by TIN → emit TIN-keyed JSON + meta (sha256, count) + stats (counts only).
3. Build bundles the JSON; Edge lookup reads it as an in-memory map.
4. CI gate blocks the build on row-count drift / schema failure.

## 6. Key engineering decisions & rationale
| Decision | Why |
|---|---|
| **No DB on public path; bundled TIN-keyed JSON + Edge** | 5k rows → O(1) map read, zero DB cold-start, lowest latency, cheapest ops. |
| **Build-time ingestion, idempotent** | Data only changes when NBR republishes; regenerate deterministically with a CI gate. |
| **Exact 12-digit match only (no partial/wildcard/autocomplete)** | The defining privacy control — serves the single self-check without enabling enumeration. |
| **Lookup is POST, not GET** | Keeps the TIN out of URLs, query strings, history, referrers and access logs — a stronger reading of the privacy guardrail than the literal verb. |
| **No public bulk endpoint; aggregates count-only** | Don't lower the surveillance barrier below the public PDF. |
| **TIN never in URL/history/server logs; result inline** | Prevents accidental disclosure / shareable status pages. |
| **KV only for cross-request state** | Edge can't hold rate-limit/audit state in memory. |
| **Region pin sin1/bom1** | User base is in Bangladesh; minimize round-trip. |
| **Bilingual first-class (bn/en)** | Audience is Bangla-first; not an afterthought. |
| **Static `public/robots.txt` + `sitemap.xml`** | Avoids the `[locale]` dynamic-segment collision that 404s app-root metadata routes. |

## 7. Build sequence (maps to TASKS.md)
- **Phase 0 — Setup:** scaffold, tokens, fonts, i18n, lint, `vercel.json`.
- **M0 — Data:** types, Zod, `ingest.ts`, normalization, JSON/meta/stats, CI gate. *(Unblocks everything.)*
- **M1 — Core lookup:** `data.ts`, ratelimit, `/api/lookup`, `/api/health`, segmented TIN input + result stamp, home terminal, motion, a11y.
- **M2 — Public surfaces:** `/api/stats`, charts, `/statistics`, `/about`, `/faq`, `/privacy`, lang toggle, footer, SEO/robots.
- **M3 — Admin:** auth, search API, browse UI, export, audit log, masking.
- **M4 — Harden & ship:** KV, WAF, analytics, tests, region pin, prod deploy, Lighthouse.

Critical path: **M0 → M1** delivers the core value; M2–M4 layer on insight, governance, and hardening.

## 8. Environments & deployment
- **Preview:** every PR auto-deploys (Vercel). **Production:** merge to `main`.
- **Region:** `sin1` (functions). **Node:** 22.x (admin); Edge runtime for public routes.
- **Env vars:** see `.env.example` (KV creds auto-injected by the Vercel KV integration; `AUTH_SECRET`, `ADMIN_EMAIL_ALLOWLIST`, `ADMIN_PASSWORD`, rate-limit knobs, `NEXT_PUBLIC_*`).
- **Add-ons:** Vercel KV, Analytics, Speed Insights, WAF.

## 9. Definition of Done
**Per task:** code + types pass `strict`; Zod-validated inputs; no TIN logged; relevant test(s) green; box ticked in `TASKS.md`; ≤1-sentence entry added to the Technical Summary Log in `CLAUDE.md`.
**Per phase:** exit criteria in PRD §16 met.
**Quality floor (all UI):** responsive to 320px, visible keyboard focus, AA contrast, reduced-motion respected, bilingual.

## 10. Conventions
- Branch per task; small, focused commits.
- File structure per PRD §14; shared types in `src/lib/types.ts`; all external input through Zod.
- Privacy guardrails in `CLAUDE.md` are non-negotiable — no feature may weaken them.

## 11. Risks (summary — full list in PRD §15)
- Legal sign-off on a public mirror of the list (Q1) — drives branding/disclaimer.
- PDF parsing fragility → prefer CSV input + CI row-count gate (R1).
- Scraping → rate limit + WAF + no bulk endpoint (R2).
- Misinterpretation of stale results → persistent disclaimer + dataset date (R3).

## 12. Note on data in this repository
The real NBR publication is **not** redistributed here. `scripts/generate-sample.ts`
emits a deterministic, clearly-labelled synthetic dataset (~5,014 fabricated
records matching the real list's shape) so the pipeline, APIs, and UI work
end-to-end. Drop the real CSV/PDF into `/source` and rebuild to switch.
