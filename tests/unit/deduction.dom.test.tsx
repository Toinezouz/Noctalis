import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TILES, getTileByNumber } from '@noctalis/shared';
import { fr } from '../../client/src/i18n/fr.js';
import { DeductionSheet } from '../../client/src/features/deduction/DeductionSheet.js';
import { useDeductionSheet } from '../../client/src/features/deduction/deductionStore.js';
import { deductionKey } from '../../client/src/lib/storage.js';
import { I18nProvider, type Language } from '../../client/src/i18n/index.js';

const ROOM = 'AB7K9';
const PLAYER = 'p_test';

/** Petit hote qui branche la fiche sur son magasin persistant. */
function SheetHost({
  revealed = [],
  lang = 'fr',
}: {
  revealed?: number[];
  lang?: Language;
}): JSX.Element {
  const sheet = useDeductionSheet(ROOM, PLAYER);
  return (
    <I18nProvider initialLanguage={lang}>
      <DeductionSheet sheet={sheet} revealedNumbers={revealed} />
    </I18nProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  cleanup();
});

describe('Fiche de deduction (composant)', () => {
  it('affiche exactement 60 cases, une par numero, sans doublon', () => {
    render(<SheetHost />);
    const cells = screen.getAllByRole('button', { name: /^Numéro \d+/ });
    expect(cells).toHaveLength(60);
    const numbers = cells.map((cell) => Number(cell.getAttribute('data-number')));
    expect(new Set(numbers).size).toBe(60);
    expect([...numbers].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 60 }, (_, i) => i + 1),
    );
  });

  it('affiche la bonne constellation et le bon nombre d éclats pour les 60 numeros', () => {
    render(<SheetHost />);
    for (const tile of TILES) {
      const cell = screen.getByTestId(`sheet-cell-${String(tile.number)}`);
      expect(cell.getAttribute('data-color')).toBe(tile.color);
      expect(cell.querySelectorAll('.sheet-cell__dot')).toHaveLength(tile.points);
      // La fiche affiche le nom traduit de la constellation, pas le libelle
      // serveur : c'est bien le catalogue du client qui fait foi ici.
      expect(cell.getAttribute('aria-label')).toContain(fr[`color.${tile.color}`]);
      expect(cell.getAttribute('aria-label')).toContain(
        `${String(tile.points)} éclat${tile.points > 1 ? 's' : ''}`,
      );
    }
  });

  it('verifie les exemples officiels de la fiche', () => {
    render(<SheetHost />);
    const expected: [number, string, number][] = [
      [1, 'Lyre', 1],
      [2, 'Aurore', 1],
      [3, 'Cygne', 1],
      [4, 'Braise', 1],
      [5, 'Phénix', 1],
      [6, 'Lyre', 2],
      [10, 'Phénix', 2],
      [11, 'Lyre', 3],
      [15, 'Phénix', 3],
      [16, 'Lyre', 1],
      [17, 'Aurore', 1],
      [37, 'Aurore', 2],
      [56, 'Lyre', 3],
      [60, 'Phénix', 3],
    ];
    for (const [n, color, points] of expected) {
      const cell = screen.getByTestId(`sheet-cell-${String(n)}`);
      expect(cell.getAttribute('aria-label')).toBe(
        `Numéro ${String(n)}, ${color}, ${String(points)} éclat${
          points > 1 ? 's' : ''
        }, non éliminé`,
      );
    }
  });

  it('barre au premier clic et restaure au second', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    const cell = screen.getByTestId('sheet-cell-17');

    expect(cell).toHaveAttribute('aria-pressed', 'false');
    await user.click(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'true');
    expect(cell.querySelector('.sheet-cell__cross')).not.toBeNull();
    expect(cell.getAttribute('aria-label')).toContain('éliminé');
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('1 / 60');

    await user.click(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'false');
    expect(cell.querySelector('.sheet-cell__cross')).toBeNull();
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60');
  });

  it('conserve les deductions apres demontage / remontage', async () => {
    const user = userEvent.setup();
    const first = render(<SheetHost />);
    await user.click(screen.getByTestId('sheet-cell-23'));
    await user.type(screen.getByTestId('guess-input-2'), '31');
    first.unmount();

    render(<SheetHost />);
    expect(screen.getByTestId('sheet-cell-23')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('guess-input-2')).toHaveValue('31');
  });

  it('accepte, nettoie et persiste les 5 hypotheses', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    const values = ['18', '24', '31', '42', '56'];
    for (const [index, value] of values.entries()) {
      await user.type(screen.getByTestId(`guess-input-${String(index)}`), value);
    }
    for (const [index, value] of values.entries()) {
      expect(screen.getByTestId(`guess-input-${String(index)}`)).toHaveValue(value);
    }
    // Les caracteres non numeriques sont ignores.
    await user.clear(screen.getByTestId('guess-input-0'));
    await user.type(screen.getByTestId('guess-input-0'), 'a7b');
    expect(screen.getByTestId('guess-input-0')).toHaveValue('7');

    const stored = JSON.parse(
      window.localStorage.getItem(deductionKey(ROOM, PLAYER)) ?? '{}',
    ) as { guesses: string[]; crossed: number[] };
    expect(stored.guesses).toEqual(['7', '24', '31', '42', '56']);
  });

  it('efface tout apres confirmation, et seulement apres', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    await user.click(screen.getByTestId('sheet-cell-11'));
    await user.type(screen.getByTestId('guess-input-0'), '11');

    // Ouvrir puis annuler : rien n'est efface.
    await user.click(screen.getByTestId('reset-sheet'));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByTestId('sheet-cell-11')).toHaveAttribute('aria-pressed', 'true');

    // Confirmer : tout est reinitialise.
    await user.click(screen.getByTestId('reset-sheet'));
    await user.click(screen.getByTestId('confirm-reset'));
    expect(screen.getByTestId('sheet-cell-11')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('guess-input-0')).toHaveValue('');
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60');
  });

  it('signale les tuiles revelees sans jamais les barrer automatiquement', () => {
    render(<SheetHost revealed={[3, 12, 25, 40, 58]} />);
    for (const n of [3, 12, 25, 40, 58]) {
      const cell = screen.getByTestId(`sheet-cell-${String(n)}`);
      expect(cell.className).toContain('is-revealed');
      expect(cell).toHaveAttribute('aria-pressed', 'false');
      expect(cell.getAttribute('aria-label')).toContain('déjà révélée');
    }
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60');
  });

  it('ne stocke que le raisonnement du joueur, jamais un secret de jeu', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    await user.click(screen.getByTestId('sheet-cell-44'));
    const raw = window.localStorage.getItem(deductionKey(ROOM, PLAYER)) ?? '';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual(['crossed', 'guesses']);
    expect(parsed['crossed']).toEqual([44]);
  });

  it('chaque joueur et chaque partie ont leur propre fiche', async () => {
    const user = userEvent.setup();
    const first = render(<SheetHost />);
    await user.click(screen.getByTestId('sheet-cell-9'));
    first.unmount();

    function OtherPlayerSheet(): JSX.Element {
      const sheet = useDeductionSheet('ZZZZZ', 'p_other');
      return (
        <I18nProvider initialLanguage="fr">
          <DeductionSheet sheet={sheet} revealedNumbers={[]} />
        </I18nProvider>
      );
    }
    render(<OtherPlayerSheet />);
    expect(screen.getByTestId('sheet-cell-9')).toHaveAttribute('aria-pressed', 'false');
  });

  it('se traduit entierement en espagnol', async () => {
    const user = userEvent.setup();
    render(<SheetHost lang="es" revealed={[12]} />);

    expect(screen.getByText('Mi carta celeste')).toBeInTheDocument();
    expect(screen.getByText('Privada: ni el servidor ni tu rival la ven.')).toBeInTheDocument();
    expect(screen.getByTestId('reset-sheet')).toHaveTextContent('Borrar mis deducciones');
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60 tachados');

    const cell = screen.getByTestId('sheet-cell-37');
    expect(cell.getAttribute('aria-label')).toBe('Número 37, Aurora, 2 brillos, no eliminado');
    await user.click(cell);
    expect(cell.getAttribute('aria-label')).toBe('Número 37, Aurora, 2 brillos, eliminado');

    // La ficha revelada garde son repere, dans la langue choisie.
    expect(screen.getByTestId('sheet-cell-12').getAttribute('aria-label')).toContain(
      'ya revelada en el centro',
    );

    // La confirmation de reinitialisation est traduite elle aussi.
    await user.click(screen.getByTestId('reset-sheet'));
    expect(screen.getByText('¿Borrar toda la hoja?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('les 5 lignes de couleur suivent l ordre officiel', () => {
    render(<SheetHost />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(5);
    const expectedRows = [
      [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56],
      [2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57],
      [3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58],
      [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59],
      [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    ];
    rows.forEach((row, index) => {
      const cells = within(row).getAllByRole('gridcell');
      const numbers = cells.map((cell) =>
        Number(cell.querySelector('.sheet-cell')?.getAttribute('data-number')),
      );
      expect(numbers).toEqual(expectedRows[index]);
      // Toutes les cases d'une ligne partagent la couleur de la ligne.
      const colors = new Set(numbers.map((n) => getTileByNumber(n).color));
      expect(colors.size).toBe(1);
    });
  });
});
