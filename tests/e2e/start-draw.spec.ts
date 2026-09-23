import { expect, test } from '@playwright/test';
import { dismissOnboarding, revealAnyColor, startGame } from './helpers.js';

// Chaque test repart d'un navigateur propre.
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Tirage au sort du premier joueur', () => {
  test('la roulette annonce le meme joueur aux deux, et c est lui qui a la main', async ({
    browser,
  }) => {
    const { alice, bob, first, firstName } = await startGame(browser, ['Alice', 'Bob'], {
      keepDraw: true,
    });

    // Les deux joueurs voient l'annonce, avec les deux noms sur la roue.
    for (const page of [alice, bob]) {
      await expect(page.getByTestId('roulette')).toBeVisible();
      await expect(page.locator('.roulette__title')).toContainText('Qui commence ?');
      await expect(page.locator('.roulette__label-text')).toHaveText(['Alice', 'Bob']);
      // Et rien ne se superpose : le tutoriel de premiere partie attend son tour.
      await expect(page.locator('.modal-backdrop')).toHaveCount(0);
      await expect(page.getByTestId('roulette-continue')).toBeEnabled();
    }

    // La roue s'arrete sur le joueur tire, le meme des deux cotes.
    await expect(alice.locator('.roulette__title')).toContainText(`${firstName} commence !`);
    await expect(bob.locator('.roulette__title')).toContainText(`${firstName} commence !`);

    // Chacun lit l'annonce de son point de vue.
    await expect(first.getByTestId('roulette-note')).toContainText('Le sort te désigne');
    const second = first === alice ? bob : alice;
    await expect(second.getByTestId('roulette-note')).toContainText('ouvre la partie');

    // Et c'est bien ce joueur qui peut jouer.
    await expect(first.getByTestId('reveal-green')).toHaveCount(1);
    await expect(second.locator('[data-testid^="reveal-"]')).toHaveCount(0);

    // L'historique public garde la trace du tirage, chez les deux joueurs.
    for (const page of [alice, bob]) {
      await expect(page.locator('.game-log')).toContainText(`Tirage au sort : ${firstName} commence`);
    }
  });

  test('l annonce se referme toute seule et rend la main au jeu', async ({ browser }) => {
    const { alice, bob, first } = await startGame(browser, ['Alice', 'Bob'], { keepDraw: true });

    // Personne ne reste bloque : l'annonce disparait sans clic.
    await expect(alice.getByTestId('roulette')).toHaveCount(0, { timeout: 15000 });
    await expect(bob.getByTestId('roulette')).toHaveCount(0, { timeout: 15000 });

    // Le tutoriel prend le relais ensuite, puis la partie est jouable.
    await expect(alice.getByTestId('skip-onboarding')).toBeVisible();
    await dismissOnboarding(alice);
    await dismissOnboarding(bob);
    await revealAnyColor(first);
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(6);
  });

  test('un clic passe l animation immediatement', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alice', 'Bob'], { keepDraw: true });
    await expect(alice.getByTestId('roulette-continue')).toContainText('Passer');
    await alice.getByTestId('roulette-continue').click();
    await expect(alice.getByTestId('roulette')).toHaveCount(0);
  });
});
