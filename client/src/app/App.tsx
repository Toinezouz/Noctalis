import { useCallback, useEffect, useState } from 'react';
import { useGame } from './GameContext.js';
import { useI18n } from '../i18n/index.js';
import { Home } from '../features/room/Home.js';
import { RoomLobby } from '../features/room/RoomLobby.js';
import { HowToPlay } from '../features/room/HowToPlay.js';
import { Onboarding } from '../features/room/Onboarding.js';
import { GameTable } from '../features/game/GameTable.js';
import { StartRoulette } from '../features/game/StartRoulette.js';
import { AboutDialog } from '../features/room/AboutDialog.js';
import { SiteFooter } from '../components/ui/SiteFooter.js';
import { loadPreferences, savePreferences } from '../lib/storage.js';
import { setSoundEnabled } from '../lib/audio.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import {
  DARK_MEDIA_QUERY,
  applyTheme,
  resolveTheme,
  type ThemePreference,
} from '../lib/theme.js';

/**
 * Aiguillage des ecrans : accueil -> lobby -> table de jeu.
 * L'etat vient du serveur ; aucun ecran n'est simule localement.
 */
export function App(): JSX.Element {
  const {
    room,
    publicState,
    credentials,
    status,
    mustAnswer,
    startingDraw,
    dismissStartingDraw,
    actions,
  } = useGame();
  const { t } = useI18n();
  const [prefs, setPrefs] = useState(() => loadPreferences());
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  /**
   * Le tutoriel est *demande* a la premiere partie, mais il ne s'affiche que
   * lorsque rien de plus urgent n'occupe l'ecran : l'annonce du tirage au sort
   * passe devant, une etape obligatoire aussi. Il attend son tour au lieu de se
   * superposer, quel que soit l'ordre d'arrivee des messages du serveur.
   */
  const [onboardingWanted, setOnboardingWanted] = useState(false);

  useEffect(() => {
    setSoundEnabled(prefs.soundEnabled);
  }, [prefs.soundEnabled]);

  // Theme : 'auto' suit le systeme et reagit a ses changements en direct.
  const systemPrefersDark = useMediaQuery(DARK_MEDIA_QUERY);
  const theme = resolveTheme(prefs.theme, systemPrefersDark);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Tutoriel a la toute premiere partie uniquement.
  useEffect(() => {
    if (publicState && !prefs.onboardingDone) {
      setOnboardingWanted(true);
      setPrefs(savePreferences({ onboardingDone: true }));
    }
  }, [publicState, prefs.onboardingDone]);

  const onboardingOpen = onboardingWanted && startingDraw === null && !mustAnswer;

  const toggleSound = useCallback(() => {
    setPrefs((current) => savePreferences({ soundEnabled: !current.soundEnabled }));
  }, []);

  const changeTheme = useCallback((next: ThemePreference) => {
    setPrefs(savePreferences({ theme: next }));
  }, []);

  const leave = useCallback(() => {
    void actions.leaveRoom();
  }, [actions]);

  const inGame = room !== null && publicState !== null && credentials !== null;
  const inLobby = room !== null && publicState === null && credentials !== null;

  return (
    <div className="app-shell">
      {status === 'offline' ? (
        <div className="offline-banner" role="status">
          {t('banner.offline')}
        </div>
      ) : null}

      {inGame ? (
        <GameTable
          soundEnabled={prefs.soundEnabled}
          onToggleSound={toggleSound}
          theme={prefs.theme}
          onThemeChange={changeTheme}
          onOpenHelp={() => {
            setHelpOpen(true);
          }}
          onLeave={leave}
        />
      ) : inLobby ? (
        <RoomLobby
          room={room}
          myId={credentials.playerId}
          onStart={() => {
            void actions.startGame();
          }}
          onLeave={leave}
        />
      ) : (
        <Home
          initialName={prefs.name}
          onNameChange={(name) => {
            setPrefs(savePreferences({ name }));
          }}
          theme={prefs.theme}
          onThemeChange={changeTheme}
          onOpenHelp={() => {
            setHelpOpen(true);
          }}
        />
      )}

      {inGame && startingDraw ? (
        <StartRoulette
          key={startingDraw.at}
          players={publicState.players.map((p) => ({ id: p.id, name: p.name }))}
          startingPlayerId={startingDraw.startingPlayerId}
          myId={credentials.playerId}
          onDone={dismissStartingDraw}
        />
      ) : null}

      {/* Pied de page : hors partie seulement, pour ne rien encombrer. */}
      {!inGame ? (
        <SiteFooter
          onOpenAbout={() => {
            setAboutOpen(true);
          }}
        />
      ) : null}

      <AboutDialog
        open={aboutOpen}
        onClose={() => {
          setAboutOpen(false);
        }}
      />

      <HowToPlay
        open={helpOpen}
        onClose={() => {
          setHelpOpen(false);
        }}
      />
      <Onboarding
        open={onboardingOpen}
        onClose={() => {
          setOnboardingWanted(false);
        }}
      />
    </div>
  );
}
