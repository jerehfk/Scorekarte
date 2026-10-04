import { COURSE } from '../data/course';
import { playerPlayingHandicap, strokesOnHole } from './handicap';
import type { Allowance, Player, Round, ScoreMode } from '../types';

/** Stableford: 2 Punkte für Netto-Par, pro Schlag darüber/darunter einer weniger/mehr. */
export function stablefordPoints(gross: number, par: number, strokes: number): number {
  return Math.max(0, 2 + par + strokes - gross);
}

export type ScoreKind =
  | 'albatross'
  | 'eagle'
  | 'birdie'
  | 'par'
  | 'bogey'
  | 'double'
  | 'worse';

export function scoreKind(gross: number, par: number): ScoreKind {
  const d = gross - par;
  if (d <= -3) return 'albatross';
  if (d === -2) return 'eagle';
  if (d === -1) return 'birdie';
  if (d === 0) return 'par';
  if (d === 1) return 'bogey';
  if (d === 2) return 'double';
  return 'worse';
}

export interface HoleResult {
  gross: number;
  strokes: number;
  netto: number;
  points: number;
  kind: ScoreKind;
}

export function holeResult(
  player: Player,
  holeNr: number,
  gross: number,
  allowance: Allowance,
): HoleResult {
  const hole = COURSE.holes[holeNr - 1];
  const strokes = strokesOnHole(playerPlayingHandicap(player, allowance), hole.si);
  return {
    gross,
    strokes,
    netto: gross - strokes,
    points: stablefordPoints(gross, hole.par, strokes),
    kind: scoreKind(gross, hole.par),
  };
}

export interface Totals {
  holesPlayed: number;
  gross: number;
  netto: number;
  points: number;
  /** Schläge relativ zu Par – nur über die gespielten Löcher */
  toPar: number;
  toParNetto: number;
}

const EMPTY: Totals = {
  holesPlayed: 0,
  gross: 0,
  netto: 0,
  points: 0,
  toPar: 0,
  toParNetto: 0,
};

/** Summiert über einen Lochbereich (1-basiert, inklusive). */
export function totalsFor(
  round: Round,
  player: Player,
  from = 1,
  to = 18,
): Totals {
  const scores = round.scores[player.id] ?? [];
  const spv = playerPlayingHandicap(player, round.allowance);
  const acc = { ...EMPTY };

  for (let nr = from; nr <= to; nr++) {
    const gross = scores[nr - 1];
    if (gross == null) continue;
    const hole = COURSE.holes[nr - 1];
    const strokes = strokesOnHole(spv, hole.si);
    acc.holesPlayed += 1;
    acc.gross += gross;
    acc.netto += gross - strokes;
    acc.points += stablefordPoints(gross, hole.par, strokes);
    acc.toPar += gross - hole.par;
    acc.toParNetto += gross - strokes - hole.par;
  }
  return acc;
}

/** Der Wert, nach dem in der aktuellen Zählweise sortiert und angezeigt wird. */
export function primaryValue(totals: Totals, mode: ScoreMode): number {
  if (mode === 'stableford') return totals.points;
  return mode === 'netto' ? totals.netto : totals.gross;
}

export function modeLabel(mode: ScoreMode): string {
  return mode === 'stableford' ? 'Stableford' : mode === 'netto' ? 'Netto' : 'Brutto';
}

export function modeUnit(mode: ScoreMode): string {
  return mode === 'stableford' ? 'Pkt' : 'Schläge';
}

/** Bei Stableford gewinnt die höchste Zahl, im Zählspiel die niedrigste. */
export function rankPlayers(round: Round, from = 1, to = 18): Player[] {
  const dir = round.mode === 'stableford' ? -1 : 1;
  return [...round.players].sort((a, b) => {
    const ta = totalsFor(round, a, from, to);
    const tb = totalsFor(round, b, from, to);
    if (ta.holesPlayed === 0 && tb.holesPlayed === 0) return 0;
    if (ta.holesPlayed === 0) return 1;
    if (tb.holesPlayed === 0) return -1;
    return dir * (primaryValue(ta, round.mode) - primaryValue(tb, round.mode));
  });
}

export function formatToPar(toPar: number): string {
  if (toPar === 0) return 'E';
  return toPar > 0 ? `+${toPar}` : String(toPar);
}
