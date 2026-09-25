import { useEffect, useRef, useState } from 'react';

/**
 * Ids that appeared after the component mounted, for `durationMs`. Used to
 * celebrate what just happened (a star just placed) without replaying the
 * animation for everything already on the table when a page opens or
 * reconnects.
 */
export function useFreshIds(ids: readonly string[], durationMs = 2800): ReadonlySet<string> {
  const known = useRef<Set<string> | null>(null);
  const timers = useRef<number[]>([]);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set());
  const key = ids.join('|');

  useEffect(() => {
    if (known.current === null) {
      known.current = new Set(ids);
      return;
    }
    const seen = known.current;
    const added = ids.filter((id) => !seen.has(id));
    added.forEach((id) => seen.add(id));
    if (added.length === 0) {
      return;
    }
    setFresh((previous) => new Set([...previous, ...added]));
    timers.current.push(
      window.setTimeout(() => {
        setFresh((previous) => {
          const next = new Set(previous);
          added.forEach((id) => next.delete(id));
          return next;
        });
      }, durationMs),
    );
    // `ids` is summed up by `key`: a new array with the same ids is no change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, durationMs]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
    },
    [],
  );

  return fresh;
}
