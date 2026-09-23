import { expect, test } from '@playwright/test';
import {
  dismissRoulette,
  makeCall,
  readOpponentTiles,
  revealAnyColor,
  selectPublicTile,
  startGame,
  wrongCall,
} from './helpers.js';

// Every test starts from a clean browser: no session leaks from one test to
// the next (sessions, star charts, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('A full two-player game', () => {
  test('setup, a full turn, PLACE, GAUGE and the next turn', async ({ browser }) => {
    // The first player is drawn at random: follow the roles, not the names.
    const { first, second, firstName, secondName } = await startGame(browser, ['Alice', 'Bob']);

    // Setup: 5 public stars, one per constellation.
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);
    await expect(second.locator('.pool__tiles .tile')).toHaveCount(5);

    // Each player sees the other's 5 stars face up...
    const firstSecrets = await readOpponentTiles(second);
    const secondSecrets = await readOpponentTiles(first);
    expect(firstSecrets).toHaveLength(5);
    expect(secondSecrets).toHaveLength(5);
    // ...sorted in ascending order...
    expect([...firstSecrets].sort((a, b) => a - b)).toEqual(firstSecrets);
    // ...and the two hands do not overlap.
    expect(new Set([...firstSecrets, ...secondSecrets]).size).toBe(10);

    // ...but nobody sees their own: 5 eclipsed stars on their own rack.
    await expect(first.locator('.player-zone--mine .tile-back')).toHaveCount(5);
    await expect(second.locator('.player-zone--mine .tile-back')).toHaveCount(5);

    // The player drawn at random starts.
    await expect(first.locator('.turn-indicator')).toContainText('YOUR TURN');
    await expect(second.locator('.turn-indicator')).toContainText(`${firstName}’s turn`);

    // Step 1: reveal a star.
    await revealAnyColor(first);
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(6);
    await expect(second.locator('.pool__tiles .tile')).toHaveCount(6);
    await expect(first.getByTestId('hint-instruction')).toBeVisible();

    // Step 2: pick any public star (here the first one) and PLACE.
    const chosenNumber = await selectPublicTile(first, 0);
    await expect(first.getByRole('dialog')).toContainText(`${secondName} puts this star`);
    await first.getByTestId('choose-classify').click();

    // The other player answers: they can see the real numbers.
    await expect(second.getByTestId('confirm-classify')).toBeVisible();
    await expect(second.getByTestId('confirm-classify')).toBeDisabled();
    await second.locator('.slot-picker__slot').first().click();
    await second.getByTestId('confirm-classify').click();

    // The server puts the star in its exact gap, for both to see.
    const expectedSlot = firstSecrets.filter((n) => n < chosenNumber).length;
    const placed = first.locator(
      `.player-zone--mine .classify-slot[data-slot="${String(expectedSlot)}"] .tile`,
    );
    await expect(placed).toHaveCount(1);
    await expect(placed).toHaveAttribute('data-tile', String(chosenNumber));

    // The used star leaves the open sky, for both players.
    await expect(first.locator(`.pool__tiles .tile[data-tile="${String(chosenNumber)}"]`)).toHaveCount(0);
    await expect(second.locator(`.pool__tiles .tile[data-tile="${String(chosenNumber)}"]`)).toHaveCount(0);
    // One reveal, one hint: back to 5 available stars.
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);

    // The turn goes to the second player.
    await expect(second.locator('.turn-indicator')).toContainText('YOUR TURN');
    await expect(first.locator('.turn-indicator')).toContainText(`${secondName}’s turn`);
    await expect(first.getByTestId('reveal-green')).toHaveCount(0);

    // Second player's turn: reveal, then GAUGE against position 2.
    await revealAnyColor(second);
    const compareNumber = await selectPublicTile(second, 0);
    await second.getByTestId('choose-compare').click();
    await second.locator('.hint-dialog__rack .tile-back').nth(1).click();
    await second.getByTestId('confirm-compare').click();

    // The other player confirms the answer: the server enforces the truth.
    await expect(first.getByTestId('confirm-compare-answer')).toBeVisible();
    const answerLabel = (await first.getByTestId('confirm-compare-answer').innerText()).trim();
    await first.getByTestId('confirm-compare-answer').click();

    // The gauged star sits under position 2 of the second player.
    const compareArea = second.locator('.player-zone--mine .compare-area .tile');
    await expect(compareArea).toHaveCount(1);
    await expect(compareArea).toHaveAttribute('data-tile', String(compareNumber));
    // A NO shows as a dimmed star.
    if (answerLabel.includes('NO')) {
      await expect(compareArea).toHaveClass(/tile--tilted/);
    } else {
      await expect(compareArea).not.toHaveClass(/tile--tilted/);
    }

    // The public history tells the story.
    await expect(first.locator('.game-log')).toContainText('revealed star');
    await expect(first.locator('.game-log')).toContainText('PLACE');
  });

  test('a right call: victory, final reveal and rematch', async ({ browser }) => {
    const { alice, bob } = await startGame(browser, ['Alice', 'Bob']);
    const aliceSecrets = await readOpponentTiles(bob);

    await makeCall(alice, aliceSecrets);

    // Both players see the end of the game.
    await expect(alice.getByTestId('game-over')).toBeVisible();
    await expect(bob.getByTestId('game-over')).toBeVisible();
    await expect(alice.getByTestId('game-over-result')).toContainText('You found your constellation, Alice');
    await expect(bob.getByTestId('game-over-result')).toContainText('Alice found their constellation');

    // All 10 secret stars are revealed.
    await expect(alice.locator('.game-over__tiles .tile')).toHaveCount(10);
    const revealedNumbers = await alice
      .locator('.game-over__tiles .tile')
      .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-tile'))));
    for (const secret of aliceSecrets) {
      expect(revealedNumbers).toContain(secret);
    }

    // Rematch: everybody has to agree.
    await alice.getByTestId('rematch').click();
    await expect(alice.getByTestId('rematch')).toContainText('Waiting for the others');
    await expect(bob.getByTestId('rematch-count')).toContainText('1 of 2');
    await bob.getByTestId('rematch').click();

    // A rematch draws the first player again: the wheel comes back.
    await expect(alice.getByTestId('roulette')).toBeVisible();
    await expect(bob.getByTestId('roulette')).toBeVisible();
    await dismissRoulette(alice);
    await dismissRoulette(bob);

    await expect(alice.getByTestId('game-over')).toHaveCount(0);
    await expect(alice.locator('.pool__tiles .tile')).toHaveCount(5);
    await expect(alice.locator('.turn-indicator')).toContainText('Turn 1');
    // And exactly one of the two has the lead.
    const leads = await Promise.all(
      [alice, bob].map(async (page) => page.locator('[data-testid^="reveal-"]').count()),
    );
    expect(leads.filter((count) => count > 0)).toHaveLength(1);
  });

  test('a wrong call: out of the race, one call only, the game goes on', async ({ browser }) => {
    const { alice, bob } = await startGame(browser, ['Alice', 'Bob']);
    const aliceSecrets = await readOpponentTiles(bob);

    await makeCall(alice, wrongCall(aliceSecrets));

    // Alice is out: no more call button, and Bob takes the lead.
    await expect(alice.getByTestId('announce-button')).toHaveCount(0);
    await expect(bob.locator('.player-status').filter({ hasText: 'Alice' })).toContainText(
      'Out of the race',
    );
    await expect(bob.locator('.turn-indicator')).toContainText('YOUR TURN');

    // The game goes on: Bob can play his turn.
    await revealAnyColor(bob);
    await expect(bob.locator('.pool__tiles .tile')).toHaveCount(6);
  });

  test('a used star stays marked on the star chart', async ({ browser }) => {
    const { first, second } = await startGame(browser, ['Alice', 'Bob']);

    await revealAnyColor(first);
    const used = await selectPublicTile(first, 0);
    await first.getByTestId('choose-classify').click();
    await expect(second.getByTestId('confirm-classify')).toBeVisible();
    await second.locator('.slot-picker__slot').first().click();
    await second.getByTestId('confirm-classify').click();

    // Gone from the middle...
    await expect(first.locator(`.pool__tiles .tile[data-tile="${String(used)}"]`)).toHaveCount(0);
    // ...but visible on the asker's rack, in its gap.
    await expect(
      first.locator(`.player-zone--mine .classify-slot .tile[data-tile="${String(used)}"]`),
    ).toHaveCount(1);
    // ...and the star chart remembers: this number left the reserve.
    await first.getByTestId('open-sheet').click();
    const cell = first.getByTestId(`sheet-cell-${String(used)}`);
    await expect(cell).toHaveClass(/is-revealed/);
    await expect(cell).toHaveAccessibleName(/already revealed in the sky/);
  });

  test('nobody can play out of turn', async ({ browser }) => {
    const { first, second, firstName } = await startGame(browser, ['Alice', 'Bob']);
    // The player without the lead has no constellation button.
    await expect(second.getByTestId('reveal-green')).toHaveCount(0);
    await expect(second.locator('.action-panel')).toContainText(firstName);
    // Public stars cannot be selected either.
    await expect(second.locator('.pool__tiles button.tile')).toHaveCount(0);
    await expect(first.getByTestId('reveal-green')).toBeVisible();
  });

  test('room errors: unknown code, game already started, name too short', async ({ browser }) => {
    const { code } = await startGame(browser, ['Alice', 'Bob']);
    const page = await (await browser.newContext()).newPage();

    await page.goto('/');
    await page.getByTestId('menu-join').click();
    await page.getByTestId('name-input').fill('Chris');
    await page.getByTestId('code-input').fill('ZZZZZ');
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('home-error')).toContainText('No game matches this code');

    await page.getByTestId('code-input').fill(code);
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('home-error')).toContainText('already begun');

    await page.getByTestId('name-input').fill('A');
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('home-error')).toContainText('This name is not valid');
  });

  test('reconnects after a page reload', async ({ browser }) => {
    // Reload the page of the player in the lead: the game must stay playable.
    const { first, second } = await startGame(browser, ['Alice', 'Bob']);
    const opponentSecrets = await readOpponentTiles(first);

    await first.reload();
    await expect(first.getByTestId('announce-button')).toBeVisible();
    // The state is back: my 5 eclipsed stars, the other 5, the open sky.
    await expect(first.locator('.player-zone--mine .tile-back')).toHaveCount(5);
    expect(await readOpponentTiles(first)).toEqual(opponentSecrets);
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);
    // A reconnection does not replay the opening draw.
    await expect(first.getByTestId('roulette')).toHaveCount(0);
    // And the game is still playable.
    await revealAnyColor(first);
    await expect(second.locator('.pool__tiles .tile')).toHaveCount(6);
  });

  test('tells when the other player goes offline', async ({ browser }) => {
    const { alice, bob } = await startGame(browser, ['Alice', 'Bob']);
    await bob.close();
    await expect(alice.locator('.player-status').filter({ hasText: 'Bob' })).toContainText('offline');
    // A clear banner reassures the player left alone.
    await expect(alice.getByTestId('opponent-offline')).toContainText('Bob is offline for now');
  });
});
