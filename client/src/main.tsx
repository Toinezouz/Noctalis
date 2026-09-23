import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jost';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/game.css';
import './styles/deduction.css';
import './styles/screens.css';
import { App } from './app/App.js';
import { GameProvider } from './app/GameContext.js';
import { ToastProvider } from './hooks/useToasts.js';
import { I18nProvider, detectLanguage, type Language } from './i18n/index.js';
import {
  clearSession,
  loadPreferences,
  loadSession,
  migrateLegacyStorage,
  savePreferences,
} from './lib/storage.js';
import { readInviteCode } from './lib/invite.js';

const container = document.getElementById('root');
if (!container) {
  throw new Error("#root element missing from index.html");
}

migrateLegacyStorage();
const preferences = loadPreferences();

/*
 * An invite link is a fresh intention: when it points to another game than
 * the one remembered on this device, the invite wins and the old seat is
 * not resumed automatically.
 */
const inviteCode = readInviteCode(window.location.search);
if (inviteCode !== null && loadSession()?.roomCode !== inviteCode) {
  clearSession();
}

const rememberLanguage = (language: Language): void => {
  savePreferences({ language });
};

createRoot(container).render(
  <StrictMode>
    <I18nProvider
      initialLanguage={detectLanguage(preferences.language)}
      onLanguageChange={rememberLanguage}
    >
      <ToastProvider>
        <GameProvider>
          <App inviteCode={inviteCode} />
        </GameProvider>
      </ToastProvider>
    </I18nProvider>
  </StrictMode>,
);
