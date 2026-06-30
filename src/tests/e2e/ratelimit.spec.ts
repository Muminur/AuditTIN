import { test, expect } from "@playwright/test";

// Default limit is 10/min; the 11th request from one connection should 429.
// (In-memory fallback in dev/preview; Upstash sliding window in prod.)
test("lookup endpoint rate-limits rapid requests", async ({ request }) => {
  const tin = "111111111111";
  let sawRateLimit = false;
  let lastRetryAfter = "";

  for (let i = 0; i < 14; i++) {
    const res = await request.post("/api/lookup", { data: { tin } });
    if (res.status() === 429) {
      sawRateLimit = true;
      lastRetryAfter = res.headers()["retry-after"] ?? "";
      break;
    }
  }

  expect(sawRateLimit).toBe(true);
  expect(Number(lastRetryAfter)).toBeGreaterThan(0);
});

test("lookup rejects GET (TIN never in a URL)", async ({ request }) => {
  const res = await request.get("/api/lookup?tin=111111111111");
  expect(res.status()).toBe(405);
});
