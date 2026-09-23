import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TileColor } from '@gotfive/shared';
import type { ThemePreference } from '../../lib/theme.js';
import { useGame } from '../../app/GameContext.js';
import { useI18n } from '../../i18n/index.js';
import { useIsMobile } from '../../hooks/useMediaQuery.js';
import { GameHeader } from '../../components/game/GameHeader.js';
import { GameLog } from '../../components/game/GameLog.js';
import { OpponentRack } from '../../components/game/OpponentRack.js';
import { PlayerRack } from '../../components/game/PlayerRack.js';
import { PlayerStatus } from '../../components/game/PlayerStatus.js';
import { PublicTilePool } from '../../components/game/PublicTilePool.js';
import { TurnIndicator } from '../../components/game/TurnIndicator.js';
import { Panel } from '../../components/ui/Panel.js';
import { Button } from '../../components/ui/Button.js';
import { DeductionSheet } from '../deduction/DeductionSheet.js';
import { useDeductionSheet } from '../deduction/deductionStore.js';
import { ClassifyDialog } from '../dialogs/ClassifyDialog.js';
import { CompareDialog } from '../dialogs/CompareDialog.js';
import { GuessDialog } from '../dialogs/GuessDialog.js';
import { HintDialog } from '../dialogs/HintDialog.js';
import { ActionPanel } from './ActionPanel.js';
import { GameOverScreen } from './GameOverScreen.js';

export interface GameTableProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: ThemePreference;
  onThemeChange: (value: ThemePreference) => void;
  onOpenHelp: () => void;
  onLeave: () => void;
}

