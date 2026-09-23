import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RoomState } from '@noctalis/shared';
import { I18nProvider, type Language } from '../../client/src/i18n/index.js';
import { RoomLobby } from '../../client/src/features/room/RoomLobby.js';
import { clearInviteFromUrl } from '../../client/src/lib/invite.js';

const room: RoomState = {
  code: 'AB7K9',
  status: 'waiting',
  players: [{ id: 'p-host', name: 'Alex', connected: true, isHost: true }],
  canStart: false,
  rematchReady: [],
  createdAt: 0,
};

function showLobby(lang: Language = 'fr'): void {
  render(
    <I18nProvider initialLanguage={lang}>
      <RoomLobby room={room} myId="p-host" onStart={() => {}} onLeave={() => {}} />
    </I18nProvider>,
  );
}

function mockClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
  window.history.replaceState(null, '', '/');
});

describe('Invite link in the lobby', () => {
  it('shows a link that fills in the code, in the language of the person sharing', () => {
    showLobby('fr');
    const field = screen.getByTestId('invite-link');
    expect(field).toHaveValue(`${window.location.origin}/?join=AB7K9&lang=fr`);
    expect(field).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Lien d’invitation')).toBe(field);
  });

  it('copies the link and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    showLobby('en');
    await userEvent.click(screen.getByTestId('copy-link'));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/?join=AB7K9&lang=en`);
    expect(screen.getByTestId('copy-link')).toHaveTextContent('Link copied!');
  });

  it('still copies the bare code for those who prefer it', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    showLobby('es');
    await userEvent.click(screen.getByTestId('copy-code'));
    expect(writeText).toHaveBeenCalledWith('AB7K9');
    expect(screen.getByTestId('copy-code')).toHaveTextContent('¡Copiado!');
  });

  it('explains what to do when copying is impossible', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    showLobby('fr');
    await userEvent.click(screen.getByTestId('copy-link'));
    expect(screen.getByTestId('copy-feedback')).toHaveTextContent(
      'La copie n’a pas marché : sélectionne le lien et copie-le à la main.',
    );
  });
});

describe('Address bar', () => {
  it('drops the invite once it has been used, and keeps the rest', () => {
    window.history.replaceState(null, '', '/?join=AB7K9&lang=fr&other=1#top');
    clearInviteFromUrl();
    expect(window.location.search).toBe('?other=1');
    expect(window.location.hash).toBe('#top');
  });
});
