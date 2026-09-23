import { expect, test, type Page } from '@playwright/test';
import { readOpponentTiles, startGame } from './helpers.js';

/** Capture toutes les trames WebSocket recues par une page. */
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

/** Numeros portes par des champs de type "numero de tuile" dans un texte JSON. */
function tileNumbersIn(text: string): Set<number> {
  const found = new Set<number>();
  for (const match of text.matchAll(/"(?:number|tileNumber)":(\d+)/g)) {
    found.add(Number(match[1]));
  }
  return found;
}

// Chaque test repart d'un navigateur propre : aucune session ne fuit d'un
// test a l'autre (sessions, fiches de deduction, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Protection des informations secretes', () => {
  test('un joueur ne recoit jamais ses propres numeros (DOM, stockage, reseau)', async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const alicePage = await contextA.newPage();
    const bobPage = await contextB.newPage();
    const aliceFrames = captureFrames(alicePage);
    const bobFrames = captureFrames(bobPage);

    // Partie reelle entre les deux pages instrumentees.
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
      // 1. Rien dans le DOM.
      const html = await page.content();
      const inDom = tileNumbersIn(html);
      for (const secret of ownSecrets) {
        expect(inDom.has(secret), `${name} : ${String(secret)} present dans le DOM`).toBe(false);
      }
      const tileAttributes = await page
        .locator('[data-tile]')
        .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-tile'))));
      for (const secret of ownSecrets) {
        expect(
          tileAttributes.includes(secret),
          `${name} : ${String(secret)} affiche sur une tuile`,
        ).toBe(false);
      }

      // 2. Rien dans le stockage local.
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
          `${name} : ${String(secret)} dans le stockage`,
        ).toBe(false);
      }

      // 3. Rien dans les trames WebSocket recues.
      expect(frames.length).toBeGreaterThan(0);
      const network = frames.join('\n');
      const inNetwork = tileNumbersIn(network);
      for (const secret of ownSecrets) {
        expect(
          inNetwork.has(secret),
          `${name} : ${String(secret)} transite sur le reseau`,
        ).toBe(false);
      }

      // 4. En revanche, les numeros de l'adversaire sont bien recus.
      const opponentSecrets = name === 'Alice' ? bobSecrets : aliceSecrets;
      for (const secret of opponentSecrets) {
        expect(
          inNetwork.has(secret),
          `${name} : ${String(secret)} devrait etre visible`,
        ).toBe(true);
      }
    }
  });

  test('mes tuiles n affichent ni numero ni points', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alice', 'Bob']);
    const backs = alice.locator('.player-zone--mine .tile-back');
    await expect(backs).toHaveCount(5);
    // Aucun point affiche sur le dos des tuiles (les points restreindraient
    // le numero a 12 candidats sur 60).
    await expect(alice.locator('.player-zone--mine .tile-back .tile__dot')).toHaveCount(0);
    for (let i = 0; i < 5; i += 1) {
      await expect(backs.nth(i)).toHaveAccessibleName(/numéro inconnu/);
    }
  });
});
