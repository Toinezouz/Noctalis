import { expect, test } from '@playwright/test';
import { startGame } from './helpers.js';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '375x812', width: 375, height: 812 },
];

// Every test starts from a clean browser: no session leaks from one test to
// the next (sessions, star charts, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Responsive', () => {
  test('no horizontal overflow at the target sizes', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alice', 'Bob']);

    for (const viewport of VIEWPORTS) {
      await alice.setViewportSize({ width: viewport.width, height: viewport.height });
      await alice.waitForTimeout(160);

      const metrics = await alice.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        metrics.scrollWidth,
        `horizontal overflow at ${viewport.name}`,
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);

      // The main actions stay reachable and clickable.
      await expect(alice.getByTestId('announce-button')).toBeVisible();
      const sheetButton = alice.getByTestId('open-sheet');
      await expect(sheetButton).toBeVisible();
      const box = await sheetButton.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(36);
    }
  });

  test('the star chart is usable full screen on a phone', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alice', 'Bob']);
    await alice.setViewportSize({ width: 390, height: 844 });
    await alice.getByTestId('open-sheet').click();
    const sheet = alice.getByTestId('deduction-sheet');
    await expect(sheet).toHaveClass(/sheet--fullscreen/);
    await expect(alice.locator('.sheet-cell')).toHaveCount(60);

    // Cells stay big enough for a finger.
    const box = await alice.getByTestId('sheet-cell-37').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(34);
    expect(box!.height).toBeGreaterThanOrEqual(34);

    await alice.getByTestId('sheet-cell-37').click();
    await expect(alice.getByTestId('sheet-cell-37')).toHaveAttribute('aria-pressed', 'true');

    await alice.getByTestId('close-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toHaveCount(0);
    await expect(alice.getByTestId('announce-button')).toBeVisible();
  });
});
