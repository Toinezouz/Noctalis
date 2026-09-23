import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/cinzel';
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
import { loadPreferences, savePreferences } from './lib/storage.js';

const container = document.getElementById('root');
if (!container) {
  throw new Error("#root element missing from index.html");
}

const preferences = loadPreferences();

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
          <App />
        </GameProvider>
      </ToastProvider>
    </I18nProvider>
  </StrictMode>,
);
