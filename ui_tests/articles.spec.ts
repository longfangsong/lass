import { test, expect } from "@playwright/test";

test("can see articles", async ({ page }) => {
  await page.goto("/articles");
  await page.waitForSelector("main > div > ul > li");
  expect(page.locator("main > div > ul > li")).toHaveCount(10);
  const firstArticle = page.locator("main > div > ul > li").first();
  expect(firstArticle).toContainText(
    "Landshövdingen i Stockholm har fått sparken av regeringen",
  );
  await firstArticle.click();
  await page.waitForSelector("main h1");
  expect(page.locator("main h1")).toContainText(
    "Landshövdingen i Stockholm har fått sparken av regeringen",
  );
  const sentences = page.locator("main > div > div");
  expect(await sentences.count()).toBeGreaterThan(2);
  const firstSentence = sentences.first();
  expect(firstSentence).toContainText(
    "Landshövdingen i Stockholm Anna Kinberg Batra har fått sparken från sitt jobb.",
  );
  const sittElement = firstSentence.locator("a").nth(10);
  expect(sittElement).toHaveText("sitt");
  await sittElement.click();
});

test("can query words", async ({ page }) => {
  await page.goto("/articles/165eaf64-6e5a-424d-839f-b2fbf6e0ea0a");
  const sentences = page.locator("main > div > div");
  const firstSentence = sentences.first();
  expect(firstSentence).toContainText(
    "Landshövdingen i Stockholm Anna Kinberg Batra har fått sparken från sitt jobb.",
  );
  const sittElement = firstSentence.locator("a").nth(10);
  expect(sittElement).toHaveText("sitt");
  await sittElement.click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  const firstLemma = dialog.locator("h2").first();
  await expect(firstLemma).toContainText("sin");
});
