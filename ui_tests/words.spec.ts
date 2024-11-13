import { test, expect } from "@playwright/test";

test("can search words", async ({ page }) => {
  await page.goto("/dictionary");
  await page.fill("main input", "äppl");
  await page.waitForTimeout(1000);
  await page.press("input", "Enter");
  await page.waitForSelector("table tr");
  const tableRow = page
    .locator("table tr")
    .filter({ hasText: "äpple" })
    .first();
  await expect(tableRow.locator("td").first()).toHaveText("äpple");
  await expect(tableRow.locator("td").nth(1)).toContainText("apple");
  await tableRow.click();
  const dialog = page.locator("role=dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/\[.*\]/);
  await expect(dialog).toContainText("subst.");
  await expect(dialog).toContainText('"äpple" är ett ett-ord');
  await expect(dialog).toContainText("ett grönt äpple");
  await expect(dialog).toContainText("apple");
  await expect(dialog.locator("table")).toBeVisible();
  const rows = dialog.locator("table tbody tr");
  await expect(rows.nth(0).locator("td").nth(1)).toHaveText("äpple");
  await expect(rows.nth(0).locator("td").nth(2)).toHaveText("äpplet");
  await expect(rows.nth(1).locator("td").nth(1)).toHaveText("äpplen");
  await expect(rows.nth(1).locator("td").nth(2)).toHaveText("äpplena");
});
