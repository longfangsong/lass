import { test, expect, TestInfo } from "@playwright/test";
import { signIn } from "./signIn";

function randomUsername(length = 8) {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

test("can add a review progress", async ({ page }, testInfo: TestInfo) => {
  await signIn(page, randomUsername());

  await page.goto("/word_book");
  await page.waitForSelector("main table");
  let rows = page.getByTestId("table-row-element");
  await expect(rows).toHaveCount(0);

  await page.goto("/articles/165eaf64-6e5a-424d-839f-b2fbf6e0ea0a");
  const sentences = page.locator("main > div > div");
  const firstSentence = sentences.first();
  const sittElement = firstSentence.locator("a").nth(10);
  await sittElement.click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  const buttons = dialog.locator("button");
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toBeDisabled({ timeout: 5000 });

  await page.goto("/word_book");
  await page.waitForSelector("main table");
  rows = page.getByTestId("table-row-element");
  await expect(rows).toHaveCount(1);
  const row = rows.first();
  const firstColumn = row.locator("td").first();
  await expect(firstColumn).toContainText("sin");
  await expect(row.locator("td").nth(1)).toContainText("Nu");
  await expect(row.locator("td").nth(2)).toContainText("0");
});

test("can review", async ({ page, browserName }, testInfo: TestInfo) => {
  await page.clock.install({ time: new Date() });
  await signIn(page, randomUsername());
  await page.goto("/articles/165eaf64-6e5a-424d-839f-b2fbf6e0ea0a");

  const sentences = page.locator("main > div > div");
  const firstSentence = sentences.first();
  const sittElement = firstSentence.locator("a").nth(10);
  await sittElement.click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  const buttons = dialog.locator("button");
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toBeDisabled({ timeout: 5000 });

  await page.goto("/word_book");
  await page.waitForSelector("main table");
  const rows = page.getByTestId("table-row-element");
  const row = rows.first();
  await row.locator("button").nth(1).click();
  await expect(row.locator("button").nth(1)).toBeDisabled({ timeout: 5000 });
  await expect(row.locator("td").nth(1)).toContainText("I en dag");
  await expect(row.locator("td").nth(2)).toContainText("1");

  await page.clock.fastForward("23:00:00");
  await expect(row.locator("td").nth(1)).toContainText("en timme");
  await page.clock.fastForward("01:00:00");
  await expect(row.locator("td").nth(1)).toContainText("Nu");
  await row.locator("button").nth(1).click();
  await expect(row.locator("button").nth(1)).toBeDisabled({ timeout: 5000 });
  await expect(row.locator("td").nth(1)).toContainText("tre dagar");
  await expect(row.locator("td").nth(2)).toContainText("2");

  const timeAndExpected = [
    { time: 3, text: "sju dagar", level: "3" },
    { time: 7, text: "15 dagar", level: "4" },
    { time: 15, text: "en månad", level: "5" },
    { time: 30, text: "Done!", level: "6" },
  ];

  for (const { time, text, level } of timeAndExpected) {
    for (let i = 0; i < time; i++) {
      await page.clock.fastForward("24:00:00");
    }
    await expect(row.locator("td").nth(1)).toContainText("Nu");
    await row.locator("button").nth(1).click();
    await expect(row.locator("button").nth(1)).toBeDisabled({ timeout: 5000 });
    await expect(row.locator("td").nth(1)).toContainText(text);
    await expect(row.locator("td").nth(2)).toContainText(level);
  }

  await page.clock.fastForward("01:00:00");
  await expect(row.locator("button").nth(1)).toBeDisabled({ timeout: 5000 });
});
