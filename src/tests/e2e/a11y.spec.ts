import { test, expect } from "@playwright/test";

const PAGES = ["/", "/statistics", "/about", "/faq", "/privacy"];

for (const path of PAGES) {
  test(`a11y smoke: ${path}`, async ({ page }) => {
    await page.goto(path);

    // Exactly one h1 per page.
    await expect(page.locator("h1")).toHaveCount(1);

    // A single main landmark.
    await expect(page.locator("main#main")).toBeVisible();

    // html lang is set (English on the default-locale routes).
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // Skip link is the first focusable element.
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(
      () => document.activeElement?.textContent ?? "",
    );
    expect(focused.toLowerCase()).toContain("skip");
  });
}

test("home TIN input is fully keyboard operable", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator('input[inputmode="numeric"]');
  await cells.first().focus();
  await page.keyboard.type("12");
  // Focus should have advanced; typing fills sequential cells.
  await expect(cells.nth(0)).toHaveValue("1");
  await expect(cells.nth(1)).toHaveValue("2");
  // The group exposes an accessible name.
  await expect(
    page.getByRole("group", { name: /taxpayer identification number/i }),
  ).toBeVisible();
});

test("language toggle switches to Bangla", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /switch language to বাংলা/i }).click();
  await expect(page).toHaveURL(/\/bn$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
});
