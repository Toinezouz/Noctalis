import { useCallback, useEffect, useMemo, useState } from 'react';
import { pickResponder, type TileColor } from '@umbrastra/shared';
import type { Theme } from '../../lib/theme.js';
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
  theme: Theme;
  onThemeChange: (value: Theme) => void;
  onOpenHelp: () => void;
  onLeave: () => void;
}

/** The full table: everybody else at the top, the shared sky, my rack below. */
export function GameTable({
  soundEnabled,
  onToggleSound,
  theme,
  onThemeChange,
  onOpenHelp,
  onLeave,
}: GameTableProps): JSX.Element | null {
  const { publicState, privateState, credentials, room, me, rivals, isMyTurn, status, lastEvent, actions } =
    useGame();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const sheet = useDeductionSheet(credentials?.roomCode ?? null, credentials?.playerId ?? null);

  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [guessOpen, setGuessOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const phase = publicState?.phase ?? 'SETUP';

  // The selection does not survive a change of phase or turn.
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
  const nameOf = (id: string | null | undefined): string =>
    publicState.players.find((p) => p.id === id)?.name ?? '';
  const activeName = nameOf(publicState.activePlayerId);
  const hint = publicState.pendingHint;
  const responderName = nameOf(hint?.responderId);
  const pending = privateState.pendingResponse;
  const askerTiles = pending
    ? (privateState.rivals.find((r) => r.playerId === pending.hint.askerId)?.tiles ?? [])
    : [];
  const askerName = nameOf(pending?.hint.askerId);
  // Who would answer if I asked now: the same rule the server applies.
  const myResponderName = pickResponder(publicState.order, publicState.players, myId)?.name ?? '';
  const finalMyFaces = publicState.finalReveal?.[myId] ?? null;
  const gameOver = phase === 'GAME_OVER';
  const canAnnounce = !me.guessUsed && !me.eliminated && !gameOver;
  const offlineRivals = rivals.filter((p) => !p.connected && !p.left);
  const heldNumbers = privateState.rivals.flatMap((r) => r.tiles.map((tile) => tile.number));

  return (
    <div className="table" data-players={publicState.players.length}>
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
        onAnnounce={
          canAnnounce
            ? () => {
                setGuessOpen(true);
              }
            : undefined
        }
        announceDisabled={busy}
        showSheetButton={!sheetOpen}
        online={status === 'online'}
      />

      {offlineRivals.length > 0 && !gameOver ? (
        <p className="opponent-offline" role="status" data-testid="opponent-offline">
          {t(offlineRivals.length === 1 ? 'banner.playerOffline' : 'banner.playersOffline', {
            name: offlineRivals.map((p) => p.name).join(', '),
          })}
        </p>
      ) : null}

      <TurnIndicator
        phase={phase}
        isMyTurn={isMyTurn}
        mustAnswer={pending !== null}
        activeName={activeName}
        responderName={responderName}
        turn={publicState.turn}
        eliminated={me.eliminated}
      />

      <main className="table__layout">
        <div className="table__board">
          <section
            className={`rivals rivals--${String(rivals.length)}`}
            aria-label={t('rack.othersZone')}
          >
            {rivals.map((rival) => (
              <OpponentRack
                key={rival.id}
                playerId={rival.id}
                name={rival.name}
                colors={rival.tileColors}
                faces={privateState.rivals.find((r) => r.playerId === rival.id)?.tiles ?? null}
                classifications={publicState.classifications.filter((c) => c.ownerId === rival.id)}
                comparisons={publicState.comparisons.filter((c) => c.ownerId === rival.id)}
                connected={rival.connected}
                active={publicState.activePlayerId === rival.id}
                answering={hint?.responderId === rival.id}
                out={rival.eliminated}
              />
            ))}
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
              responderName={responderName}
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
              active={isMyTurn}
              answering={pending !== null}
              out={me.eliminated}
            />
          </section>
        </div>

        <aside className="table__side" aria-label={t('side.gameInfo')}>
          <Panel title={t('side.players')}>
            <div className="stack">
              {publicState.order
                .map((id) => publicState.players.find((p) => p.id === id))
                .map((player) =>
                  player ? (
                    <PlayerStatus
                      key={player.id}
                      player={player}
                      isMe={player.id === myId}
                      isActive={publicState.activePlayerId === player.id}
                    />
                  ) : null,
                )}
            </div>
          </Panel>

          {!sheetOpen && !isMobile ? (
            <Button
              variant="secondary"
              block
              onClick={() => {
                setSheetOpen(true);
              }}
            >
              {t('side.openSheet')}
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
            revealedNumbers={publicState.publicTiles.map((tile) => tile.tile.number)}
            heldNumbers={gameOver ? [] : heldNumbers}
            fullscreen={isMobile}
            onClose={() => {
              setSheetOpen(false);
            }}
            onUseForAnnounce={
              canAnnounce
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
        responderName={myResponderName}
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
          askerSecretNumbers={askerTiles.map((tile) => tile.number)}
          askerName={askerName}
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
          askerSecretNumbers={askerTiles.map((tile) => tile.number)}
          askerName={askerName}
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
          seated={room?.players.map((p) => p.id) ?? []}
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
