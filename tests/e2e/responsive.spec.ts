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

// Chaque test repart d'un navigateur propre : aucune session ne fuit d'un
// test a l'autre (sessions, fiches de deduction, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Responsive', () => {
  test('aucun debordement horizontal sur les tailles ciblees', async ({ browser }) => {
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
        `debordement horizontal en ${viewport.name}`,
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);

      // Les actions principales restent accessibles et cliquables.
      await expect(alice.getByTestId('got-five-button')).toBeVisible();
      const sheetButton = alice.getByTestId('open-sheet');
      await expect(sheetButton).toBeVisible();
      const box = await sheetButton.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(36);
    }
  });

  test('la fiche est utilisable en plein ecran sur mobile', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alice', 'Bob']);
    await alice.setViewportSize({ width: 390, height: 844 });
    await alice.getByTestId('open-sheet').click();
    const sheet = alice.getByTestId('deduction-sheet');
    await expect(sheet).toHaveClass(/sheet--fullscreen/);
    await expect(alice.locator('.sheet-cell')).toHaveCount(60);

    // Les cases restent assez grandes pour le doigt.
    const box = await alice.getByTestId('sheet-cell-37').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(34);
    expect(box!.height).toBeGreaterThanOrEqual(34);

    await alice.getByTestId('sheet-cell-37').click();
    await expect(alice.getByTestId('sheet-cell-37')).toHaveAttribute('aria-pressed', 'true');

    await alice.getByTestId('close-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toHaveCount(0);
    await expect(alice.getByTestId('got-five-button')).toBeVisible();
  });
});
