import { expect, test, type Browser, type Page } from '@playwright/test';
import { startGame } from './helpers.js';

// Every test starts from a clean browser.
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

/** Opens the home screen with a given device preference. */
async function openHome(browser: Browser, colorScheme: 'light' | 'dark'): Promise<Page> {
  const context = await browser.newContext({ colorScheme });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByTestId('menu-create')).toBeVisible();
  return page;
}

/** Effective background colour of the page. */
async function pageBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/** Approximate luminance of an "rgb(r, g, b)" colour. */
function brightness(color: string): number {
  const [r, g, b] = [...color.matchAll(/\d+/g)].slice(0, 3).map((m) => Number(m[0]));
  return (0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255;
}

test.describe('Light and dark themes', () => {
  test('follows the device preference by default', async ({ browser }) => {
    const dark = await openHome(browser, 'dark');
    await expect(dark.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(brightness(await pageBackground(dark))).toBeLessThan(0.25);

    const light = await openHome(browser, 'light');
    await expect(light.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(brightness(await pageBackground(light))).toBeGreaterThan(0.75);
  });

  test('the player\'s choice beats the device and survives a reload', async ({
    browser,
  }) => {
    // Device in light mode, player wants dark.
    const page = await openHome(browser, 'light');
    await expect(page.getByTestId('theme-auto')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('theme-dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(brightness(await pageBackground(page))).toBeLessThan(0.25);

    await page.reload();
    // Applied from the first paint: no light flash before React starts.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true');

    // Back to "automatic": the device takes over again.
    await page.getByTestId('theme-auto').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('the browser bar follows the theme too', async ({ browser }) => {
    const page = await openHome(browser, 'light');
    const meta = page.locator('meta[name="theme-color"]');
    await expect(meta).toHaveAttribute('content', /#f2ecdf/i);
    await page.getByTestId('theme-dark').click();
    await expect(meta).toHaveAttribute('content', /#070b1a/i);
  });

  test('the theme can change mid-game without disturbing it', async ({ browser }) => {
    const { first, second } = await startGame(browser, ['Alice', 'Bob']);

    // In the game header, one button cycles auto / light / dark.
    const cycle = first.getByTestId('theme-cycle');
    await expect(cycle).toHaveAttribute('data-theme-value', 'auto');
    await cycle.click();
    await expect(cycle).toHaveAttribute('data-theme-value', 'light');
    await cycle.click();
    await expect(cycle).toHaveAttribute('data-theme-value', 'dark');
    await expect(first.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(brightness(await pageBackground(first))).toBeLessThan(0.25);
    // The choice is personal: the other player is not affected.
    await expect(second.locator('html')).toHaveAttribute('data-theme', 'light');

    // The table stays readable and the game playable.
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);
    const ink = await first.evaluate(() => getComputedStyle(document.body).color);
    expect(brightness(ink)).toBeGreaterThan(0.75);
    await expect(first.getByTestId('announce-button')).toBeVisible();
  });

  test('the star chart stays readable in dark mode', async ({ browser }) => {
    const { first } = await startGame(browser, ['Alice', 'Bob']);
    const cycle = first.getByTestId('theme-cycle');
    await cycle.click();
    await cycle.click();
    await expect(first.locator('html')).toHaveAttribute('data-theme', 'dark');
    await first.getByTestId('open-sheet').click();

    const sheet = first.getByTestId('deduction-sheet');
    await expect(sheet).toBeVisible();
    // The chart itself follows the theme.
    const paper = await sheet.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(brightness(paper)).toBeLessThan(0.25);
    // On a large screen the chart opens in a side panel that must hide the
    // table; on a phone it fills the screen, without a panel.
    const panel = first.locator('.sheet-panel');
    if ((await panel.count()) > 0) {
      const veil = await panel.evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(brightness(veil)).toBeLessThan(0.25);
    }
    await expect(first.locator('.sheet-cell')).toHaveCount(60);
    // Constellation colours do not change: the chart matches the table.
    const cell = first.getByTestId('sheet-cell-1');
    await expect(cell).toHaveAttribute('data-color', 'green');
    const face = await cell.evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(face).toContain('rgb(39, 179, 155)');
  });
});
