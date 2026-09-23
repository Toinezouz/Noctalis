import { validateRoomCode } from '@noctalis/shared';

/**
 * Invite links: `https://<host>/?join=AB7K9`.
 *
 * Opening one lands on the "join" form with the code already filled in, so
 * the person invited only has to pick a name. The optional `lang` parameter
 * only tells the server which language to use for the link preview (see
 * server/src/http/preview.ts); the game itself keeps following the visitor's
 * own language.
 */
export const INVITE_PARAM = 'join';

/** The room code carried by a URL, or null when there is none (or it is not a valid code). */
export function readInviteCode(search: string): string | null {
  const raw = new URLSearchParams(search).get(INVITE_PARAM);
  if (raw === null) {
    return null;
  }
  const checked = validateRoomCode(raw);
  return checked.ok ? checked.value : null;
}

/** Builds the link to send to the people you want to play with. */
export function buildInviteLink(origin: string, code: string, lang?: string): string {
  const url = new URL('/', origin);
  url.searchParams.set(INVITE_PARAM, code);
  if (lang) {
    url.searchParams.set('lang', lang);
  }
  return url.toString();
}

/**
 * Removes the invite from the address bar once it has been used, so that a
 * reload or a bookmark does not bring the join form back for an old game.
 */
export function clearInviteFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(INVITE_PARAM) && !url.searchParams.has('lang')) {
      return;
    }
    url.searchParams.delete(INVITE_PARAM);
    url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Nothing to do: the address bar simply keeps the link.
  }
}
