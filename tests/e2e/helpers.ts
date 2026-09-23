import { expect, type Browser, type Page } from '@playwright/test';

/** Une session de jeu complete : deux navigateurs reellement connectes. */
export interface GameSession {
  alice: Page;
  bob: Page;
  code: string;
  /**
   * Le premier joueur est tire au sort par le serveur. Les scenarios qui
   * dependent de l'ordre des tours passent par `first` / `second` plutot que
   * par Alice et Bob.
   */
  first: Page;
  second: Page;
  firstName: string;
  secondName: string;
}

/** Ferme le tutoriel s'il s'affiche (premiere partie sur ce navigateur). */
export async function dismissOnboarding(page: Page): Promise<void> {
  const skip = page.getByTestId('skip-onboarding');
  try {
    await skip.waitFor({ state: 'visible', timeout: 4000 });
    await skip.click();
  } catch {
    // Le tutoriel a deja ete vu : rien a faire.
  }
}

/**
 * Ferme l'annonce du tirage au sort (roulette). Elle se referme aussi toute
 * seule, mais un test n'attend pas pour rien.
 */
export async function dismissRoulette(page: Page): Promise<void> {
  const button = page.getByTestId('roulette-continue');
  try {
    await button.waitFor({ state: 'visible', timeout: 4000 });
    await button.click();
    await page.getByTestId('roulette').waitFor({ state: 'detached', timeout: 4000 });
  } catch {
    // L'annonce s'est deja refermee : rien a faire.
  }
}

/** Le joueur qui a la main : lui seul dispose des boutons de couleur. */
async function hasTheLead(page: Page): Promise<boolean> {
  return (await page.locator('[data-testid^="reveal-"]').count()) > 0;
}

export interface StartGameOptions {
  /**
   * Laisse l'annonce du tirage au sort ouverte (et donc le tutoriel en
   * attente) : au test de s'en occuper. Par defaut, tout est referme.
   */
  keepDraw?: boolean;
}

/** Cree une partie avec deux vrais clients et la demarre. */
export async function startGame(
  browser: Browser,
  names: [string, string] = ['Alice', 'Bob'],
  options: StartGameOptions = {},
): Promise<GameSession> {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const alice = await contextA.newPage();
  const bob = await contextB.newPage();

  await alice.goto('/');
  await alice.getByTestId('menu-create').click();
  await alice.getByTestId('name-input').fill(names[0]);
  await alice.getByTestId('submit-room').click();
  await expect(alice.getByTestId('room-code')).toBeVisible();
  const code = (await alice.getByTestId('room-code').innerText()).replace(/\s/g, '');
  expect(code).toHaveLength(5);

  await bob.goto('/');
  await bob.getByTestId('menu-join').click();
  await bob.getByTestId('name-input').fill(names[1]);
  await bob.getByTestId('code-input').fill(code);
  await bob.getByTestId('submit-room').click();
  await expect(bob.getByTestId('waiting-host')).toBeVisible();

  await alice.getByTestId('start-game').click();
  await expect(alice.getByTestId('got-five-button')).toBeVisible();
  await expect(bob.getByTestId('got-five-button')).toBeVisible();
  if (!options.keepDraw) {
    // L'annonce du tirage au sort passe avant le tutoriel.
    await dismissRoulette(alice);
    await dismissRoulette(bob);
    await dismissOnboarding(alice);
    await dismissOnboarding(bob);
  }

  // Les boutons de couleur existent des la mise en place, meme derriere
  // l'annonce : la detection fonctionne dans les deux cas.
  const aliceStarts = await hasTheLead(alice);
  return {
    alice,
    bob,
    code,
    first: aliceStarts ? alice : bob,
    second: aliceStarts ? bob : alice,
    firstName: aliceStarts ? names[0] : names[1],
    secondName: aliceStarts ? names[1] : names[0],
  };
}

/** Numeros secrets d'un joueur, lus sur l'ecran de son adversaire. */
export async function readOpponentTiles(page: Page): Promise<number[]> {
  // `>` : uniquement les tuiles du support, pas celles de la zone COMPARER.
  const tiles = page.locator('.player-zone--opponent .rack__column > .tile');
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
 * Joue l'etape 1 du tour : revele une tuile d'une couleur disponible, puis
 * attend que l'etape 2 soit reellement affichee. L'interface se redessine
 * plusieurs fois a l'arrivee d'un nouvel etat : un clic synthetique peut
 * tomber sur un noeud remplace entre-temps, on le rejoue alors une fois.
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
      throw new Error('Aucune couleur disponible');
    }
    try {
      await hint.waitFor({ state: 'visible', timeout: 3000 });
      return;
    } catch {
      // Clic perdu pendant un rendu : on reessaie une fois.
    }
  }
  await expect(hint).toBeVisible();
}

/**
 * Selectionne une tuile de la zone publique et renvoie son numero.
 * Le numero est lu sur l'element reellement clique : la zone publique est
 * triee, une tuile revelee entre-temps decalerait les index.
 */
export async function selectPublicTile(page: Page, index: number): Promise<number> {
  const tile = page.locator('.pool__tiles button.tile').nth(index);
  await expect(tile).toBeVisible();
  const number = Number(await tile.getAttribute('data-tile'));
  await tile.click();
  return number;
}
