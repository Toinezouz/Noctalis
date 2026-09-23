import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../client/src/i18n/index.js';
import { StartRoulette, HOLD_MS, SPIN_MS } from '../../client/src/features/game/StartRoulette.js';
import { sectorAtPointer } from '../../client/src/lib/roulette.js';

const PLAYERS = [
  { id: 'p_alice', name: 'Alice' },
  { id: 'p_bob', name: 'Bob' },
];

/** Moves timers forward while letting React render. */
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

describe('Opening wheel (component)', () => {
  it('asks the question while spinning, then announces who starts', async () => {
    show('p_bob', 'p_alice');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Qui commence ?');
    expect(screen.getByTestId('roulette-note')).toHaveTextContent('Le ciel tourne');

    await advance(SPIN_MS + 200);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Bob commence !');
    expect(screen.getByTestId('roulette-note')).toHaveTextContent('Bob ouvre la partie');
  });

  it('tells the drawn player it is their turn to open', async () => {
    show('p_alice', 'p_alice');
    await advance(SPIN_MS + 200);
    expect(screen.getByTestId('roulette-note')).toHaveTextContent('Les étoiles ont parlé');
  });

  it('stops the wheel on the drawn player\'s sector', async () => {
    show('p_bob', 'p_alice');
    const wheel = document.querySelector('.roulette__wheel')!;
    // At first: no rotation, the browser must paint 0 degrees.
    expect(wheel.getAttribute('style')).toContain('--spin: 0deg');

    await advance(SPIN_MS + 200);
    const spin = Number(/--spin: (-?\d+)deg/.exec(wheel.getAttribute('style') ?? '')?.[1]);
    expect(Number.isFinite(spin)).toBe(true);
    // Bob is the second sector: he must end up under the pointer.
    expect(sectorAtPointer(spin, PLAYERS.length)).toBe(1);
  });

  it('closes by itself after the announcement', async () => {
    const onDone = vi.fn();
    show('p_bob', 'p_alice', onDone);

    await advance(SPIN_MS + 200);
    expect(onDone).not.toHaveBeenCalled();
    await advance(HOLD_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('lets one click skip the animation', async () => {
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

  it('shows every player on the wheel', () => {
    show('p_bob', 'p_alice');
    const labels = [...document.querySelectorAll('.roulette__label-text')].map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(['Alice', 'Bob']);
  });

  it('seats four players on the wheel, and stops on the fourth', async () => {
    cleanup();
    const four = [...PLAYERS, { id: 'p_chloe', name: 'Chloé' }, { id: 'p_dany', name: 'Dany' }];
    render(
      <I18nProvider initialLanguage="en">
        <StartRoulette players={four} startingPlayerId="p_dany" myId="p_alice" onDone={() => {}} />
      </I18nProvider>,
    );
    const labels = [...document.querySelectorAll('.roulette__label-text')].map((n) => n.textContent);
    expect(labels).toEqual(['Alice', 'Bob', 'Chloé', 'Dany']);
    await advance(SPIN_MS + 200);
    const wheel = document.querySelector('.roulette__wheel')!;
    const spin = Number(/--spin: (-?\d+)deg/.exec(wheel.getAttribute('style') ?? '')?.[1]);
    expect(sectorAtPointer(spin, four.length)).toBe(3);
    expect(screen.getByTestId('roulette-note')).toHaveTextContent('Dany opens the game');
  });
});
