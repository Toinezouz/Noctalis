import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buildPreviewTags,
  escapeAttribute,
  renderIndexHtml,
  resolveOrigin,
  toInviteCode,
  toPreviewLang,
  PREVIEW_END,
  PREVIEW_START,
} from '../../server/src/http/preview.js';
import { createNoctalisServer, type NoctalisServer } from '../../server/src/createServer.js';
import { buildInviteLink, readInviteCode } from '../../client/src/lib/invite.js';

const TEMPLATE = `<!doctype html><html><head>
    ${PREVIEW_START}
    <meta property="og:title" content="default" />
    ${PREVIEW_END}
    <title>NOCTALIS</title></head><body><div id="root"></div></body></html>`;

describe('Invite links (client side)', () => {
  it('builds a link that carries the code and the language', () => {
    const link = buildInviteLink('https://noctalis.example', 'AB7K9', 'fr');
    expect(link).toBe('https://noctalis.example/?join=AB7K9&lang=fr');
    expect(readInviteCode(new URL(link).search)).toBe('AB7K9');
  });

  it('accepts a code typed in lower case, refuses anything else', () => {
    expect(readInviteCode('?join=ab7k9')).toBe('AB7K9');
    expect(readInviteCode('')).toBeNull();
    expect(readInviteCode('?join=')).toBeNull();
    expect(readInviteCode('?join=TOOLONGCODE')).toBeNull();
    expect(readInviteCode('?join=<b>1</b>')).toBeNull();
  });
});

describe('Link preview tags', () => {
  it('uses absolute addresses when the origin is known', () => {
    const tags = buildPreviewTags({ origin: 'https://noctalis.example', lang: 'en', inviteCode: null });
    expect(tags).toContain('<meta property="og:image" content="https://noctalis.example/og-image.jpg" />');
    expect(tags).toContain('<meta property="og:url" content="https://noctalis.example/" />');
    expect(tags).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  it('gives invite links their own card, in the language of the person sharing', () => {
    const fr = buildPreviewTags({ origin: 'https://noctalis.example', lang: 'fr', inviteCode: 'AB7K9' });
    expect(fr).toContain('content="Une partie de NOCTALIS t’attend"');
    expect(fr).toContain('Code de la partie : AB7K9.');
    expect(fr).toContain('<meta property="og:url" content="https://noctalis.example/?join=AB7K9" />');
    expect(fr).toContain('content="fr_FR"');
    const es = buildPreviewTags({ origin: null, lang: 'es', inviteCode: 'AB7K9' });
    expect(es).toContain('Te espera una partida de NOCTALIS');
    // Without a trusted origin, no og:url and a relative image.
    expect(es).not.toContain('og:url');
    expect(es).toContain('content="/og-image.jpg"');
  });

  it('escapes what goes into attributes', () => {
    expect(escapeAttribute(`"><script>&`)).toBe('&quot;&gt;&lt;script&gt;&amp;');
    const en = buildPreviewTags({ origin: null, lang: 'en', inviteCode: null });
    // The apostrophe of "everyone's" is safe inside a double-quoted attribute.
    expect(en).toContain("everyone's stars");
    expect(en).not.toMatch(/content="[^"]*<[^"]*"/);
  });

  it('only keeps known languages and well-formed codes', () => {
    expect(toPreviewLang('fr')).toBe('fr');
    expect(toPreviewLang('de')).toBe('en');
    expect(toPreviewLang(['fr', 'es'])).toBe('en');
    expect(toInviteCode('ab7k9')).toBe('AB7K9');
    expect(toInviteCode(['AB7K9'])).toBeNull();
    expect(toInviteCode('"><x')).toBeNull();
  });

  it('replaces only the block between the markers', () => {
    const html = renderIndexHtml(TEMPLATE, { origin: null, lang: 'en', inviteCode: null });
    expect(html).not.toContain('content="default"');
    expect(html).toContain('<title>NOCTALIS</title>');
    expect(html.indexOf(PREVIEW_START)).toBeLessThan(html.indexOf('og:title'));
    expect(html.indexOf('og:title')).toBeLessThan(html.indexOf(PREVIEW_END));
    // A page without markers is served as is.
    expect(renderIndexHtml('<html></html>', { origin: null, lang: 'en', inviteCode: null })).toBe(
      '<html></html>',
    );
  });
});

describe('Public origin', () => {
  it('prefers the configured address, with or without a scheme', () => {
    const request = { protocol: 'http', host: 'evil.example' };
    expect(resolveOrigin('https://noctalis.onrender.com/', request)).toBe('https://noctalis.onrender.com');
    expect(resolveOrigin('noctalis.onrender.com', request)).toBe('https://noctalis.onrender.com');
  });

  it('falls back to the request host only when it is a plain host name', () => {
    expect(resolveOrigin(undefined, { protocol: 'http', host: '192.168.1.20:3001' })).toBe(
      'http://192.168.1.20:3001',
    );
    expect(resolveOrigin(undefined, { protocol: 'http', host: 'a.example/"><script>' })).toBeNull();
    expect(resolveOrigin(undefined, { protocol: 'http', host: undefined })).toBeNull();
    expect(resolveOrigin('', { protocol: 'ftp', host: 'a.example' })).toBeNull();
  });
});

describe('The server fills in the preview', () => {
  let server: NoctalisServer;
  let base = '';
  let dist = '';

  beforeAll(async () => {
    dist = mkdtempSync(path.join(tmpdir(), 'noctalis-dist-'));
    writeFileSync(path.join(dist, 'index.html'), TEMPLATE);
    writeFileSync(path.join(dist, 'og-image.jpg'), 'not really a jpeg');
    server = createNoctalisServer({
      env: 'test',
      serveClient: true,
      clientDist: dist,
      publicUrl: 'https://noctalis.example',
    });
    await new Promise<void>((resolve) => {
      server.httpServer.listen(0, () => {
        resolve();
      });
    });
    base = `http://127.0.0.1:${String((server.httpServer.address() as AddressInfo).port)}`;
  });

  afterAll(async () => {
    await server.close();
    rmSync(dist, { recursive: true, force: true });
  });

  it('serves the home page with the default card', async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('content="https://noctalis.example/og-image.jpg"');
    expect(html).toContain('Find your constellation before anyone else');
  });

  it('serves an invite link with its own card', async () => {
    const html = await (await fetch(`${base}/?join=ab7k9&lang=fr`)).text();
    expect(html).toContain('Code de la partie : AB7K9.');
    expect(html).toContain('content="https://noctalis.example/?join=AB7K9"');
  });

  it('ignores a malformed invite', async () => {
    const html = await (await fetch(`${base}/?join=%22%3E%3Cscript%3E&lang=xx`)).text();
    expect(html).not.toContain('<script>');
    expect(html).toContain('Find your constellation before anyone else');
  });

  it('still serves static files', async () => {
    const res = await fetch(`${base}/og-image.jpg`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('not really a jpeg');
  });
});
