import { expect, test } from '@playwright/test';
import { startGame } from './helpers.js';

// Chaque test repart d'un navigateur propre : aucune session ne fuit d'un
// test a l'autre (sessions, fiches de deduction, sockets).
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

test.describe('Fiche de deduction', () => {
  test('grille complete, toggle, persistance et reinitialisation', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Alicia', 'Bobby']);

    // 1. Ouvrir la fiche
    await alice.getByTestId('open-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toBeVisible();

    // La grille contient exactement 60 cases, numerotees de 1 a 60.
    const cells = alice.locator('.sheet-cell');
    await expect(cells).toHaveCount(60);
    const numbers = await cells.evaluateAll((nodes) =>
      nodes.map((n) => Number(n.getAttribute('data-number'))),
    );
    expect(new Set(numbers).size).toBe(60);
    expect([...numbers].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 60 }, (_, i) => i + 1),
    );

    // Constellations et eclats : la carte lit la meme source que les etoiles.
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

    // 3-4. Cliquer sur 17 : il est barre.
    const cell17 = alice.getByTestId('sheet-cell-17');
    await expect(cell17).toHaveAttribute('aria-pressed', 'false');
    await cell17.click();
    await expect(cell17).toHaveAttribute('aria-pressed', 'true');
    await expect(cell17.locator('.sheet-cell__cross')).toBeVisible();
    await expect(cell17).toHaveAccessibleName(/éliminé/);

    // 5-6. Recliquer : il est restaure.
    await cell17.click();
    await expect(cell17).toHaveAttribute('aria-pressed', 'false');
    await expect(cell17.locator('.sheet-cell__cross')).toHaveCount(0);

    // On le barre de nouveau, avec quelques autres.
    await cell17.click();
    await alice.getByTestId('sheet-cell-42').click();
    await expect(alice.getByTestId('crossed-count')).toContainText('2 / 60');

    // 7. Inscrire les 5 hypotheses.
    const guesses = ['18', '24', '31', '42', '56'];
    for (const [index, value] of guesses.entries()) {
      await alice.getByTestId(`guess-input-${String(index)}`).fill(value);
    }

    // 8-10. Fermer puis rouvrir : tout est conserve.
    await alice.getByTestId('close-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toHaveCount(0);
    await alice.getByTestId('open-sheet').click();
    await expect(alice.getByTestId('deduction-sheet')).toBeVisible();
    await expect(alice.getByTestId('sheet-cell-17')).toHaveAttribute('aria-pressed', 'true');
    await expect(alice.getByTestId('sheet-cell-42')).toHaveAttribute('aria-pressed', 'true');
    for (const [index, value] of guesses.entries()) {
      await expect(alice.getByTestId(`guess-input-${String(index)}`)).toHaveValue(value);
    }

    // La fiche survit aussi a un rechargement de page (reconnexion).
    await alice.reload();
    await expect(alice.getByTestId('announce-button')).toBeVisible();
    await alice.getByTestId('open-sheet').click();
    await expect(alice.getByTestId('sheet-cell-17')).toHaveAttribute('aria-pressed', 'true');
    await expect(alice.getByTestId('guess-input-1')).toHaveValue('24');

    // 11-13. Effacer les deductions, avec confirmation.
    await alice.getByTestId('reset-sheet').click();
    await alice.getByTestId('confirm-reset').click();
    await expect(alice.getByTestId('sheet-cell-17')).toHaveAttribute('aria-pressed', 'false');
    await expect(alice.getByTestId('sheet-cell-42')).toHaveAttribute('aria-pressed', 'false');
    await expect(alice.getByTestId('crossed-count')).toContainText('0 / 60');
    for (let index = 0; index < 5; index += 1) {
      await expect(alice.getByTestId(`guess-input-${String(index)}`)).toHaveValue('');
    }
  });

  test('la carte ne barre jamais automatiquement une etoile revelee', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Anna', 'Boris']);
    await alice.getByTestId('open-sheet').click();

    // Les 5 etoiles initiales du releve portent un repere, aucune n'est barree.
    const revealed = alice.locator('.sheet-cell.is-revealed');
    await expect(revealed).toHaveCount(5);
    await expect(alice.locator('.sheet-cell.is-crossed')).toHaveCount(0);
    await expect(alice.getByTestId('crossed-count')).toContainText('0 / 60');
  });

  test('accessibilite : clavier et libelles', async ({ browser }) => {
    const { alice } = await startGame(browser, ['Ada', 'Bo']);
    await alice.getByTestId('open-sheet').click();

    const cell = alice.getByTestId('sheet-cell-37');
    // Idem : l'etoile 37 peut faire partie des 5 etoiles initiales du releve,
    // ce qui ajoute une precision a la fin du libelle.
    await expect(cell).toHaveAccessibleName(/^Numéro 37, Aurore, 2 éclats, non éliminé/);
    await cell.focus();
    await expect(cell).toBeFocused();
    await alice.keyboard.press('Enter');
    await expect(cell).toHaveAccessibleName(/^Numéro 37, Aurore, 2 éclats, éliminé/);
    await expect(cell).toBeFocused();
    await alice.keyboard.press('Enter');
    await expect(cell).toHaveAccessibleName(/non éliminé/);
  });
});
