import { expect, test } from '@playwright/test';
import {
  hasTheLead,
  makeCall,
  readOpponentTiles,
  revealAnyColor,
  selectPublicTile,
  startTable,
  wrongCall,
} from './helpers.js';

// Every test starts from a clean browser.
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Three or four at the table', () => {
  test('four people: everyone sees the others, never themselves', async ({ browser }) => {
    const names = ['Alice', 'Bob', 'Chloé', 'Dany'];
    const { pages, code } = await startTable(browser, names);

    // A fifth person finds the table full.
    const late = await (await browser.newContext()).newPage();
    await late.goto('/');
    await late.getByTestId('menu-join').click();
    await late.getByTestId('name-input').fill('Eve');
    await late.getByTestId('code-input').fill(code);
    await late.getByTestId('submit-room').click();
    await expect(late.getByTestId('home-error')).toContainText('already begun');

    const hands = new Map<string, number[]>();
    for (const [index, page] of pages.entries()) {
      // Three other racks, five stars each, face up.
      await expect(page.locator('.player-zone--opponent')).toHaveCount(3);
      await expect(page.locator('.player-zone--opponent .rack__column > .tile')).toHaveCount(15);
      // My own five stay eclipsed.
      await expect(page.locator('.player-zone--mine .tile-back')).toHaveCount(5);
      for (const other of names.filter((_, i) => i !== index)) {
        hands.set(other, await readOpponentTiles(page, other));
      }
    }
    // Twenty different secret stars.
    expect(new Set([...hands.values()].flat()).size).toBe(20);
    // Nobody's own numbers appear on their screen.
    for (const [index, page] of pages.entries()) {
      const shown = await page
        .locator('[data-tile]')
        .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-tile'))));
      for (const secret of hands.get(names[index]!)!) {
        expect(shown, `${names[index]!} sees own star ${String(secret)}`).not.toContain(secret);
      }
    }
  });

  test('the next person in the turn order answers, then takes the lead', async ({ browser }) => {
    const { seated, seatedNames } = await startTable(browser, ['Alice', 'Bob', 'Chloé', 'Dany']);
    const [lead, next, third, fourth] = seated;

    await revealAnyColor(lead!);
    const chosen = await selectPublicTile(lead!, 0);
    // The dialog says who is going to answer.
    await expect(lead!.getByRole('dialog')).toContainText(`${seatedNames[1]!} puts this star`);
    await lead!.getByTestId('choose-classify').click();

    // Only the next person is asked; the others see who is answering.
    await expect(next!.getByTestId('confirm-classify')).toBeVisible();
    await expect(third!.getByTestId('confirm-classify')).toHaveCount(0);
    await expect(fourth!.getByTestId('confirm-classify')).toHaveCount(0);
    await expect(third!.locator('.turn-indicator')).toContainText(`${seatedNames[1]!} is placing the star`);
    await next!.locator('.slot-picker__slot').first().click();
    await next!.getByTestId('confirm-classify').click();

    // Everybody sees the star placed on the asker's rack.
    for (const page of [next!, third!, fourth!]) {
      await expect(
        page.locator(`.player-zone--opponent .classify-slot .tile[data-tile="${String(chosen)}"]`),
      ).toHaveCount(1);
    }
    // And the lead goes round the table.
    await expect(next!.locator('.turn-indicator')).toContainText('YOUR TURN');
    expect(await hasTheLead(lead!)).toBe(false);
    await expect(lead!.locator('.turn-indicator')).toContainText(`${seatedNames[1]!}’s turn`);
  });

  test('three people: a wrong call and a departure do not stop the game', async ({ browser }) => {
    const { seated, seatedNames } = await startTable(browser, ['Alice', 'Bob', 'Chloé']);
    const [lead, next, last] = seated;

    // The second player misses their call: out of the race, but still at the table.
    const nextStars = await readOpponentTiles(lead!, seatedNames[1]);
    await makeCall(next!, wrongCall(nextStars));
    await expect(next!.getByTestId('announce-button')).toHaveCount(0);
    await expect(lead!.locator('.player-status').filter({ hasText: seatedNames[1]! })).toContainText(
      'Out of the race',
    );

    // The first player still asks the next person, who still answers...
    await revealAnyColor(lead!);
    await selectPublicTile(lead!, 0);
    await lead!.getByTestId('choose-classify').click();
    await expect(next!.getByTestId('confirm-classify')).toBeVisible();
    await next!.locator('.slot-picker__slot').first().click();
    await next!.getByTestId('confirm-classify').click();
    // ...but the lead skips them.
    await expect(last!.locator('.turn-indicator')).toContainText('YOUR TURN');

    // The last player leaves: the two others play on.
    await last!.getByTestId('leave-game').click();
    await expect(lead!.locator('.player-status').filter({ hasText: seatedNames[2]! })).toContainText('Left');
    await expect(lead!.getByTestId('game-over')).toHaveCount(0);
    await expect(lead!.locator('.turn-indicator')).toContainText('YOUR TURN');
    await revealAnyColor(lead!);
  });
});
