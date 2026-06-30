import { getMeta } from "@/lib/meta";
import type { HealthPayload } from "@/lib/types";

export const runtime = "edge";

export function GET(): Response {
  const meta = getMeta();
  const payload: HealthPayload = {
    ok: true,
    count: meta.count,
    assessmentYear: meta.assessmentYear,
    publishedAt: meta.publishedAt,
    sha256: meta.sha256,
    buildSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    sample: meta.sample,
  };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
