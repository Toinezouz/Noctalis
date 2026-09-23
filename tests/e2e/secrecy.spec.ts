import { expect, test, type Page } from '@playwright/test';
import { readOpponentTiles, startGame } from './helpers.js';

/** Captures every WebSocket frame a page receives. */
function captureFrames(page: Page): string[] {
  const frames: string[] = [];
  page.on('websocket', (ws) => {
    ws.on('framereceived', (data) => {
      if (typeof data.payload === 'string') {
        frames.push(data.payload);
      }
    });
  });
  return frames;
}

/** Numbers carried by "star number" fields in a JSON text. */
function tileNumbersIn(text: string): Set<number> {
  const found = new Set<number>();
  for (const match of text.matchAll(/"(?:number|tileNumber)":(\d+)/g)) {
    found.add(Number(match[1]));
  }
  return found;
}

// Every test starts from a clean browser: no session leaks from one test to
// the next (sessions, star charts, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Protecting secret information', () => {
  test('a player never receives their own numbers (DOM, storage, network)', async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const alicePage = await contextA.newPage();
    const bobPage = await contextB.newPage();
    const aliceFrames = captureFrames(alicePage);
    const bobFrames = captureFrames(bobPage);

    // A real game between the two instrumented pages.
    await alicePage.goto('/');
    await alicePage.getByTestId('menu-create').click();
    await alicePage.getByTestId('name-input').fill('Alice');
    await alicePage.getByTestId('submit-room').click();
    await expect(alicePage.getByTestId('room-code')).toBeVisible();
    const code = (await alicePage.getByTestId('room-code').innerText()).replace(/\s/g, '');

    await bobPage.goto('/');
    await bobPage.getByTestId('menu-join').click();
    await bobPage.getByTestId('name-input').fill('Bob');
    await bobPage.getByTestId('code-input').fill(code);
    await bobPage.getByTestId('submit-room').click();
    await alicePage.getByTestId('start-game').click();
    await expect(alicePage.getByTestId('announce-button')).toBeVisible();
    await expect(bobPage.getByTestId('announce-button')).toBeVisible();

    const aliceSecrets = await readOpponentTiles(bobPage);
    const bobSecrets = await readOpponentTiles(alicePage);
    expect(aliceSecrets).toHaveLength(5);
    expect(bobSecrets).toHaveLength(5);

    const checks: [string, Page, number[], string[]][] = [
      ['Alice', alicePage, aliceSecrets, aliceFrames],
      ['Bob', bobPage, bobSecrets, bobFrames],
    ];

    for (const [name, page, ownSecrets, frames] of checks) {
      // 1. Nothing in the DOM.
      const html = await page.content();
      const inDom = tileNumbersIn(html);
      for (const secret of ownSecrets) {
        expect(inDom.has(secret), `${name}: ${String(secret)} found in the DOM`).toBe(false);
      }
      const tileAttributes = await page
        .locator('[data-tile]')
        .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-tile'))));
      for (const secret of ownSecrets) {
        expect(
          tileAttributes.includes(secret),
          `${name}: ${String(secret)} shown on a star`,
        ).toBe(false);
      }

      // 2. Nothing in local storage.
      const storage = await page.evaluate(() =>
        JSON.stringify({
          local: { ...window.localStorage },
          session: { ...window.sessionStorage },
        }),
      );
      for (const secret of ownSecrets) {
        expect(
          new RegExp(`\\b${String(secret)}\\b`).test(storage) &&
            storage.includes(`"${String(secret)}"`),
          `${name}: ${String(secret)} in storage`,
        ).toBe(false);
      }

      // 3. Nothing in the WebSocket frames received.
      expect(frames.length).toBeGreaterThan(0);
      const network = frames.join('\n');
      const inNetwork = tileNumbersIn(network);
      for (const secret of ownSecrets) {
        expect(
          inNetwork.has(secret),
          `${name}: ${String(secret)} travels over the network`,
        ).toBe(false);
      }

      // 4. The other player's numbers, on the other hand, do arrive.
      const opponentSecrets = name === 'Alice' ? bobSecrets : aliceSecrets;
      for (const secret of opponentSecrets) {
        expect(
          inNetwork.has(secret),
          `${name}: ${String(secret)} should be visible`,
        ).toBe(true);
      }
    }
  });

  test('my stars show neither number nor brightness', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alice', 'Bob']);
    const backs = alice.locator('.player-zone--mine .tile-back');
    await expect(backs).toHaveCount(5);
    // No spark on my eclipsed stars (brightness would narrow the number down
    // to 12 candidates out of 60).
    await expect(alice.locator('.player-zone--mine .tile-back .tile__dot')).toHaveCount(0);
    for (let i = 0; i < 5; i += 1) {
      await expect(backs.nth(i)).toHaveAccessibleName(/number unknown/);
    }
  });
});
