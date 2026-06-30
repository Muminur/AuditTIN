"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Users, Map, Building2 } from "lucide-react";
import type { StatsPayload } from "@/lib/types";
import { formatCount } from "@/lib/utils";

const BAR_COLORS = ["#2FBF8F", "#006A4E", "#F4B740"];

export function StatsCharts({ stats }: { stats: StatsPayload }) {
  const t = useTranslations("stats");
  const locale = useLocale();

  const zoneData = stats.byZone.map((z) => ({
    name: z.label.replace(/^Taxes Zone-?/i, "Z").replace(", ", " "),
    full: z.label,
    count: z.count,
  }));

  const total = stats.totalSelected;

  return (
    <div className="space-y-10">
      {/* Headline counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Counter
          icon={<Users aria-hidden className="h-5 w-5" />}
          label={t("totalSelected")}
          value={formatCount(stats.totalSelected, locale)}
        />
        <Counter
          icon={<Map aria-hidden className="h-5 w-5" />}
          label={t("zonesCovered")}
          value={formatCount(stats.zonesCount, locale)}
        />
        <Counter
          icon={<Building2 aria-hidden className="h-5 w-5" />}
          label={t("circlesCovered")}
          value={formatCount(stats.circlesCount, locale)}
        />
      </div>

      {/* Zone bar chart */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-paper">
          {t("byZoneTitle")}
        </h2>
        <p className="mt-1 text-sm text-mute">{t("byZoneSubtitle")}</p>
        <div className="mt-5 h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={zoneData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
            >
              <XAxis
                type="number"
                stroke="#8FA89C"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#1D3B31" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#8FA89C"
                fontSize={11}
                width={64}
                tickLine={false}
                axisLine={{ stroke: "#1D3B31" }}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "rgba(47,191,143,0.08)" }}
                contentStyle={{
                  background: "#0F2A22",
                  border: "1px solid #1D3B31",
                  borderRadius: 8,
                  color: "#F5F7F4",
                  fontSize: 13,
                }}
                formatter={(value: number) => [
                  formatCount(value, locale),
                  t("tableCount"),
                ]}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.full ?? ""
                }
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {zoneData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top circles table */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-paper">
            {t("topCirclesTitle")}
          </h2>
          <p className="mt-1 text-sm text-mute">{t("topCirclesSubtitle")}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-mute">
                  <th scope="col" className="py-2 pr-2 font-medium">
                    {t("tableZone")}
                  </th>
                  <th scope="col" className="py-2 pr-2 font-medium">
                    {t("tableCircle")}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    {t("tableCount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topCircles.map((c, i) => (
                  <tr
                    key={`${c.zone}-${c.circle}-${i}`}
                    className="border-b border-line/50"
                  >
                    <td className="py-2 pr-2 text-paper/85">{c.zone}</td>
                    <td className="py-2 pr-2 font-mono text-paper/85">
                      {c.circle}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums text-jade">
                      {formatCount(c.count, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* By submission type */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-paper">
            {t("byTypeTitle")}
          </h2>
          <ul className="mt-4 space-y-4">
            {stats.byType.map((typeRow, i) => {
              const pct = total > 0 ? (typeRow.count / total) * 100 : 0;
              return (
                <li key={typeRow.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-paper/85">{typeRow.label}</span>
                    <span className="tabular-nums text-mute">
                      {formatCount(typeRow.count, locale)} ·{" "}
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <p className="text-center text-xs text-mute">{t("countOnlyNote")}</p>
    </div>
  );
}

function Counter({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-nbr-green/20 text-jade">
        {icon}
      </span>
      <div>
        <div className="font-display text-2xl font-bold tabular-nums text-paper">
          {value}
        </div>
        <div className="text-xs uppercase tracking-wide text-mute">{label}</div>
      </div>
    </div>
  );
}
