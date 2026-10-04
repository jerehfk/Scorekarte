import { formatCourseHcp, playerPlayingHandicap } from '../lib/handicap';
import {
  formatToPar,
  modeUnit,
  primaryValue,
  rankPlayers,
  totalsFor,
} from '../lib/scoring';
import type { Round } from '../types';

interface Props {
  round: Round;
  from?: number;
  to?: number;
  /** Zusätzlich Out/In/Gesamt aufschlüsseln (Schlussstand) */
  detailed?: boolean;
}

export default function Standings({ round, from = 1, to = 18, detailed = false }: Props) {
  const ranked = rankPlayers(round, from, to);
  const unit = modeUnit(round.mode);

  return (
    <ol className="flex flex-col gap-2">
      {ranked.map((player, i) => {
        const t = totalsFor(round, player, from, to);
        const out = totalsFor(round, player, 1, 9);
        const inn = totalsFor(round, player, 10, 18);
        const leader = i === 0 && t.holesPlayed > 0;

        return (
          <li
            key={player.id}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              leader
                ? 'border-turf-500/50 bg-turf-500/10'
                : 'border-edge bg-deep-900'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                leader ? 'bg-turf-500 text-deep-950' : 'bg-deep-800 text-sand-300/70'
              }`}
            >
              {i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{player.name}</div>
              <div className="mt-0.5 text-[11px] text-sand-300/55">
                Spielvorgabe{' '}
                {formatCourseHcp(playerPlayingHandicap(player, round.allowance))} ·{' '}
                {t.holesPlayed} {t.holesPlayed === 1 ? 'Loch' : 'Löcher'}
                {detailed && t.holesPlayed > 0 && (
                  <>
                    {' '}
                    · Out {primaryValue(out, round.mode)} / In{' '}
                    {primaryValue(inn, round.mode)}
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="font-display text-3xl leading-none">
                {t.holesPlayed === 0 ? '–' : primaryValue(t, round.mode)}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-sand-300/50">
                {round.mode === 'stableford'
                  ? unit
                  : formatToPar(round.mode === 'netto' ? t.toParNetto : t.toPar)}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
