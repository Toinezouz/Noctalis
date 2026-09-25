import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { getTileByNumber } from '@umbrastra/shared';
import { Celebration } from '../../client/src/features/game/Celebration.js';
import { I18nProvider } from '../../client/src/i18n/index.js';
import { useFreshIds } from '../../client/src/hooks/useFreshIds.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('The end-of-game celebration', () => {
  it('lights up the winner’s five stars, joined by four lines', () => {
    const stars = [4, 10, 42, 48, 51].map((n) => getTileByNumber(n));
    const { container } = render(
      <I18nProvider initialLanguage="en">
        <Celebration stars={stars} title="CONSTELLATION!" />
      </I18nProvider>,
    );
    const root = container.querySelector('.celebration')!;
    expect(root.classList.contains('is-won')).toBe(true);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    const lit = [...container.querySelectorAll('.celebration__star [data-tile]')].map((el) =>
      el.getAttribute('data-tile'),
    );
    expect(lit).toEqual(['4', '10', '42', '48', '51']);
    expect(container.querySelectorAll('.celebration__lines path')).toHaveLength(4);
    expect(container.querySelector('.celebration__bead')).not.toBeNull();
    expect(container.querySelectorAll('.celebration__meteor').length).toBeGreaterThan(0);
    expect(container.querySelector('.celebration__title')).toHaveTextContent('CONSTELLATION!');
  });

  it('keeps only the eclipse when nobody won', () => {
    const { container } = render(<Celebration stars={[]} title="The sky kept its secrets" />);
    expect(container.querySelector('.celebration')!.classList.contains('is-draw')).toBe(true);
    expect(container.querySelector('.celebration__star')).toBeNull();
    expect(container.querySelector('.celebration__bead')).toBeNull();
    expect(container.querySelector('.celebration__meteor')).toBeNull();
    expect(container.querySelector('.celebration__moon')).not.toBeNull();
  });
});

function Probe({ ids }: { ids: string[] }): JSX.Element {
  const fresh = useFreshIds(ids, 1000);
  return <p data-fresh={[...fresh].sort().join(',')} />;
}

describe('What just happened (a star just placed)', () => {
  it('ignores what was already there, flags what arrives, then lets it rest', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Probe ids={['a', 'b']} />);
    const fresh = (): string | null => container.querySelector('p')!.getAttribute('data-fresh');
    // Opening the page (or coming back) replays nothing.
    expect(fresh()).toBe('');

    rerender(<Probe ids={['a', 'b', 'c']} />);
    expect(fresh()).toBe('c');

    // The same ids in a new array are no news.
    rerender(<Probe ids={['a', 'b', 'c']} />);
    expect(fresh()).toBe('c');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fresh()).toBe('');
  });
});
