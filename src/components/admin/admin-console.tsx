"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  RotateCcw,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  History,
} from "lucide-react";
import type { AdminSearchResponse, AuditLogEntry } from "@/lib/types";

interface Props {
  email: string;
  initialLog: AuditLogEntry[];
  signOutAction: () => Promise<void>;
}

const PAGE_SIZE = 50;

export function AdminConsole({ email, initialLog, signOutAction }: Props) {
  const t = useTranslations("admin");

  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("");
  const [circle, setCircle] = useState("");
  const [submissionType, setSubmissionType] = useState("");
  const [page, setPage] = useState(1);
  const [unmask, setUnmask] = useState(false);
  const [data, setData] = useState<AdminSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(
    async (pageArg: number) => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query || undefined,
            zone: zone || undefined,
            circle: circle || undefined,
            submissionType: submissionType || undefined,
            page: pageArg,
            pageSize: PAGE_SIZE,
          }),
          cache: "no-store",
        });
        if (res.ok) {
          const json = (await res.json()) as AdminSearchResponse;
          setData(json);
          setPage(json.page);
        }
      } finally {
        setLoading(false);
      }
    },
    [query, zone, circle, submissionType],
  );

  // Initial load.
  useEffect(() => {
    void runSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setQuery("");
    setZone("");
    setCircle("");
    setSubmissionType("");
    setPage(1);
    setTimeout(() => void runSearchFresh(), 0);
  }

  // reset() clears filters then searches with empty filters.
  async function runSearchFresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: 1, pageSize: PAGE_SIZE }),
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as AdminSearchResponse;
        setData(json);
        setPage(1);
      }
    } finally {
      setLoading(false);
    }
  }

  function doExport(format: "csv" | "xlsx") {
    const params = new URLSearchParams({ format, unmask: String(unmask) });
    if (query) params.set("query", query);
    if (zone) params.set("zone", zone);
    if (circle) params.set("circle", circle);
    if (submissionType) params.set("submissionType", submissionType);
    const a = document.createElement("a");
    a.href = `/api/admin/export?${params.toString()}`;
    a.click();
  }

  const pages = data?.pages ?? 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Console header */}
      <div className="mb-6 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-paper">
            <ShieldCheck aria-hidden className="h-6 w-6 text-jade" />
            {t("consoleTitle")}
          </h1>
          <p className="mt-1 text-sm text-mute">
            {t("signedInAs", { email })}
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-paper/80 hover:border-jade/60 hover:text-jade"
          >
            <LogOut aria-hidden className="h-4 w-4" />
            {t("signOut")}
          </button>
        </form>
      </div>

      {/* Filters */}
      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper">
          {t("browseTitle")}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(1);
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="lg:col-span-2">
            <label htmlFor="q" className="sr-only">
              {t("searchPlaceholder")}
            </label>
            <input
              id="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-md border border-line bg-ink-2/70 px-3 py-2.5 text-sm text-paper outline-none focus:border-jade"
            />
          </div>
          <select
            aria-label={t("filterZone")}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="rounded-md border border-line bg-ink-2/70 px-3 py-2.5 text-sm text-paper outline-none focus:border-jade"
          >
            <option value="">{t("allZones")}</option>
            {data?.zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <select
            aria-label={t("filterType")}
            value={submissionType}
            onChange={(e) => setSubmissionType(e.target.value)}
            className="rounded-md border border-line bg-ink-2/70 px-3 py-2.5 text-sm text-paper outline-none focus:border-jade"
          >
            <option value="">{t("allTypes")}</option>
            {data?.submissionTypes.map((ty) => (
              <option key={ty} value={ty}>
                {ty}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-nbr-green px-4 py-2 text-sm font-semibold text-paper hover:bg-jade hover:text-ink"
            >
              <Search aria-hidden className="h-4 w-4" />
              {t("search")}
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-paper/80 hover:border-jade/60 hover:text-jade"
            >
              <RotateCcw aria-hidden className="h-4 w-4" />
              {t("reset")}
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-mute">
                <input
                  type="checkbox"
                  checked={unmask}
                  onChange={(e) => setUnmask(e.target.checked)}
                  className="h-4 w-4 accent-stamp"
                />
                {t("unmaskLabel")}
              </label>
              <button
                type="button"
                onClick={() => doExport("csv")}
                className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-paper/80 hover:border-jade/60 hover:text-jade"
              >
                <Download aria-hidden className="h-4 w-4" />
                {t("exportCsv")}
              </button>
              <button
                type="button"
                onClick={() => doExport("xlsx")}
                className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-paper/80 hover:border-jade/60 hover:text-jade"
              >
                <Download aria-hidden className="h-4 w-4" />
                {t("exportXlsx")}
              </button>
            </div>
          </div>
        </form>
        <p className="mt-3 text-xs text-mute">{t("maskNote")}</p>
      </section>

      {/* Results */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm text-mute">
          <span>
            {data
              ? t("resultsCount", {
                  count: data.rows.length,
                  total: data.total,
                })
              : t("loading")}
          </span>
          {loading && <span className="animate-pulse text-jade">●</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-mute">
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("colTin")}
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  {t("colZone")}
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  {t("colCircle")}
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  {t("colType")}
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  {t("colAy")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data && data.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-mute">
                    {t("noResults")}
                  </td>
                </tr>
              )}
              {data?.rows.map((r, i) => (
                <tr
                  key={`${r.serial}-${i}`}
                  className="border-b border-line/40 hover:bg-ink-2/40"
                >
                  <td className="px-5 py-2.5 font-mono tabular-nums text-paper">
                    {r.tinMasked}
                  </td>
                  <td className="px-3 py-2.5 text-paper/85">{r.zone}</td>
                  <td className="px-3 py-2.5 font-mono text-paper/85">
                    {r.circle}
                  </td>
                  <td className="px-3 py-2.5 text-paper/85">
                    {r.submissionType}
                  </td>
                  <td className="px-3 py-2.5 text-paper/70">
                    {r.assessmentYear}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => void runSearch(page - 1)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-paper/80 hover:text-jade disabled:opacity-40"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
              {t("prev")}
            </button>
            <span className="text-mute">{t("page", { page, pages })}</span>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => void runSearch(page + 1)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-paper/80 hover:text-jade disabled:opacity-40"
            >
              {t("next")}
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* Audit log */}
      <section className="card mt-6 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-paper">
          <History aria-hidden className="h-5 w-5 text-jade" />
          {t("auditLogTitle")}
        </h2>
        {initialLog.length === 0 ? (
          <p className="mt-3 text-sm text-mute">—</p>
        ) : (
          <ul className="mt-3 space-y-2 text-xs">
            {initialLog.map((e, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/40 pb-2 text-mute"
              >
                <span className="font-mono text-paper/70">
                  {new Date(e.at).toLocaleString()}
                </span>
                <span className="rounded bg-ink-2 px-1.5 py-0.5 text-jade">
                  {e.action}
                </span>
                <span className="text-paper/70">{e.actor}</span>
                <span>· {e.rowCount} rows</span>
                {e.unmasked && (
                  <span className="text-stamp">· unmasked</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
