import { useState, type Dispatch } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import HoleImage from '../components/HoleImage';
import HoleStrokes from '../components/HoleStrokes';
import ScoreStepper from '../components/ScoreStepper';
import { COURSE, holeByNr, holeRange, holesOf } from '../data/course';
import type { Action } from '../hooks/useRound';
import { useSticky } from '../hooks/useSticky';
import { playerPlayingHandicap, strokesOnHole } from '../lib/handicap';
import { holeResult, modeUnit, primaryValue, totalsFor } from '../lib/scoring';
import type { Round } from '../types';

interface Props {
  round: Round;
  dispatch: Dispatch<Action>;
  onOpenCard: () => void;
}

export default function HoleScreen({ round, dispatch, onOpenCard }: Props) {
  const [showBahn, setShowBahn] = useSticky('kuhlendahl.showBahn', true);
  const [abbruchOffen, setAbbruchOffen] = useState(false);
  const hole = holeByNr(round.currentHole);
  const { from, to } = holeRange(round.layout);
  // Auf dem ersten Loch führt "Zurück" aus der Runde heraus statt ins Leere.
  const amAnfang = round.currentHole === from;
  const belegteLoecher = holesOf(round.layout).filter((h) =>
    round.players.some((p) => round.scores[p.id]?.[h.nr - 1] != null),
  ).length;
  const headline =
    round.layout === 'back'
      ? `Loch ${round.currentHole} · Back 9`
      : `Loch ${round.currentHole} / ${to}`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="safe-top sticky top-0 z-20 border-b border-edge bg-deep-950/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() =>
              amAnfang ? setAbbruchOffen(true) : dispatch({ type: 'prev' })
            }
            className="rounded-full px-2 py-1 text-sm text-sand-300/60"
          >
            {amAnfang ? '‹ Abbrechen' : '‹ Zurück'}
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sand-300/50">
            {headline}
          </span>
          <button
            type="button"
            onClick={onOpenCard}
            className="rounded-full border border-edge px-3 py-1 text-xs font-semibold text-sand-300/80"
          >
            Karte
          </button>
        </div>

        {/* Lochleiste: gefüllt = vollständig eingetragen, halb = teilweise */}
        <div className="flex gap-[3px] px-4 pb-2.5">
          {holesOf(round.layout).map((h) => {
            const filled = round.players.filter(
              (p) => round.scores[p.id]?.[h.nr - 1] != null,
            ).length;
            const state =
              filled === 0
                ? 'bg-deep-700'
                : filled === round.players.length
                  ? 'bg-turf-500'
                  : 'bg-turf-500/40';
            return (
              <button
                key={h.nr}
                type="button"
                aria-label={`Zu Loch ${h.nr}`}
                onClick={() => dispatch({ type: 'goHole', nr: h.nr })}
                className={`h-1 flex-1 rounded-full transition ${state} ${
                  h.nr === round.currentHole ? 'ring-2 ring-sand-100/70' : ''
                }`}
              />
            );
          })}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-4">
        <div className="flex items-end gap-4">
          <span className="font-display text-6xl leading-none text-sand-300">
            {hole.nr}
          </span>
          <div className="pb-1">
            <div className="font-display text-2xl leading-tight text-turf-300">
              Par {hole.par}
            </div>
            <div className="font-display text-lg leading-tight text-flag-400">
              HCP {hole.si}
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1 pb-1">
            {COURSE.tees.map((t) => (
              <span key={t.id} className="flex items-center gap-1.5 text-xs text-sand-300/70">
                <span className="h-2 w-2 rounded-full" style={{ background: t.hex }} />
                {hole.lengths[t.id]} m
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowBahn(!showBahn)}
            className="text-xs font-semibold text-sand-300/50 hover:text-sand-100"
          >
            {showBahn ? '▾ Bahn ausblenden' : '▸ Bahn anzeigen'}
          </button>
        </div>

        {showBahn && <HoleImage holeNr={hole.nr} />}

        <div className="flex flex-col gap-2.5">
          {round.players.map((player) => {
            const gross = round.scores[player.id]?.[hole.nr - 1] ?? null;
            const strokes = strokesOnHole(
              playerPlayingHandicap(player, round.allowance),
              hole.si,
            );
            const result =
              gross == null
                ? null
                : holeResult(player, hole.nr, gross, round.allowance);
            const running = totalsFor(round, player, from, hole.nr);

            return (
              <div
                key={player.id}
                className="rounded-2xl border border-edge bg-deep-900 px-4 pt-3 pb-4"
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {player.name}
                  </span>
                  <HoleStrokes strokes={strokes} />
                  <span className="ml-3 shrink-0 text-right text-xs text-sand-300/50">
                    {running.holesPlayed > 0 && (
                      <>
                        {primaryValue(running, round.mode)}{' '}
                        <span className="text-sand-300/35">{modeUnit(round.mode)}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <ScoreStepper
                      value={gross}
                      par={hole.par}
                      onChange={(value) =>
                        dispatch({
                          type: 'setScore',
                          playerId: player.id,
                          holeNr: hole.nr,
                          value,
                        })
                      }
                    />
                  </div>
                  <div className="w-14 shrink-0 text-right">
                    {result && (
                      <>
                        <div className="font-display text-2xl leading-none text-turf-300">
                          {round.mode === 'stableford'
                            ? result.points
                            : round.mode === 'netto'
                              ? result.netto
                              : result.gross}
                        </div>
                        <div className="mt-1 text-[9px] uppercase tracking-wider text-sand-300/40">
                          {round.mode === 'stableford' ? 'Punkte' : round.mode}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="safe-bottom sticky bottom-0 border-t border-edge bg-deep-950/90 px-4 pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => dispatch({ type: 'next' })}
          className="w-full rounded-2xl bg-turf-500 py-4 text-base font-bold text-deep-950 active:scale-[0.99] transition"
        >
          {round.layout === 'full' && round.currentHole === 9
            ? 'Zwischenstand nach 9'
            : round.currentHole >= to
              ? 'Runde abschließen'
              : `Weiter zu Loch ${round.currentHole + 1}`}
        </button>
      </footer>

      {abbruchOffen && (
        <ConfirmDialog
          title="Runde abbrechen?"
          body={
            belegteLoecher === 0
              ? 'Es ist noch nichts eingetragen – du landest wieder beim Start und kannst die Spieler neu aufsetzen.'
              : `Auf ${belegteLoecher} ${
                  belegteLoecher === 1 ? 'Loch' : 'Löchern'
                } sind schon Schläge eingetragen. Die sind danach weg und lassen sich nicht wiederherstellen.`
          }
          confirmLabel="Runde verwerfen"
          cancelLabel="Weiterspielen"
          danger
          onConfirm={() => dispatch({ type: 'reset' })}
          onCancel={() => setAbbruchOffen(false)}
        />
      )}
    </div>
  );
}
