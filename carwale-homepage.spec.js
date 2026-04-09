const { test, expect } = require('@playwright/test');

test.describe('CarWale homepage UI checks', () => {
  test('searches Punch from finder and opens details page', async ({ page }) => {
    test.setTimeout(90 * 1000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Best-effort close for optional overlays/popups if present.
    const closeCandidates = [
      page.getByRole('button', { name: /close/i }),
      page.locator('[aria-label*="close" i]'),
      page.locator('button:has-text("No Thanks")'),
    ];
    for (const candidate of closeCandidates) {
      if (await candidate.first().isVisible().catch(() => false)) {
        await candidate.first().click().catch(() => {});
      }
    }

    await expect(page).toHaveURL(/carwale\.com/i);

    const brandLogo = page.locator('img[alt*="carwale" i], img[src*="carwale"]');
    await expect(brandLogo.first()).toBeVisible();

    const topNav = page.locator('header, [role="banner"]').first();
    await expect(topNav.getByText(/^new cars$/i)).toBeVisible();
    await expect(topNav.getByText(/^used cars$/i)).toBeVisible();
    await expect(topNav.getByText(/^reviews & news$/i)).toBeVisible();

    const searchInput = page.locator('input[placeholder="Search"], input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible();

    // Close login modal if it appears later and blocks hero area checks.
    const closeLoginPopup = page.getByRole('button', { name: /close popup|close/i }).first();
    if (await closeLoginPopup.isVisible().catch(() => false)) {
      await closeLoginPopup.click().catch(() => {});
    }

    // Use the hero car finder search and navigate to Punch details page.
    const finderCard = page.locator('section, div').filter({ hasText: /find your right car/i }).first();
    await expect(finderCard).toBeVisible();

    const finderInput = finderCard
      .locator(
        'input[type="text"], input[type="search"], input[placeholder*="car name" i], input[placeholder*="select" i]'
      )
      .first();
    await expect(finderInput).toBeVisible();

    await finderInput.click();
    await finderInput.fill('Punch');

    const punchSuggestion = page
      .locator('a[href*="/tata-cars/punch"]:visible, a:visible:has-text("Tata Punch"), a:visible:has-text("Punch")')
      .first();
    await expect(punchSuggestion).toBeVisible({ timeout: 15000 });
    await punchSuggestion.scrollIntoViewIfNeeded();
    await punchSuggestion.click();

    await expect(page).toHaveURL(/carwale\.com\/.*punch/i);
    await expect(page.getByRole('heading', { name: /tata punch/i }).first()).toBeVisible();
  });
});
