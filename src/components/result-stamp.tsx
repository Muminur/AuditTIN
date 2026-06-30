"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import type { PublicRecord, LookupMeta } from "@/lib/types";
import { formatTinGroups } from "@/lib/utils";

interface ResultStampProps {
  status: "selected" | "not_selected";
  tin: string;
  record?: PublicRecord;
  meta: LookupMeta;
}

export function ResultStamp({ status, tin, record, meta }: ResultStampProps) {
  const t = useTranslations("result");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const selected = status === "selected";

  return (
    <motion.section
      aria-live="polite"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card relative overflow-hidden p-6 sm:p-8"
    >
      {/* Stamp impression */}
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2
            className={`flex items-center gap-2 font-display text-2xl font-semibold ${
              selected ? "text-stamp" : "text-jade"
            }`}
          >
            {selected ? (
              <AlertTriangle aria-hidden className="h-6 w-6" />
            ) : (
              <CheckCircle2 aria-hidden className="h-6 w-6" />
            )}
            {selected ? t("selectedTitle") : t("notSelectedTitle")}
          </h2>
          <p className="max-w-prose text-sm text-paper/80">
            {selected ? t("selectedBody") : t("notSelectedBody")}
          </p>
        </div>

        <motion.div
          initial={reduce ? false : { scale: 1.5, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: -4, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1.2] }}
          className={`shrink-0 select-none rounded-lg border-2 px-4 py-2 font-display text-sm font-bold uppercase tracking-widest ${
            selected
              ? "border-stamp text-stamp"
              : "border-jade text-jade"
          }`}
          style={{ textShadow: "0 1px 0 rgba(0,0,0,0.2)" }}
        >
          {selected ? t("selectedTitle") : t("notSelectedTitle")}
        </motion.div>
      </div>

      {/* Entered TIN (inline only — never stored or in the URL). */}
      <div className="mt-6 rounded-md border border-line bg-ink/50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-mute">
          {t("fieldTin")}
        </p>
        <p className="font-mono text-lg tabular-nums text-paper">
          {formatTinGroups(tin)}
        </p>
      </div>

      {/* Record fields (only when selected). */}
      {selected && record && (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("fieldZone")} value={record.zone} />
          <Field label={t("fieldCircle")} value={record.circle} />
          <Field label={t("fieldType")} value={record.submissionType} />
          <Field label={t("fieldAY")} value={record.assessmentYear} />
        </dl>
      )}

      {/* What this means */}
      <div
        className={`mt-6 rounded-md border-l-2 bg-ink-2/40 p-4 ${
          selected ? "border-stamp" : "border-jade"
        }`}
      >
        <h3 className="font-display text-sm font-semibold text-paper">
          {selected ? t("nextStepsSelected") : t("nextStepsNotSelected")}
        </h3>
        <p className="mt-1 text-sm text-paper/75">
          {selected
            ? t("nextStepsSelectedBody")
            : t("nextStepsNotSelectedBody")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-mute">
          <a
            href="https://nbr.gov.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-jade hover:underline"
          >
            {t("verifyWithNbr")}
            <ExternalLink aria-hidden className="h-3 w-3" />
          </a>
          <span>
            {t("asOf", {
              date: new Intl.DateTimeFormat(
                locale === "bn" ? "bn-BD" : "en-GB",
                { dateStyle: "medium" },
              ).format(new Date(meta.publishedAt)),
            })}
          </span>
        </div>
      </div>
    </motion.section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-ink/40 px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-mute">{label}</dt>
      <dd className="mt-0.5 font-medium text-paper">{value}</dd>
    </div>
  );
}
