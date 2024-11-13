import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Läss");
});

test("Articles link directs to /articles", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Articles");

  await expect(page).toHaveURL("/articles");
});

test("Dictionary link directs to /dictionary", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Dictionary");

  await expect(page).toHaveURL("/dictionary");
});
