import { expect, test } from '@playwright/test';
import { dismissOnboarding, revealAnyColor, startGame } from './helpers.js';

// Every test starts from a clean browser.
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Drawing the first player', () => {
  test('the wheel announces the same player to both, who then has the lead', async ({
    browser,
  }) => {
    const { alice, bob, first, firstName } = await startGame(browser, ['Alice', 'Bob'], {
      keepDraw: true,
    });

    // Both players see the wheel, with both names on it.
    for (const page of [alice, bob]) {
      await expect(page.getByTestId('roulette')).toBeVisible();
      await expect(page.locator('.roulette__title')).toContainText('Who goes first?');
      await expect(page.locator('.roulette__label-text')).toHaveText(['Alice', 'Bob']);
      // And nothing covers it: the first-game tutorial waits its turn.
      await expect(page.locator('.modal-backdrop')).toHaveCount(0);
      await expect(page.getByTestId('roulette-continue')).toBeEnabled();
    }

    // The wheel stops on the drawn player, the same on both sides.
    await expect(alice.locator('.roulette__title')).toContainText(`${firstName} goes first!`);
    await expect(bob.locator('.roulette__title')).toContainText(`${firstName} goes first!`);

    // Each reads the announcement from their own point of view.
    await expect(first.getByTestId('roulette-note')).toContainText('The stars chose you');
    const second = first === alice ? bob : alice;
    await expect(second.getByTestId('roulette-note')).toContainText('opens the game');

    // And that player really is the one who can play.
    await expect(first.getByTestId('reveal-green')).toHaveCount(1);
    await expect(second.locator('[data-testid^="reveal-"]')).toHaveCount(0);

    // The public history keeps track of the draw, for both players.
    for (const page of [alice, bob]) {
      await expect(page.locator('.game-log')).toContainText(`The draw picked ${firstName} to start`);
    }
  });

  test('the wheel closes by itself and hands over to the game', async ({ browser }) => {
    const { alice, bob, first } = await startGame(browser, ['Alice', 'Bob'], { keepDraw: true });

    // Nobody stays stuck: the wheel goes away without a click.
    await expect(alice.getByTestId('roulette')).toHaveCount(0, { timeout: 15000 });
    await expect(bob.getByTestId('roulette')).toHaveCount(0, { timeout: 15000 });

    // The tutorial comes next, then the game is playable.
    await expect(alice.getByTestId('skip-onboarding')).toBeVisible();
    await dismissOnboarding(alice);
    await dismissOnboarding(bob);
    await revealAnyColor(first);
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(6);
  });

  test('one click skips the animation', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alice', 'Bob'], { keepDraw: true });
    await expect(alice.getByTestId('roulette-continue')).toContainText('Skip');
    await alice.getByTestId('roulette-continue').click();
    await expect(alice.getByTestId('roulette')).toHaveCount(0);
  });
});
