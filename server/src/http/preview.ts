import { validateRoomCode } from '@umbrastra/shared';

/**
 * Link previews.
 *
 * When someone pastes an UMBRASTRA link in a chat app, the app fetches the page
 * and reads its Open Graph tags to draw a card: title, description, image.
 * Those apps do not run JavaScript, so the tags must already be in the HTML
 * the server sends.
 *
 * index.html carries a default block between two markers; the server swaps it
 * for one built here, which adds what a static file cannot know:
 *   - absolute URLs (most apps ignore a relative image);
 *   - a dedicated card for invite links (`/?join=CODE`);
 *   - the language of the person who shared the link (`&lang=fr`).
 *
 * Nothing here depends on a game's state: the card only repeats the code that
 * is already in the link.
 */

export const PREVIEW_START = '<!-- preview:start -->';
export const PREVIEW_END = '<!-- preview:end -->';

export const OG_IMAGE_PATH = '/og-image.jpg';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

export type PreviewLang = 'en' | 'fr' | 'es';

interface PreviewText {
  locale: string;
  title: string;
  description: string;
  inviteTitle: string;
  inviteDescription: (code: string) => string;
  imageAlt: string;
}

const TEXT: Record<PreviewLang, PreviewText> = {
  en: {
    locale: 'en_US',
    title: 'UMBRASTRA - Find your constellation before anyone else',
    description:
      "You can see everyone's stars except your own. A free online deduction game for 2 to 4 people: no sign-up, no ads.",
    inviteTitle: 'A game of UMBRASTRA is waiting for you',
    inviteDescription: (code) =>
      `Game code ${code}. Open the link, pick a name and take your seat: free, in your browser, no sign-up.`,
    imageAlt: 'Glowing star medallions on a night-sky game table, next to the UMBRASTRA name.',
  },
  fr: {
    locale: 'fr_FR',
    title: 'UMBRASTRA - Devine ta constellation avant les autres',
    description:
      'Tu vois les étoiles de tout le monde, sauf les tiennes. Un jeu de déduction en ligne pour 2 à 4 personnes, gratuit, sans inscription ni publicité.',
    inviteTitle: 'Une partie d’UMBRASTRA t’attend',
    inviteDescription: (code) =>
      `Code de la partie : ${code}. Ouvre le lien, choisis un pseudo et prends place : gratuit, dans le navigateur, sans inscription.`,
    imageAlt: 'Des médaillons d’étoiles lumineux sur une table de jeu couleur ciel de nuit, à côté du nom UMBRASTRA.',
  },
  es: {
    locale: 'es_ES',
    title: 'UMBRASTRA - Adivina tu constelación antes que nadie',
    description:
      'Ves las estrellas de todo el mundo, menos las tuyas. Un juego de deducción en línea para 2 a 4 personas, gratis, sin registro ni anuncios.',
    inviteTitle: 'Te espera una partida de UMBRASTRA',
    inviteDescription: (code) =>
      `Código de la partida: ${code}. Abre el enlace, elige un nombre y toma asiento: gratis, en el navegador, sin registro.`,
    imageAlt: 'Medallones de estrellas luminosos sobre una mesa de juego color cielo nocturno, junto al nombre UMBRASTRA.',
  },
};

/** Escapes a value placed inside a double-quoted HTML attribute. */
export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Reads the `lang` query parameter; anything unknown falls back to English. */
export function toPreviewLang(raw: unknown): PreviewLang {
  return raw === 'fr' || raw === 'es' ? raw : 'en';
}

/** Reads the `join` query parameter; only a well-formed room code is kept. */
export function toInviteCode(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const checked = validateRoomCode(raw);
  return checked.ok ? checked.value : null;
}

/**
 * The public address of the site, without a trailing slash, or null when it
 * cannot be trusted.
 *
 * A configured address (PUBLIC_URL, or RENDER_EXTERNAL_URL which Render sets
 * by itself) always wins. Otherwise the request's own host is used, but only
 * when it looks like a plain host name: the Host header comes from the
 * visitor and must not be able to inject anything into the page.
 */
export function resolveOrigin(
  configured: string | undefined,
  request: { protocol: string; host: string | undefined },
): string | null {
  if (configured) {
    try {
      const url = new URL(configured.includes('://') ? configured : `https://${configured}`);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        return url.origin;
      }
    } catch {
      // Fall back to the request below.
    }
  }
  const protocol = request.protocol === 'https' ? 'https' : request.protocol === 'http' ? 'http' : null;
  const host = request.host ?? '';
  if (!protocol || !/^[A-Za-z0-9.-]{1,253}(:\d{1,5})?$/.test(host)) {
    return null;
  }
  return `${protocol}://${host}`;
}

export interface PreviewOptions {
  /** Absolute origin (`https://example.org`), or null to keep relative URLs. */
  origin: string | null;
  lang: PreviewLang;
  /** Room code of an invite link, already validated. */
  inviteCode: string | null;
}

/** The Open Graph and Twitter tags for one page view. */
export function buildPreviewTags({ origin, lang, inviteCode }: PreviewOptions): string {
  const text = TEXT[lang];
  const base = origin ?? '';
  const title = inviteCode ? text.inviteTitle : text.title;
  const description = inviteCode ? text.inviteDescription(inviteCode) : text.description;
  const tags: [string, string, string][] = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'UMBRASTRA'],
    ['property', 'og:locale', text.locale],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:image', `${base}${OG_IMAGE_PATH}`],
    ['property', 'og:image:type', 'image/jpeg'],
    ['property', 'og:image:width', String(OG_IMAGE_WIDTH)],
    ['property', 'og:image:height', String(OG_IMAGE_HEIGHT)],
    ['property', 'og:image:alt', text.imageAlt],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', `${base}${OG_IMAGE_PATH}`],
    ['name', 'twitter:image:alt', text.imageAlt],
  ];
  if (origin) {
    const url = new URL('/', origin);
    if (inviteCode) {
      url.searchParams.set('join', inviteCode);
    }
    tags.splice(1, 0, ['property', 'og:url', url.toString()]);
  }
  return tags
    .map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeAttribute(value)}" />`)
    .join('\n    ');
}

/**
 * Swaps the default preview block of index.html for the one of this view.
 * Without the markers, the page is returned untouched.
 */
export function renderIndexHtml(template: string, options: PreviewOptions): string {
  const start = template.indexOf(PREVIEW_START);
  const end = template.indexOf(PREVIEW_END);
  if (start === -1 || end === -1 || end < start) {
    return template;
  }
  return (
    template.slice(0, start + PREVIEW_START.length) +
    '\n    ' +
    buildPreviewTags(options) +
    '\n    ' +
    template.slice(end)
  );
}
