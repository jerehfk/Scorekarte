import type { Dispatch } from 'react';
import ScoreBadge from '../components/ScoreBadge';
import Segmented from '../components/Segmented';
import Standings from '../components/Standings';
import { COURSE, OUT_HOLES } from '../data/course';
import type { Action } from '../hooks/useRound';
import { scoreKind } from '../lib/scoring';
import type { Round, ScoreMode } from '../types';

interface Props {
  round: Round;
  dispatch: Dispatch<Action>;
  onOpenCard: () => void;
}

export default function TurnScreen({ round, dispatch, onOpenCard }: Props) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="safe-top flex items-center justify-between border-b border-edge px-4 py-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'prev' })}
          className="rounded-full px-2 py-1 text-sm text-sand-300/60"
        >
          ‹ Loch 9
        </button>
        <button
          type="button"
          onClick={onOpenCard}
          className="rounded-full border border-edge px-3 py-1 text-xs font-semibold text-sand-300/80"
        >
          Karte
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-turf-400">
            Zwischenstand
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">Nach 9 Löchern</h1>
          <p className="mt-2 text-sm text-sand-300/55">
            Erste Neun · Par {COURSE.parOut}
          </p>
        </div>

        <Segmented
          value={round.mode}
          onChange={(mode: ScoreMode) => dispatch({ type: 'setMode', mode })}
          size="sm"
          options={[
            { value: 'stableford', label: 'Stableford' },
            { value: 'netto', label: 'Netto' },
            { value: 'brutto', label: 'Brutto' },
          ]}
        />

        <Standings round={round} from={1} to={9} />

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-sand-300/50">
            Löcher 1 – 9
          </h2>
          {round.players.map((player) => (
            <div key={player.id} className="rounded-2xl border border-edge bg-deep-900 p-3">
              <div className="mb-2 truncate text-xs font-semibold text-sand-300/70">
                {player.name}
              </div>
              <div className="flex justify-between gap-1">
                {OUT_HOLES.map((hole) => {
                  const gross = round.scores[player.id]?.[hole.nr - 1] ?? null;
                  return (
                    <div key={hole.nr} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-sand-300/35">{hole.nr}</span>
                      {gross == null ? (
                        <span className="flex h-7 w-7 items-center justify-center text-sand-300/20">
                          –
                        </span>
                      ) : (
                        <ScoreBadge
                          value={gross}
                          kind={scoreKind(gross, hole.par)}
                          size="sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="safe-bottom sticky bottom-0 border-t border-edge bg-deep-950/90 px-4 pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => dispatch({ type: 'next' })}
          className="w-full rounded-2xl bg-turf-500 py-4 text-base font-bold text-deep-950 active:scale-[0.99] transition"
        >
          Weiter zu Loch 10
        </button>
      </footer>
    </div>
  );
}
