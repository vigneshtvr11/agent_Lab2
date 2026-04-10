const { test, expect } = require('@playwright/test');

test.describe('CarWale homepage search flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await closeKnownPopups(page);
  });

  test('launch homepage and validate URL', async ({ page }) => {
    await expect(page).toHaveURL(/carwale\.com/i);
    await expect(page.getByText(/find your right car/i)).toBeVisible();
  });

  test('select location Chennai and validate location context', async ({ page }) => {
    const cityInput = await selectLocation(page, 'Chennai');
    await expect(cityInput).toHaveValue(/chennai/i);
  });

  test('search Tata Punch and open car detail page', async ({ page }) => {
    await searchFromHomepage(page, 'Tata Punch');
    await clickSuggestionByText(page, /tata punch/i);
    await expect(page).toHaveURL(/tata-cars\/punch|\/punch/i);
    await expect(page.getByRole('heading', { name: /tata punch/i }).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('empty search should stay stable', async ({ page }) => {
    const searchBox = getHomeSearchBox(page);
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.click();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/carwale\.com/i);
  });

  test('invalid search string should not break page', async ({ page }) => {
    await searchFromHomepage(page, 'XYZ123');
    await expect(page).toHaveURL(/carwale\.com|search/i);
  });

  test('special characters search should be handled safely', async ({ page }) => {
    await searchFromHomepage(page, '@@@###');
    await expect(page).toHaveURL(/carwale\.com|search/i);
  });

  test('search should be case-insensitive', async ({ page }) => {
    await searchFromHomepage(page, 'tata punch');
    await expect(page.getByText(/tata punch/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('keyboard search with Enter', async ({ page }) => {
    await searchFromHomepage(page, 'Tata Punch', true);
    await expect(page).toHaveURL(/carwale\.com|tata-cars\/punch|\/search|\/new-cars/i);
  });

  test('search without explicit location selection', async ({ page }) => {
    await searchFromHomepage(page, 'Tata Punch');
    await expect(page.getByText(/tata punch/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('multiple clicks on suggestion should keep single stable navigation', async ({ page }) => {
    await searchFromHomepage(page, 'Tata Punch');
    const suggestion = page.getByText(/tata punch/i).first();
    await expect(suggestion).toBeVisible({ timeout: 10000 });
    await suggestion.dblclick().catch(() => {});
    await suggestion.click().catch(() => {});
    await page.waitForTimeout(1000);

    const pages = page.context().pages();
    const activePage = pages[pages.length - 1];
    await expect(activePage).toHaveURL(/tata-cars\/punch|\/punch/i);
  });
});

function getHomeSearchBox(page) {
  return page
    .locator('div:has-text("Type model name, e.g, Used Alto")')
    .locator('input:visible')
    .first();
}

async function closeKnownPopups(page) {
  const closeCandidates = [
    page.getByRole('button', { name: /close/i }).first(),
    page.locator('[aria-label*="close" i]').first(),
    page.locator('button:has-text("No Thanks")').first(),
    page.locator('button:has-text("Later")').first(),
  ];
  for (const locator of closeCandidates) {
    if (await locator.isVisible({ timeout: 1200 }).catch(() => false)) {
      await locator.click().catch(() => {});
    }
  }
}

async function selectLocation(page, city) {
  const cityInput = page
    .locator('header')
    .locator('input[placeholder="Search"]')
    .first();
  await expect(cityInput).toBeVisible({ timeout: 10000 });
  await cityInput.click();
  await cityInput.fill('');
  await cityInput.fill(city);
  return cityInput;
}

async function searchFromHomepage(page, query, pressEnter = false) {
  await page.getByRole('heading', { name: /find your right car/i }).first().scrollIntoViewIfNeeded();
  const searchBox = getHomeSearchBox(page);
  await expect(searchBox).toBeVisible({ timeout: 10000 });
  await searchBox.click();
  await searchBox.fill(query);
  if (pressEnter) {
    await searchBox.press('Enter');
  }
}

async function clickSuggestionByText(page, textRegex) {
  const suggestion = page.getByText(textRegex).first();
  await expect(suggestion).toBeVisible({ timeout: 10000 });
  await suggestion.click();
}
