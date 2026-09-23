import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TILES, getTileByNumber } from '@umbrastra/shared';
import { fr } from '../../client/src/i18n/fr.js';
import { DeductionSheet } from '../../client/src/features/deduction/DeductionSheet.js';
import { useDeductionSheet } from '../../client/src/features/deduction/deductionStore.js';
import { deductionKey } from '../../client/src/lib/storage.js';
import { I18nProvider, type Language } from '../../client/src/i18n/index.js';

const ROOM = 'AB7K9';
const PLAYER = 'p_test';

/** A small host wiring the chart to its persistent store. */
function SheetHost({
  revealed = [],
  held = [],
  lang = 'fr',
}: {
  revealed?: number[];
  held?: number[];
  lang?: Language;
}): JSX.Element {
  const sheet = useDeductionSheet(ROOM, PLAYER);
  return (
    <I18nProvider initialLanguage={lang}>
      <DeductionSheet sheet={sheet} revealedNumbers={revealed} heldNumbers={held} />
    </I18nProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  cleanup();
});

describe('Star chart (component)', () => {
  it('shows exactly 60 cells, one per number, no duplicate', () => {
    render(<SheetHost />);
    const cells = screen.getAllByRole('button', { name: /^Numéro \d+/ });
    expect(cells).toHaveLength(60);
    const numbers = cells.map((cell) => Number(cell.getAttribute('data-number')));
    expect(new Set(numbers).size).toBe(60);
    expect([...numbers].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 60 }, (_, i) => i + 1),
    );
  });

  it('shows the right constellation and brightness for all 60 numbers', () => {
    render(<SheetHost />);
    for (const tile of TILES) {
      const cell = screen.getByTestId(`sheet-cell-${String(tile.number)}`);
      expect(cell.getAttribute('data-color')).toBe(tile.color);
      expect(cell.querySelectorAll('.sheet-cell__dot')).toHaveLength(tile.points);
      // The chart shows the translated constellation name, not the server
      // label: the client's catalogue is the reference here.
      expect(cell.getAttribute('aria-label')).toContain(fr[`color.${tile.color}`]);
      expect(cell.getAttribute('aria-label')).toContain(
        `${String(tile.points)} éclat${tile.points > 1 ? 's' : ''}`,
      );
    }
  });

  it('matches the reference examples of the chart', () => {
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
        }, encore possible`,
      );
    }
  });

  it('crosses out on the first tap and restores on the second', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    const cell = screen.getByTestId('sheet-cell-17');

    expect(cell).toHaveAttribute('aria-pressed', 'false');
    await user.click(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'true');
    expect(cell.querySelector('.sheet-cell__cross')).not.toBeNull();
    expect(cell.getAttribute('aria-label')).toContain('barré');
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('1 / 60');

    await user.click(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'false');
    expect(cell.querySelector('.sheet-cell__cross')).toBeNull();
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60');
  });

  it('keeps the deductions across unmount / remount', async () => {
    const user = userEvent.setup();
    const first = render(<SheetHost />);
    await user.click(screen.getByTestId('sheet-cell-23'));
    await user.type(screen.getByTestId('guess-input-2'), '31');
    first.unmount();

    render(<SheetHost />);
    expect(screen.getByTestId('sheet-cell-23')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('guess-input-2')).toHaveValue('31');
  });

  it('accepts, cleans and saves the 5 guesses', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    const values = ['18', '24', '31', '42', '56'];
    for (const [index, value] of values.entries()) {
      await user.type(screen.getByTestId(`guess-input-${String(index)}`), value);
    }
    for (const [index, value] of values.entries()) {
      expect(screen.getByTestId(`guess-input-${String(index)}`)).toHaveValue(value);
    }
    // Non-digit characters are ignored.
    await user.clear(screen.getByTestId('guess-input-0'));
    await user.type(screen.getByTestId('guess-input-0'), 'a7b');
    expect(screen.getByTestId('guess-input-0')).toHaveValue('7');

    const stored = JSON.parse(
      window.localStorage.getItem(deductionKey(ROOM, PLAYER)) ?? '{}',
    ) as { guesses: string[]; crossed: number[] };
    expect(stored.guesses).toEqual(['7', '24', '31', '42', '56']);
  });

  it('clears everything after confirmation, and only then', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    await user.click(screen.getByTestId('sheet-cell-11'));
    await user.type(screen.getByTestId('guess-input-0'), '11');

    // Open then cancel: nothing is cleared.
    await user.click(screen.getByTestId('reset-sheet'));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByTestId('sheet-cell-11')).toHaveAttribute('aria-pressed', 'true');

    // Confirm: everything is reset.
    await user.click(screen.getByTestId('reset-sheet'));
    await user.click(screen.getByTestId('confirm-reset'));
    expect(screen.getByTestId('sheet-cell-11')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('guess-input-0')).toHaveValue('');
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60');
  });

  it('marks revealed stars without ever crossing them out', () => {
    render(<SheetHost revealed={[3, 12, 25, 40, 58]} />);
    for (const n of [3, 12, 25, 40, 58]) {
      const cell = screen.getByTestId(`sheet-cell-${String(n)}`);
      expect(cell.className).toContain('is-revealed');
      expect(cell).toHaveAttribute('aria-pressed', 'false');
      expect(cell.getAttribute('aria-label')).toContain('déjà révélée');
      expect(cell.querySelector('.sheet-cell__revealed')).not.toBeNull();
    }
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60');
  });

  it('only stores the player\'s reasoning, never a game secret', async () => {
    const user = userEvent.setup();
    render(<SheetHost />);
    await user.click(screen.getByTestId('sheet-cell-44'));
    const raw = window.localStorage.getItem(deductionKey(ROOM, PLAYER)) ?? '';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual(['crossed', 'guesses']);
    expect(parsed['crossed']).toEqual([44]);
  });

  it('every player and every game has its own chart', async () => {
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

  it('is fully translated into Spanish', async () => {
    const user = userEvent.setup();
    render(<SheetHost lang="es" revealed={[12]} />);

    expect(screen.getByText('Mi carta celeste')).toBeInTheDocument();
    expect(screen.getByText('Solo para ti: nadie más la ve.')).toBeInTheDocument();
    expect(screen.getByTestId('reset-sheet')).toHaveTextContent('Borrar mi carta');
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60 tachados');

    const cell = screen.getByTestId('sheet-cell-37');
    expect(cell.getAttribute('aria-label')).toBe('Número 37, Aurora, 2 destellos, aún posible');
    await user.click(cell);
    expect(cell.getAttribute('aria-label')).toBe('Número 37, Aurora, 2 destellos, tachado');

    // The revealed star keeps its landmark, in the chosen language.
    expect(screen.getByTestId('sheet-cell-12').getAttribute('aria-label')).toContain(
      'ya revelada en el cielo',
    );

    // The reset confirmation is translated too.
    await user.click(screen.getByTestId('reset-sheet'));
    expect(screen.getByText('¿Borrar toda la carta?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('the 5 constellation rows follow the reference order', () => {
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
      // Every cell of a row shares the row's constellation.
      const colors = new Set(numbers.map((n) => getTileByNumber(n).color));
      expect(colors.size).toBe(1);
    });
  });

  it('marks the stars held by others, still without crossing them out', () => {
    render(<SheetHost held={[8, 19, 33]} lang="en" />);
    for (const n of [8, 19, 33]) {
      const cell = screen.getByTestId(`sheet-cell-${String(n)}`);
      expect(cell.className).toContain('is-held');
      expect(cell).toHaveAttribute('aria-pressed', 'false');
      expect(cell.getAttribute('aria-label')).toContain('held by someone else');
    }
    expect(screen.getByTestId('sheet-cell-9').className).not.toContain('is-held');
    expect(screen.getByText(/cannot be yours/)).toBeInTheDocument();
    expect(screen.getByTestId('crossed-count')).toHaveTextContent('0 / 60');
  });

  it('reads naturally in English', () => {
    render(<SheetHost lang="en" />);
    expect(screen.getByText('My star chart')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-cell-60').getAttribute('aria-label')).toBe(
      'Number 60, Phoenix, 3 sparks, still possible',
    );
  });
});