/** La table de jeu complete : adversaire en haut, zone publique, mon support. */
export function GameTable({
  soundEnabled,
  onToggleSound,
  theme,
  onThemeChange,
  onOpenHelp,
  onLeave,
}: GameTableProps): JSX.Element | null {
  const {
    publicState,
    privateState,
    credentials,
    room,
    me,
    opponent,
    isMyTurn,
    status,
    lastEvent,
    actions,
  } = useGame();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const sheet = useDeductionSheet(credentials?.roomCode ?? null, credentials?.playerId ?? null);

  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [guessOpen, setGuessOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const phase = publicState?.phase ?? 'SETUP';

  // La selection ne survit pas au changement de phase ou de tour.
  useEffect(() => {
    if (phase !== 'TURN_HINT' || !isMyTurn) {
      setSelectedTile(null);
    }
  }, [phase, isMyTurn, publicState?.turn]);

  const run = useCallback(async (action: () => Promise<boolean>): Promise<void> => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }, []);

  const lastRevealed = useMemo(
    () => (lastEvent?.type === 'tile-revealed' ? lastEvent.tile.number : null),
    [lastEvent],
  );

  if (!publicState || !privateState || !credentials || !me) {
    return null;
  }

  const myId = credentials.playerId;
  const opponentName = opponent?.name ?? 'Ton adversaire';
  const activeName =
    publicState.players.find((p) => p.id === publicState.activePlayerId)?.name ?? opponentName;
  const pending = privateState.pendingResponse;
  const opponentSecretNumbers = privateState.opponentTiles.map((t) => t.number);
  const finalMyFaces = publicState.finalReveal?.[myId] ?? null;
  const gameOver = phase === 'GAME_OVER';

  const canGotFive = !me.guessUsed && !me.eliminated && !gameOver;

  return (
    <div className="table">
      <GameHeader
        roomCode={credentials.roomCode}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        theme={theme}
        onThemeChange={onThemeChange}
        onOpenHelp={onOpenHelp}
        onOpenSheet={() => {
          setSheetOpen(true);
        }}
        onLeave={onLeave}
        onGotFive={
          canGotFive
            ? () => {
                setGuessOpen(true);
              }
            : undefined
        }
        gotFiveDisabled={busy}
        showSheetButton={!sheetOpen}
        online={status === 'online'}
      />

      {opponent && !opponent.connected && !gameOver ? (
        <p className="opponent-offline" role="status" data-testid="opponent-offline">
          <span aria-hidden="true">🔌</span>{' '}
          {t('banner.opponentOffline', { name: opponent.name })}
        </p>
      ) : null}

      <TurnIndicator
        phase={phase}
        isMyTurn={isMyTurn}
        mustAnswer={pending !== null}
        activeName={activeName}
        opponentName={opponentName}
        turn={publicState.turn}
        eliminated={me.eliminated}
      />

      <main className="table__layout">
        <div className="table__board">
          <section aria-label={t('rack.opponentZone', { name: opponentName })}>
            {opponent ? (
              <OpponentRack
                name={opponent.name}
                colors={opponent.tileColors}
                faces={privateState.opponentTiles}
                classifications={publicState.classifications.filter(
                  (c) => c.ownerId === opponent.id,
                )}
                comparisons={publicState.comparisons.filter((c) => c.ownerId === opponent.id)}
                connected={opponent.connected}
              />
            ) : (
              <p className="muted center">{t('rack.waitingOpponent')}</p>
            )}
          </section>

          <section className="table__center" aria-label={t('status.publicZone')}>
            <PublicTilePool
              tiles={publicState.publicTiles}
              selectedNumber={selectedTile}
              selectable={isMyTurn && phase === 'TURN_HINT' && !busy}
              onSelect={(tileNumber) => {
                setSelectedTile(tileNumber);
              }}
              reserveByColor={publicState.reserveByColor}
              lastRevealed={lastRevealed}
            />
            <ActionPanel
              phase={phase}
              isMyTurn={isMyTurn}
              eliminated={me.eliminated}
              reserveByColor={publicState.reserveByColor}
              onReveal={(color: TileColor) => {
                void run(() => actions.reveal(color));
              }}
              selectedTile={selectedTile}
              activeName={activeName}
              opponentName={opponentName}
              busy={busy}
            />
          </section>

          <section aria-label={t('rack.myZone')}>
            <PlayerRack
              name={me.name}
              colors={me.tileColors}
              revealedFaces={finalMyFaces}
              classifications={publicState.classifications.filter((c) => c.ownerId === myId)}
              comparisons={publicState.comparisons.filter((c) => c.ownerId === myId)}
              connected={me.connected}
            />
          </section>
        </div>

        <aside className="table__side" aria-label={t('side.gameInfo')}>
          <Panel title={t('side.players')}>
            <div className="stack">
              {publicState.players.map((player) => (
                <PlayerStatus
                  key={player.id}
                  player={player}
                  isMe={player.id === myId}
                  isActive={publicState.activePlayerId === player.id}
                />
              ))}
            </div>
          </Panel>

          {!sheetOpen && !isMobile ? (
            <Button variant="secondary" block onClick={() => { setSheetOpen(true); }}>
              📋 {t('side.openSheet')}
            </Button>
          ) : null}

          <Panel
            title={t('side.history')}
            aside={<span className="badge badge--muted">{publicState.log.length}</span>}
          >
            <GameLog entries={publicState.log} />
          </Panel>
        </aside>
      </main>

      {sheetOpen ? (
        <div className={isMobile ? '' : 'sheet-panel'}>
          <DeductionSheet
            sheet={sheet}
            revealedNumbers={publicState.publicTiles.map((t) => t.tile.number)}
            fullscreen={isMobile}
            onClose={() => {
              setSheetOpen(false);
            }}
            onUseForGotFive={
              canGotFive
                ? () => {
                    setGuessOpen(true);
                  }
                : undefined
            }
          />
        </div>
      ) : null}

      <HintDialog
        open={selectedTile !== null && isMyTurn && phase === 'TURN_HINT'}
        tileNumber={selectedTile}
        myTiles={privateState.myTiles}
        opponentName={opponentName}
        busy={busy}
        onClose={() => {
          setSelectedTile(null);
        }}
        onClassify={(tileNumber) => {
          void run(() => actions.requestClassify(tileNumber));
        }}
        onCompare={(tileNumber, position) => {
          void run(() => actions.requestCompare(tileNumber, position));
        }}
      />

      {pending && pending.hint.type === 'classify' ? (
        <ClassifyDialog
          open
          tileNumber={pending.hint.tileNumber}
          askerSecretNumbers={opponentSecretNumbers}
          askerName={opponentName}
          busy={busy}
          onSubmit={(slot) => {
            void run(() => actions.submitClassify(slot));
          }}
        />
      ) : null}

      {pending && pending.hint.type === 'compare' ? (
        <CompareDialog
          open
          tileNumber={pending.hint.tileNumber}
          position={pending.hint.position}
          askerSecretNumbers={opponentSecretNumbers}
          askerName={opponentName}
          truth={pending.truth ?? false}
          busy={busy}
          onSubmit={(answer) => {
            void run(() => actions.submitCompare(answer));
          }}
        />
      ) : null}

      <GuessDialog
        open={guessOpen}
        initial={sheet.guesses}
        busy={busy}
        onClose={() => {
          setGuessOpen(false);
        }}
        onSubmit={(numbers) => {
          void run(async () => {
            const ok = await actions.guess(numbers);
            if (ok) {
              setGuessOpen(false);
            }
            return ok;
          });
        }}
      />

      {gameOver ? (
        <GameOverScreen
          state={publicState}
          myId={myId}
          rematchReady={room?.rematchReady ?? []}
          opponentPresent={opponent !== null}
          onRematch={() => {
            void run(() => actions.rematch());
          }}
          onHome={() => {
            void actions.leaveRoom();
          }}
        />
      ) : null}
    </div>
  );
}
