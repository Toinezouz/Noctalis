import { expect, test } from '@playwright/test';
import { startGame } from './helpers.js';

// Every test starts from a clean browser: no session leaks from one test to
// the next (sessions, star charts, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Star chart', () => {
  test('full grid, toggling, persistence and reset', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alicia', 'Bobby']);

    // 1. Open the chart
    await alice.getByTestId('open-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toBeVisible();

    // The grid holds exactly 60 cells, numbered from 1 to 60.
    const cells = alice.locator('.sheet-cell');
    await expect(cells).toHaveCount(60);
    const numbers = await cells.evaluateAll((nodes) =>
      nodes.map((n) => Number(n.getAttribute('data-number'))),
    );
    expect(new Set(numbers).size).toBe(60);
    expect([...numbers].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 60 }, (_, i) => i + 1),
    );

    // Constellations and brightness: the chart reads the same source as the stars.
    const samples: [number, string, number][] = [
      [1, 'green', 1],
      [2, 'pink', 1],
      [3, 'blue', 1],
      [4, 'red', 1],
      [5, 'orange', 1],
      [6, 'green', 2],
      [11, 'green', 3],
      [17, 'pink', 1],
      [37, 'pink', 2],
      [60, 'orange', 3],
    ];
    for (const [n, color, points] of samples) {
      const cell = alice.getByTestId(`sheet-cell-${String(n)}`);
      await expect(cell).toHaveAttribute('data-color', color);
      await expect(cell.locator('.sheet-cell__dot')).toHaveCount(points);
    }

    // 3-4. Tap 17: it gets crossed out.
    const cell17 = alice.getByTestId('sheet-cell-17');
    await expect(cell17).toHaveAttribute('aria-pressed', 'false');
    await cell17.click();
    await expect(cell17).toHaveAttribute('aria-pressed', 'true');
    await expect(cell17.locator('.sheet-cell__cross')).toBeVisible();
    await expect(cell17).toHaveAccessibleName(/crossed out/);

    // 5-6. Tap again: it comes back.
    await cell17.click();
    await expect(cell17).toHaveAttribute('aria-pressed', 'false');
    await expect(cell17.locator('.sheet-cell__cross')).toHaveCount(0);

    // Cross it out again, with another one.
    await cell17.click();
    await alice.getByTestId('sheet-cell-42').click();
    await expect(alice.getByTestId('crossed-count')).toContainText('2 / 60');

    // 7. Write down the 5 guesses.
    const guesses = ['18', '24', '31', '42', '56'];
    for (const [index, value] of guesses.entries()) {
      await alice.getByTestId(`guess-input-${String(index)}`).fill(value);
    }

    // 8-10. Close and reopen: everything is kept.
    await alice.getByTestId('close-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toHaveCount(0);
    await alice.getByTestId('open-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toBeVisible();
    await expect(alice.getByTestId('sheet-cell-17')).toHaveAttribute('aria-pressed', 'true');
    await expect(alice.getByTestId('sheet-cell-42')).toHaveAttribute('aria-pressed', 'true');
    for (const [index, value] of guesses.entries()) {
      await expect(alice.getByTestId(`guess-input-${String(index)}`)).toHaveValue(value);
    }

    // The chart survives a page reload too (reconnection).
    await alice.reload();
    await expect(alice.getByTestId('announce-button')).toBeVisible();
    await alice.getByTestId('open-sheet').click();
    await expect(alice.getByTestId('sheet-cell-17')).toHaveAttribute('aria-pressed', 'true');
    await expect(alice.getByTestId('guess-input-1')).toHaveValue('24');

    // 11-13. Clear the chart, with a confirmation.
    await alice.getByTestId('reset-sheet').click();
    await alice.getByTestId('confirm-reset').click();
    await expect(alice.getByTestId('sheet-cell-17')).toHaveAttribute('aria-pressed', 'false');
    await expect(alice.getByTestId('sheet-cell-42')).toHaveAttribute('aria-pressed', 'false');
    await expect(alice.getByTestId('crossed-count')).toContainText('0 / 60');
    for (let index = 0; index < 5; index += 1) {
      await expect(alice.getByTestId(`guess-input-${String(index)}`)).toHaveValue('');
    }
  });

  test('the chart never crosses out a star by itself', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Anna', 'Boris']);
    await alice.getByTestId('open-sheet').click();

    // The 5 initial stars of the sky carry a landmark, none is crossed out.
    const revealed = alice.locator('.sheet-cell.is-revealed');
    await expect(revealed).toHaveCount(5);
    // So do the 5 stars seen on the other player's rack.
    await expect(alice.locator('.sheet-cell.is-held')).toHaveCount(5);
    await expect(alice.locator('.sheet-cell.is-crossed')).toHaveCount(0);
    await expect(alice.getByTestId('crossed-count')).toContainText('0 / 60');
  });

  test('accessibility: keyboard and labels', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Ada', 'Bo']);
    await alice.getByTestId('open-sheet').click();

    const cell = alice.getByTestId('sheet-cell-37');
    // Star 37 may be one of the initial public stars, or on the other rack,
    // which adds a detail at the end of the label.
    await expect(cell).toHaveAccessibleName(/^Number 37, Aurora, 2 sparks, still possible/);
    await cell.focus();
    await expect(cell).toBeFocused();
    await alice.keyboard.press('Enter');
    await expect(cell).toHaveAccessibleName(/^Number 37, Aurora, 2 sparks, crossed out/);
    await expect(cell).toBeFocused();
    await alice.keyboard.press('Enter');
    await expect(cell).toHaveAccessibleName(/still possible/);
  });
});
