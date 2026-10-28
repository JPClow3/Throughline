import type { Page } from "@playwright/test";

export type CompleteOnboardingOptions = {
  project?: string;
  task?: string;
  /** Check the “Open Settings next…” toggle on the last step. */
  openSyncSettings?: boolean;
  /** When false, throw if the wizard never appears (default true = soft skip). */
  optional?: boolean;
};

/**
 * Drive the first-run setup wizard to completion.
 * Returns false when the overlay is already gone (returning user / seeded DB).
 */
export async function completeOnboarding(
  page: Page,
  options: CompleteOnboardingOptions = {}
): Promise<boolean> {
  const heading = page.getByRole("heading", { name: /What are you planning for/i });
  const visible = await heading.waitFor({ state: "visible", timeout: 10_000 }).then(() => true).catch(() => false);
  if (!visible) {
    if (options.optional === false) {
      throw new Error("Onboarding overlay did not appear");
    }
    return false;
  }

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Course 1").fill(options.project ?? "Biology");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("First task").fill(options.task ?? "Review biology notes");
  await page.getByRole("button", { name: "Next" }).click();
  if (options.openSyncSettings) {
    await page.getByLabel("Open Settings next so I can enable encrypted sync").check();
  }
  await page.getByRole("button", { name: /Finish setup/i }).click();
  await page.locator(".onboarding-backdrop").waitFor({ state: "hidden", timeout: 10_000 });
  return true;
}
