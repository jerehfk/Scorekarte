import type { Dispatch } from 'react';
import ScoreBadge from '../components/ScoreBadge';
import Segmented from '../components/Segmented';
import { COURSE, holeRange, holesOf, IN_HOLES, OUT_HOLES, parOf } from '../data/course';
import type { Action } from '../hooks/useRound';
import { formatCourseHcp, playerPlayingHandicap, strokesOnHole } from '../lib/handicap';
import { primaryValue, scoreKind, stablefordPoints, totalsFor } from '../lib/scoring';
import type { Hole, Round, ScoreMode } from '../types';

interface Props {
  round: Round;
  dispatch: Dispatch<Action>;
  onClose: () => void;
}

type Row =
  | { kind: 'hole'; hole: Hole }
  | { kind: 'sum'; label: string; from: number; to: number; par: number; strong?: boolean };

export default function ScorecardSheet({ round, dispatch, onClose }: Props) {
  const { from, to } = holeRange(round.layout);

  // Out/In lohnen sich nur, wenn beide Neuner gespielt werden.
  const rows: Row[] =
    round.layout === 'full'
      ? [
          ...OUT_HOLES.map((hole): Row => ({ kind: 'hole', hole })),
          { kind: 'sum', label: 'Out', from: 1, to: 9, par: COURSE.parOut },
          ...IN_HOLES.map((hole): Row => ({ kind: 'hole', hole })),
          { kind: 'sum', label: 'In', from: 10, to: 18, par: COURSE.parIn },
          { kind: 'sum', label: 'Gesamt', from: 1, to: 18, par: COURSE.par, strong: true },
        ]
      : [
          ...holesOf(round.layout).map((hole): Row => ({ kind: 'hole', hole })),
          {
            kind: 'sum',
            label: 'Gesamt',
            from,
            to,
            par: parOf(round.layout),
            strong: true,
          },
        ];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-deep-950">
      <header className="safe-top border-b border-edge px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <h2 className="font-display text-xl">Scorekarte</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-edge px-4 py-1.5 text-sm font-semibold"
          >
            Schließen
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md px-4 py-3">
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
      </div>

      <div className="flex-1 overflow-auto px-4 pb-8">
        <table className="mx-auto w-full max-w-md border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-deep-950">
            <tr className="text-[10px] uppercase tracking-wider text-sand-300/45">
              <th className="w-10 py-2 text-left font-semibold">Loch</th>
              <th className="w-8 py-2 text-center font-semibold">Par</th>
              <th className="w-8 py-2 text-center font-semibold">HCP</th>
              {round.players.map((p) => (
                <th key={p.id} className="py-2 text-center font-semibold">
                  <div className="truncate px-1 text-sand-300/80">{p.name}</div>
                  <div className="font-normal normal-case tracking-normal text-sand-300/35">
                    SpV {formatCourseHcp(playerPlayingHandicap(p, round.allowance))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              if (row.kind === 'sum') {
                return (
                  <tr
                    key={row.label}
                    className={
                      row.strong
                        ? 'bg-turf-500/12 font-bold'
                        : 'bg-deep-850 font-semibold'
                    }
                  >
                    <td className="border-t border-edge py-2.5 pl-1 text-left text-xs uppercase tracking-wider text-sand-300/80">
                      {row.label}
                    </td>
                    <td className="border-t border-edge py-2.5 text-center text-sand-300/60">
                      {row.par}
                    </td>
                    <td className="border-t border-edge" />
                    {round.players.map((p) => {
                      const t = totalsFor(round, p, row.from, row.to);
                      return (
                        <td
                          key={p.id}
                          className="border-t border-edge py-2.5 text-center text-turf-300"
                        >
                          {t.holesPlayed === 0 ? '–' : primaryValue(t, round.mode)}
                        </td>
                      );
                    })}
                  </tr>
                );
              }

              const { hole } = row;
              return (
                <tr key={hole.nr} className="hover:bg-deep-900/60">
                  <td className="py-1 pl-1 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'goHole', nr: hole.nr });
                        onClose();
                      }}
                      className="font-semibold text-sand-300/85 underline-offset-4 hover:underline"
                    >
                      {hole.nr}
                    </button>
                  </td>
                  <td className="py-1 text-center text-sand-300/45">{hole.par}</td>
                  <td className="py-1 text-center text-[11px] text-sand-300/30">
                    {hole.si}
                  </td>
                  {round.players.map((p) => {
                    const gross = round.scores[p.id]?.[hole.nr - 1] ?? null;
                    if (gross == null) {
                      return (
                        <td key={p.id} className="py-1 text-center text-sand-300/15">
                          –
                        </td>
                      );
                    }
                    const strokes = strokesOnHole(
                      playerPlayingHandicap(p, round.allowance),
                      hole.si,
                    );
                    const secondary =
                      round.mode === 'stableford'
                        ? stablefordPoints(gross, hole.par, strokes)
                        : gross - strokes;

                    return (
                      <td key={p.id} className="py-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <ScoreBadge
                            value={gross}
                            kind={scoreKind(gross, hole.par)}
                            size="sm"
                          />
                          {round.mode !== 'brutto' && (
                            <span className="text-[9px] leading-none text-turf-300/80">
                              {secondary}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-sand-300/40">
          Tippe eine Lochnummer an, um dorthin zu springen. Kleine Zahl unter dem Score
          {round.mode === 'stableford' ? ' = Stableford-Punkte' : ' = Netto'}. SpV =
          Spielvorgabe, aus der die Schläge pro Loch verteilt werden
          {round.allowance !== 100 && ` (${round.allowance} % Allowance)`}.
        </p>
      </div>
    </div>
  );
}
