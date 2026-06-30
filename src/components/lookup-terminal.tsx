"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { Search, RotateCcw, ShieldCheck, AlertCircle } from "lucide-react";
import { TinInput, type TinStatus } from "./tin-input";
import { ResultStamp } from "./result-stamp";
import type { LookupResponse, LookupMeta, PublicRecord } from "@/lib/types";

type Phase = "idle" | "busy" | "done";
type Outcome =
  | { status: "selected"; record: PublicRecord; meta: LookupMeta }
  | { status: "not_selected"; meta: LookupMeta };

/** Pure, client-side TIN classification (avoids pulling Zod into the bundle). */
function classify(raw: string):
  | { ok: true; tin: string }
  | { ok: false; reason: "empty" | "non_digit" | "length"; count: number } {
  const v = raw.trim();
  if (v.length === 0) return { ok: false, reason: "empty", count: 0 };
  if (!/^\d+$/.test(v))
    return { ok: false, reason: "non_digit", count: v.replace(/\D/g, "").length };
  if (v.length !== 12) return { ok: false, reason: "length", count: v.length };
  return { ok: true, tin: v };
}

export function LookupTerminal() {
  const t = useTranslations("home");
  const te = useTranslations("errors");

  const [tin, setTin] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submittedTin, setSubmittedTin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hintId = "tin-hint";

  const inFlight = useRef(false);

  function errorFor(reason: "empty" | "non_digit" | "length", count: number) {
    if (reason === "empty") return te("tinEmpty");
    if (reason === "non_digit") return te("tinNonDigit");
    return te("tinTooShort", { count });
  }

  async function submit() {
    if (inFlight.current) return;
    const cls = classify(tin);
    if (!cls.ok) {
      setError(errorFor(cls.reason, cls.count));
      setPhase("idle");
      setOutcome(null);
      return;
    }

    setError(null);
    setOutcome(null);
    setPhase("busy");
    inFlight.current = true;

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tin: cls.tin }),
        cache: "no-store",
      });

      if (res.status === 429) {
        const data = (await res.json().catch(() => null)) as {
          retryAfter?: number;
        } | null;
        setError(te("rateLimited", { seconds: data?.retryAfter ?? 60 }));
        setPhase("idle");
        return;
      }

      const data = (await res.json()) as LookupResponse;
      if (data.status === "selected" || data.status === "not_selected") {
        // Briefly hold the scan animation so it reads as a deliberate check.
        setSubmittedTin(cls.tin);
        setOutcome(data);
        setPhase("done");
      } else if (data.status === "invalid") {
        setError(errorFor(data.reason, cls.tin.length));
        setPhase("idle");
      } else {
        setError(te("server"));
        setPhase("idle");
      }
    } catch {
      setError(te("network"));
      setPhase("idle");
    } finally {
      inFlight.current = false;
    }
  }

  function reset() {
    setTin("");
    setOutcome(null);
    setError(null);
    setPhase("idle");
    setSubmittedTin("");
  }

  const tinStatus: TinStatus =
    phase === "busy"
      ? "busy"
      : error
        ? "error"
        : outcome?.status === "selected"
          ? "selected"
          : outcome?.status === "not_selected"
            ? "not_selected"
            : "idle";

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="card relative overflow-hidden p-6 sm:p-8"
      >
        <div className="space-y-2 text-center">
          <label className="block font-display text-sm font-medium text-paper">
            {t("tinLabel")}
          </label>
        </div>

        <div className="relative mt-4">
          <TinInput
            value={tin}
            onChange={(v) => {
              setTin(v);
              if (error) setError(null);
            }}
            onComplete={() => void submit()}
            disabled={phase === "busy"}
            status={tinStatus}
            label={t("tinLabel")}
            describedById={hintId}
          />

          {/* Scan sweep on submit (CSS handles reduced-motion). */}
          {phase === "busy" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden"
            >
              <div className="animate-scan h-1 w-full bg-gradient-to-r from-transparent via-jade to-transparent shadow-[0_0_12px_2px_var(--color-jade)]" />
            </div>
          )}
        </div>

        <p
          id={hintId}
          className="mt-3 text-center text-xs text-mute"
        >
          {t("tinHint")}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-center justify-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-200"
          >
            <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="submit"
            disabled={phase === "busy" || tin.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-nbr-green px-6 py-3 font-display font-semibold text-paper transition-all hover:bg-jade hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {phase === "busy" ? (
              <>
                <ShieldCheck aria-hidden className="h-5 w-5 animate-pulse" />
                {t("verifying")}
              </>
            ) : (
              <>
                <Search aria-hidden className="h-5 w-5" />
                {t("verify")}
              </>
            )}
          </button>

          {(outcome || tin.length > 0) && phase !== "busy" && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-5 py-3 font-medium text-paper/80 transition-colors hover:border-jade/60 hover:text-jade"
            >
              <RotateCcw aria-hidden className="h-4 w-4" />
              {outcome ? t("checkAnother") : t("clear")}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-mute">{t("privacyNote")}</p>
      </form>

      <AnimatePresence mode="wait">
        {phase === "done" && outcome && (
          <ResultStamp
            key={submittedTin + outcome.status}
            status={outcome.status}
            tin={submittedTin}
            record={outcome.status === "selected" ? outcome.record : undefined}
            meta={outcome.meta}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
