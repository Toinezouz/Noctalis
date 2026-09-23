import { expect, type Browser, type Page } from '@playwright/test';

/** A complete two-player session: two really connected browsers. */
export interface GameSession {
  alice: Page;
  bob: Page;
  code: string;
  /**
   * The server draws the first player at random. Scenarios that depend on
   * the turn order use `first` / `second` rather than Alice and Bob.
   */
  first: Page;
  second: Page;
  firstName: string;
  secondName: string;
}

/** A session of 2 to 4 players, pages in the order the names were given. */
export interface TableSession {
  pages: Page[];
  names: string[];
  code: string;
  /** Pages in turn order: `seated[0]` has the lead on turn 1. */
  seated: Page[];
  seatedNames: string[];
}

/** Closes the tutorial if it shows (first game in this browser). */
export async function dismissOnboarding(page: Page): Promise<void> {
  const skip = page.getByTestId('skip-onboarding');
  try {
    await skip.waitFor({ state: 'visible', timeout: 4000 });
    await skip.click();
  } catch {
    // Already seen: nothing to do.
  }
}

/**
 * Closes the opening draw (the wheel). It closes by itself too, but a test
 * has no reason to wait.
 */
export async function dismissRoulette(page: Page): Promise<void> {
  const button = page.getByTestId('roulette-continue');
  try {
    await button.waitFor({ state: 'visible', timeout: 4000 });
    await button.click();
    await page.getByTestId('roulette').waitFor({ state: 'detached', timeout: 4000 });
  } catch {
    // Already closed: nothing to do.
  }
}

/** The player in the lead: only they get the constellation buttons. */
export async function hasTheLead(page: Page): Promise<boolean> {
  return (await page.locator('[data-testid^="reveal-"]').count()) > 0;
}

export interface StartGameOptions {
  /**
   * Leaves the draw announcement open (and so the tutorial pending): the
   * test deals with it. By default everything is closed.
   */
  keepDraw?: boolean;
}

/** Opens a table for `names.length` players (the first one hosts) and starts it. */
export async function startTable(
  browser: Browser,
  names: string[],
  options: StartGameOptions = {},
): Promise<TableSession> {
  const pages: Page[] = [];
  for (let i = 0; i < names.length; i += 1) {
    pages.push(await (await browser.newContext()).newPage());
  }
  const host = pages[0]!;

  await host.goto('/');
  await host.getByTestId('menu-create').click();
  await host.getByTestId('name-input').fill(names[0]!);
  await host.getByTestId('submit-room').click();
  await expect(host.getByTestId('room-code')).toBeVisible();
  const code = (await host.getByTestId('room-code').innerText()).replace(/\s/g, '');
  expect(code).toHaveLength(5);

  for (let i = 1; i < names.length; i += 1) {
    const page = pages[i]!;
    await page.goto('/');
    await page.getByTestId('menu-join').click();
    await page.getByTestId('name-input').fill(names[i]!);
    await page.getByTestId('code-input').fill(code);
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('waiting-host')).toBeVisible();
  }

  await host.getByTestId('start-game').click();
  for (const page of pages) {
    await expect(page.getByTestId('announce-button')).toBeVisible();
  }
  if (!options.keepDraw) {
    // The draw is announced before the tutorial.
    for (const page of pages) {
      await dismissRoulette(page);
    }
    for (const page of pages) {
      await dismissOnboarding(page);
    }
  }

  // The turn order is shown in the side panel, starting with the player drawn.
  const order = await host
    .locator('.table__side .player-status__name')
    .evaluateAll((nodes) => nodes.map((n) => (n.childNodes[0]?.textContent ?? '').trim()));
  const seated = order.map((name) => pages[names.indexOf(name)]!);
  // The constellation buttons exist from the start, even behind the draw.
  expect(await hasTheLead(seated[0]!)).toBe(true);
  return { pages, names, code, seated, seatedNames: order };
}

/** Creates a two-player game with two real clients and starts it. */
export async function startGame(
  browser: Browser,
  names: [string, string] = ['Alice', 'Bob'],
  options: StartGameOptions = {},
): Promise<GameSession> {
  const table = await startTable(browser, names, options);
  const [alice, bob] = table.pages as [Page, Page];
  const aliceStarts = table.seated[0] === alice;
  return {
    alice,
    bob,
    code: table.code,
    first: aliceStarts ? alice : bob,
    second: aliceStarts ? bob : alice,
    firstName: aliceStarts ? names[0] : names[1],
    secondName: aliceStarts ? names[1] : names[0],
  };
}

/**
 * Secret numbers of the other player, read on this page (two-player
 * games), or of the named player (any table).
 */
export async function readOpponentTiles(page: Page, ownerName?: string): Promise<number[]> {
  const zone = ownerName
    ? page.locator('.player-zone--opponent').filter({ has: page.locator('.paravent__label', { hasText: ownerName }) })
    : page.locator('.player-zone--opponent');
  // `>`: only the rack's stars, not those in the GAUGE area.
  const tiles = zone.locator('.rack__column > .tile');
  const count = await tiles.count();
  const numbers: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const value = await tiles.nth(i).getAttribute('data-tile');
    if (value) {
      numbers.push(Number(value));
    }
  }
  return numbers;
}

/**
 * Plays step 1 of a turn: reveals a star of an available constellation, then
 * waits until step 2 really shows. The interface re-renders several times
 * when a new state arrives: a synthetic click may land on a node replaced in
 * the meantime, so it is retried once.
 */
export async function revealAnyColor(page: Page): Promise<void> {
  const hint = page.getByTestId('hint-instruction');

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let clicked = false;
    for (const color of ['green', 'pink', 'blue', 'red', 'orange']) {
      const button = page.getByTestId(`reveal-${color}`);
      if ((await button.count()) > 0 && (await button.isEnabled())) {
        await button.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      throw new Error('No constellation available');
    }
    try {
      await hint.waitFor({ state: 'visible', timeout: 3000 });
      return;
    } catch {
      // Click lost during a render: try once more.
    }
  }
  await expect(hint).toBeVisible();
}

/**
 * Selects a star of the open sky and returns its number. The number is read
 * on the element actually clicked: the sky is sorted, so a star revealed in
 * the meantime would shift indexes.
 */
export async function selectPublicTile(page: Page, index: number): Promise<number> {
  const tile = page.locator('.pool__tiles button.tile').nth(index);
  await expect(tile).toBeVisible();
  const number = Number(await tile.getAttribute('data-tile'));
  await tile.click();
  return number;
}

/** A call with a valid shape (one per constellation, ascending) that is wrong. */
export function wrongCall(secret: readonly number[]): number[] {
  return [1, 2, 3, 4, 5]
    .map((base) => {
      for (let n = base; n <= 60; n += 5) {
        if (!secret.includes(n)) {
          return n;
        }
      }
      return base;
    })
    .sort((a, b) => a - b);
}

/** Makes a CONSTELLATION! call through the interface. */
export async function makeCall(page: Page, numbers: readonly number[]): Promise<void> {
  await page.getByTestId('announce-button').click();
  for (const [index, number] of numbers.entries()) {
    await page.getByTestId(`announce-input-${String(index)}`).fill(String(number));
  }
  await page.getByTestId('submit-guess').click();
  await page.getByTestId('confirm-guess').click();
}
