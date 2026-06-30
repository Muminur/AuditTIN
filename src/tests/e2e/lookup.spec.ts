import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Read a real selected TIN from the bundled dataset (test runs in Node).
const dataset = JSON.parse(
  readFileSync(
    new URL("../../../data/audit-2023-2024.json", import.meta.url),
    "utf8",
  ),
) as Record<string, unknown>;
const SELECTED_TIN = Object.keys(dataset)[0]!;
const ABSENT_TIN = "000000000000";

async function fillTin(
  cells: ReturnType<import("@playwright/test").Page["locator"]>,
  tin: string,
) {
  for (let i = 0; i < tin.length; i++) {
    await cells.nth(i).fill(tin[i]!);
  }
}

test("happy path: a selected TIN shows the SELECTED stamp", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator('input[inputmode="numeric"]');
  await expect(cells).toHaveCount(12);
  await fillTin(cells, SELECTED_TIN);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByText(/selected for audit/i).first()).toBeVisible();
  // Record fields should be present for a selection.
  await expect(page.getByText(/tax zone/i).first()).toBeVisible();
});

test("a TIN not on the list shows NOT ON THE LIST", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator('input[inputmode="numeric"]');
  await fillTin(cells, ABSENT_TIN);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByText(/not on the list/i).first()).toBeVisible();
});

test("an incomplete TIN shows a directive validation error", async ({
  page,
}) => {
  await page.goto("/");
  const cells = page.locator('input[inputmode="numeric"]');
  await fillTin(cells, "123");
  await page.getByRole("button", { name: /verify/i }).click();
  // Target the error paragraph specifically (the hint text also says "12 digits").
  await expect(page.locator('p[role="alert"]')).toContainText(/12 digits/i);
});

test("the TIN never appears in the URL", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator('input[inputmode="numeric"]');
  await fillTin(cells, SELECTED_TIN);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByText(/selected for audit/i).first()).toBeVisible();
  expect(page.url()).not.toContain(SELECTED_TIN);
});
