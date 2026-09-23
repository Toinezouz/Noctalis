import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../client/src/i18n/index.js';
import { StartRoulette, HOLD_MS, SPIN_MS } from '../../client/src/features/game/StartRoulette.js';
import { sectorAtPointer } from '../../client/src/lib/roulette.js';

const PLAYERS = [
  { id: 'p_alice', name: 'Alice' },
  { id: 'p_bob', name: 'Bob' },
];

/** Avance les minuteries en laissant React appliquer ses rendus. */
async function advance(ms: number): Promise<void> {
  await act(() => {
    vi.advanceTimersByTime(ms);
    return Promise.resolve();
  });
}

function show(startingPlayerId: string, myId: string, onDone = (): void => {}): void {
  render(
    <I18nProvider initialLanguage="fr">
      <StartRoulette
        players={PLAYERS}
        startingPlayerId={startingPlayerId}
        myId={myId}
        onDone={onDone}
      />
    </I18nProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('Roulette d ouverture (composant)', () => {
  it('pose la question pendant la rotation, puis annonce le joueur tire', async () => {
    show('p_bob', 'p_alice');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Qui commence ?');
    expect(screen.getByTestId('roulette-note')).toHaveTextContent('La roue tourne');

    await advance(SPIN_MS + 200);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Bob commence !');
    expect(screen.getByTestId('roulette-note')).toHaveTextContent('Bob ouvre la partie');
  });

  it('dit au joueur tire que c est a lui', async () => {
    show('p_alice', 'p_alice');
    await advance(SPIN_MS + 200);
    expect(screen.getByTestId('roulette-note')).toHaveTextContent('Le sort te désigne');
  });

  it('arrete la roue sur le secteur du joueur tire', async () => {
    show('p_bob', 'p_alice');
    const wheel = document.querySelector('.roulette__wheel')!;
    // Au depart : aucune rotation, le navigateur doit peindre 0 degre.
    expect(wheel.getAttribute('style')).toContain('--spin: 0deg');

    await advance(SPIN_MS + 200);
    const spin = Number(/--spin: (-?\d+)deg/.exec(wheel.getAttribute('style') ?? '')?.[1]);
    expect(Number.isFinite(spin)).toBe(true);
    // Bob est le second secteur : c'est lui qui doit se trouver sous l'aiguille.
    expect(sectorAtPointer(spin, PLAYERS.length)).toBe(1);
  });

  it('se ferme toute seule apres l annonce', async () => {
    const onDone = vi.fn();
    show('p_bob', 'p_alice', onDone);

    await advance(SPIN_MS + 200);
    expect(onDone).not.toHaveBeenCalled();
    await advance(HOLD_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('laisse passer l animation d un clic', async () => {
    const onDone = vi.fn();
    show('p_bob', 'p_alice', onDone);
    const button = screen.getByTestId('roulette-continue');
    expect(button).toHaveTextContent('Passer');
    await act(() => {
      button.click();
      return Promise.resolve();
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('affiche les deux joueurs sur la roue', () => {
    show('p_bob', 'p_alice');
    const labels = [...document.querySelectorAll('.roulette__label-text')].map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(['Alice', 'Bob']);
  });
});
