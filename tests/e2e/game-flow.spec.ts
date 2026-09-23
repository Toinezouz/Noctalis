import { expect, test } from '@playwright/test';
import {
  dismissRoulette,
  readOpponentTiles,
  revealAnyColor,
  selectPublicTile,
  startGame,
} from './helpers.js';

// Chaque test repart d'un navigateur propre : aucune session ne fuit d'un
// test a l'autre (sessions, fiches de deduction, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Partie complete a deux joueurs', () => {
  test('mise en place, tour complet, CLASSER, COMPARER et changement de tour', async ({
    browser,
  }) => {
    // Le premier joueur est tire au sort : on suit les roles, pas les pseudos.
    const { first, second, firstName, secondName } = await startGame(browser, [
      'Alice',
      'Bob',
    ]);

    // Mise en place : 5 tuiles publiques, une de chaque couleur.
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);
    await expect(second.locator('.pool__tiles .tile')).toHaveCount(5);

    // Chacun voit les 5 tuiles de l'autre, face visible...
    const firstSecrets = await readOpponentTiles(second);
    const secondSecrets = await readOpponentTiles(first);
    expect(firstSecrets).toHaveLength(5);
    expect(secondSecrets).toHaveLength(5);
    // ...triees par ordre croissant.
    expect([...firstSecrets].sort((a, b) => a - b)).toEqual(firstSecrets);
    // ...et les deux mains sont disjointes.
    expect(new Set([...firstSecrets, ...secondSecrets]).size).toBe(10);

    // ...mais personne ne voit ses propres tuiles : 5 dos sur son propre support.
    await expect(first.locator('.player-zone--mine .tile-back')).toHaveCount(5);
    await expect(second.locator('.player-zone--mine .tile-back')).toHaveCount(5);

    // Le joueur tire au sort commence.
    await expect(first.locator('.turn-indicator')).toContainText('À TON TOUR');
    await expect(second.locator('.turn-indicator')).toContainText(`Tour de ${firstName}`);

    // Etape 1 : reveler une tuile.
    await revealAnyColor(first);
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(6);
    await expect(second.locator('.pool__tiles .tile')).toHaveCount(6);
    await expect(first.getByTestId('hint-instruction')).toBeVisible();

    // Etape 2 : choisir n'importe quelle tuile publique (ici la premiere) et CLASSER.
    const chosenNumber = await selectPublicTile(first, 0);
    await first.getByTestId('choose-classify').click();

    // Bob doit repondre : il voit les vrais numeros d'Alice.
    await expect(second.getByTestId('confirm-classify')).toBeVisible();
    await expect(second.getByTestId('confirm-classify')).toBeDisabled();
    await second.locator('.slot-picker__slot').first().click();
    await second.getByTestId('confirm-classify').click();

    // Le serveur place la tuile a la position exacte, visible par les deux.
    const expectedSlot = firstSecrets.filter((n) => n < chosenNumber).length;
    const placed = first.locator(
      `.player-zone--mine .classify-slot[data-slot="${String(expectedSlot)}"] .tile`,
    );
    await expect(placed).toHaveCount(1);
    await expect(placed).toHaveAttribute('data-tile', String(chosenNumber));

    // La tuile utilisee quitte la zone commune, pour les deux joueurs.
    await expect(
      first.locator(`.pool__tiles .tile[data-tile="${String(chosenNumber)}"]`),
    ).toHaveCount(0);
    await expect(
      second.locator(`.pool__tiles .tile[data-tile="${String(chosenNumber)}"]`),
    ).toHaveCount(0);
    // Une revelation, un indice : le centre revient a 5 tuiles disponibles.
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);

    // Le tour passe au second joueur.
    await expect(second.locator('.turn-indicator')).toContainText('À TON TOUR');
    await expect(first.locator('.turn-indicator')).toContainText(`Tour de ${secondName}`);
    await expect(first.getByTestId('reveal-green')).toHaveCount(0);

    // Tour du second joueur : reveal puis COMPARER sur sa position 2.
    await revealAnyColor(second);
    const compareNumber = await selectPublicTile(second, 0);
    await second.getByTestId('choose-compare').click();
    await second.locator('.hint-dialog__rack .tile-back').nth(1).click();
    await second.getByTestId('confirm-compare').click();

    // L'autre joueur confirme la reponse : le serveur impose la verite.
    await expect(first.getByTestId('confirm-compare-answer')).toBeVisible();
    const answerLabel = (await first.getByTestId('confirm-compare-answer').innerText()).trim();
    await first.getByTestId('confirm-compare-answer').click();

    // La tuile comparee est posee devant la position 2 du second joueur.
    const compareArea = second.locator('.player-zone--mine .compare-area .tile');
    await expect(compareArea).toHaveCount(1);
    await expect(compareArea).toHaveAttribute('data-tile', String(compareNumber));
    // Reponse NON : la tuile est inclinee.
    if (answerLabel.includes('NON')) {
      await expect(compareArea).toHaveClass(/tile--tilted/);
    } else {
      await expect(compareArea).not.toHaveClass(/tile--tilted/);
    }

    // L'historique public raconte la partie.
    await expect(first.locator('.game-log')).toContainText('a révélé la tuile');
    await expect(first.locator('.game-log')).toContainText('CLASSER');
  });

  test('GOT FIVE! gagnant : victoire, revelation finale et revanche', async ({ browser }) => {
    const { alice, bob } = await startGame(browser, ['Alice', 'Bob']);
    const aliceSecrets = await readOpponentTiles(bob);

    await alice.getByTestId('got-five-button').click();
    for (const [index, number] of aliceSecrets.entries()) {
      await alice.getByTestId(`got-five-input-${String(index)}`).fill(String(number));
    }
    await alice.getByTestId('submit-guess').click();
    await alice.getByTestId('confirm-guess').click();

    // Les deux joueurs voient la fin de partie.
    await expect(alice.getByTestId('game-over')).toBeVisible();
    await expect(bob.getByTestId('game-over')).toBeVisible();
    await expect(alice.getByTestId('game-over-result')).toContainText('Victoire de Alice');
    await expect(bob.getByTestId('game-over-result')).toContainText('Alice a gagné');

    // Revelation des 10 tuiles secretes.
    await expect(alice.locator('.game-over__tiles .tile')).toHaveCount(10);
    const revealedNumbers = await alice
      .locator('.game-over__tiles .tile')
      .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-tile'))));
    for (const secret of aliceSecrets) {
      expect(revealedNumbers).toContain(secret);
    }

    // Revanche : il faut l'accord des deux joueurs.
    await alice.getByTestId('rematch').click();
    await expect(alice.getByTestId('rematch')).toContainText('En attente');
    await bob.getByTestId('rematch').click();

    // La revanche retire au sort le premier joueur : l'annonce revient.
    await expect(alice.getByTestId('roulette')).toBeVisible();
    await expect(bob.getByTestId('roulette')).toBeVisible();
    await dismissRoulette(alice);
    await dismissRoulette(bob);

    await expect(alice.getByTestId('game-over')).toHaveCount(0);
    await expect(alice.locator('.pool__tiles .tile')).toHaveCount(5);
    await expect(alice.locator('.turn-indicator')).toContainText('Tour 1');
    // Et la main revient bien a l'un des deux joueurs.
    const leads = await Promise.all(
      [alice, bob].map(async (page) => page.locator('[data-testid^="reveal-"]').count()),
    );
    expect(leads.filter((count) => count > 0)).toHaveLength(1);
  });

  test('GOT FIVE! rate : elimination, une seule tentative, la partie continue', async ({
    browser,
  }) => {
    const { alice, bob } = await startGame(browser, ['Alice', 'Bob']);
    const aliceSecrets = await readOpponentTiles(bob);

    // Proposition valide dans sa forme (une couleur par tuile, ordre croissant)
    // mais volontairement fausse.
    const wrong = [1, 2, 3, 4, 5]
      .map((base) => {
        for (let n = base; n <= 60; n += 5) {
          if (!aliceSecrets.includes(n)) {
            return n;
          }
        }
        return base;
      })
      .sort((a, b) => a - b);

    await alice.getByTestId('got-five-button').click();
    for (const [index, number] of wrong.entries()) {
      await alice.getByTestId(`got-five-input-${String(index)}`).fill(String(number));
    }
    await alice.getByTestId('submit-guess').click();
    await alice.getByTestId('confirm-guess').click();

    // Alice est eliminee : plus de bouton GOT FIVE!, et Bob prend la main.
    await expect(alice.getByTestId('got-five-button')).toHaveCount(0);
    await expect(bob.locator('.player-status').filter({ hasText: 'Alice' })).toContainText(
      'Éliminé',
    );
    await expect(bob.locator('.turn-indicator')).toContainText('À TON TOUR');

    // La partie continue : Bob peut jouer son tour.
    await revealAnyColor(bob);
    await expect(bob.locator('.pool__tiles .tile')).toHaveCount(6);
  });

  test('une tuile utilisee reste marquee sur la fiche de deduction', async ({ browser }) => {
    const { first, second } = await startGame(browser, ['Alice', 'Bob']);

    await revealAnyColor(first);
    const used = await selectPublicTile(first, 0);
    await first.getByTestId('choose-classify').click();
    await expect(second.getByTestId('confirm-classify')).toBeVisible();
    await second.locator('.slot-picker__slot').first().click();
    await second.getByTestId('confirm-classify').click();

    // Elle a disparu du centre...
    await expect(first.locator(`.pool__tiles .tile[data-tile="${String(used)}"]`)).toHaveCount(0);
    // ...mais elle est visible sur le support du demandeur, a sa place.
    await expect(
      first.locator(`.player-zone--mine .classify-slot .tile[data-tile="${String(used)}"]`),
    ).toHaveCount(1);
    // ...et la fiche de deduction garde la trace : ce numero est sorti du sac.
    await first.getByTestId('open-sheet').click();
    const cell = first.getByTestId(`sheet-cell-${String(used)}`);
    await expect(cell).toHaveClass(/is-revealed/);
    await expect(cell).toHaveAccessibleName(/déjà révélée au centre/);
  });

  test('impossible de jouer hors de son tour', async ({ browser }) => {
    const { first, second, firstName } = await startGame(browser, ['Alice', 'Bob']);
    // Celui qui n'a pas la main n'a aucun bouton de couleur.
    await expect(second.getByTestId('reveal-green')).toHaveCount(0);
    await expect(second.locator('.action-panel')).toContainText(firstName);
    // Les tuiles publiques ne sont pas selectionnables pour lui.
    await expect(second.locator('.pool__tiles button.tile')).toHaveCount(0);
    await expect(first.getByTestId('reveal-green')).toBeVisible();
  });

  test('erreurs de salon : code inconnu, partie pleine, pseudo trop court', async ({ browser }) => {
    const { code } = await startGame(browser, ['Alice', 'Bob']);
    const page = await (await browser.newContext()).newPage();

    await page.goto('/');
    await page.getByTestId('menu-join').click();
    await page.getByTestId('name-input').fill('Chris');
    await page.getByTestId('code-input').fill('ZZZZZ');
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('home-error')).toContainText("n'existe pas");

    await page.getByTestId('code-input').fill(code);
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('home-error')).toContainText('complète');

    await page.getByTestId('name-input').fill('A');
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('home-error')).toContainText('Pseudo invalide');
  });

  test('reconnexion apres rechargement de page', async ({ browser }) => {
    // On recharge la page du joueur qui a la main : la partie doit rester jouable.
    const { first, second } = await startGame(browser, ['Alice', 'Bob']);
    const opponentSecrets = await readOpponentTiles(first);

    await first.reload();
    await expect(first.getByTestId('got-five-button')).toBeVisible();
    // L'etat est restaure : mes 5 dos, les 5 tuiles adverses, la zone publique.
    await expect(first.locator('.player-zone--mine .tile-back')).toHaveCount(5);
    expect(await readOpponentTiles(first)).toEqual(opponentSecrets);
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);
    // Une reconnexion ne rejoue pas l'annonce du tirage au sort.
    await expect(first.getByTestId('roulette')).toHaveCount(0);
    // Et la partie reste jouable.
    await revealAnyColor(first);
    await expect(second.locator('.pool__tiles .tile')).toHaveCount(6);
  });

  test('deconnexion de l adversaire signalee', async ({ browser }) => {
    const { alice, bob } = await startGame(browser, ['Alice', 'Bob']);
    await bob.close();
    await expect(alice.locator('.player-status').filter({ hasText: 'Bob' })).toContainText(
      'déconnecté',
    );
    // Un bandeau explicite rassure le joueur reste seul.
    await expect(alice.getByTestId('opponent-offline')).toContainText('déconnecté');
  });
});
