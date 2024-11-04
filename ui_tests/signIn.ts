import { Page } from "@playwright/test";

export async function signIn(page: Page, userId: string) {
  await page.goto("/");
  await page.getByText("Sign in").click();
  await page
    .locator("#input-email-for-password-provider")
    .waitFor({ state: "visible" });
  await page
    .locator("#input-email-for-password-provider")
    .fill(`test${userId}@test.com`);
  await page
    .locator("#input-password-for-password-provider")
    .fill("developer-password");
  await page.locator("#submitButton").click();
}
