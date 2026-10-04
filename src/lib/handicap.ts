import { COURSE, teeById } from '../data/course';
import type { Allowance, Player, Tee } from '../types';

/** WHS rundet auf ganze Schläge, 0,5 immer vom Nullpunkt weg. */
export function roundHalfAway(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Course Handicap (die "Vorgabe" für diesen Platz und Abschlag):
 *   HCPI × (Slope / 113) + (CR − Par)
 * Par ist das des Ratings; manche Abschläge spielen ein kürzeres Par.
 */
export function courseHandicap(hcpi: number, tee: Tee): number {
  return roundHalfAway(hcpi * (tee.slope / 113) + (tee.cr - (tee.par ?? COURSE.par)));
}

export function playerCourseHandicap(player: Player): number {
  return courseHandicap(player.hcpi, teeById(player.teeId));
}

/**
 * Spielvorgabe = Course Handicap × Allowance, beide Schritte einzeln gerundet.
 * Genau diese Reihenfolge schreibt WHS vor: erst das Course Handicap auf eine
 * ganze Zahl, dann die Allowance darauf.
 */
export function playingHandicap(courseHcp: number, allowance: Allowance): number {
  return roundHalfAway((courseHcp * allowance) / 100);
}

/** Die Zahl, aus der die Vorgabenschläge pro Loch entstehen. */
export function playerPlayingHandicap(player: Player, allowance: Allowance): number {
  return playingHandicap(playerCourseHandicap(player), allowance);
}

/**
 * Vorgabenschläge auf einem einzelnen Loch.
 *
 * Positive Vorgabe: reihum von HCP 1 aufwärts verteilt, ab 18 gibt es
 * überall einen zweiten Schlag. Plusspieler (negative Vorgabe) geben
 * Schläge zurück – beginnend beim leichtesten Loch (HCP 18).
 */
export function strokesOnHole(courseHcp: number, si: number): number {
  if (courseHcp >= 0) {
    const base = Math.floor(courseHcp / 18);
    const extra = courseHcp % 18;
    return base + (si <= extra ? 1 : 0);
  }
  const n = -courseHcp;
  const base = Math.floor(n / 18);
  const extra = n % 18;
  return -(base + (si >= 19 - extra ? 1 : 0));
}

/** HCPI deutsch: Komma statt Punkt, Plusspieler mit führendem "+". */
export function formatHcpi(hcpi: number): string {
  const s = Math.abs(hcpi).toFixed(1).replace('.', ',');
  return hcpi < 0 ? `+${s}` : s;
}

/** Course Handicap deutsch: Plusspieler mit "+", sonst schlicht die Zahl. */
export function formatCourseHcp(chcp: number): string {
  return chcp < 0 ? `+${-chcp}` : String(chcp);
}

/** Akzeptiert "12,4", "12.4", "+2,4" und "-2,4" (beide = Plusspieler). */
export function parseHcpi(input: string): number | null {
  const raw = input.trim().replace(',', '.');
  if (raw === '') return null;
  const plus = raw.startsWith('+');
  const n = Number(plus ? raw.slice(1) : raw);
  if (!Number.isFinite(n)) return null;
  const value = plus ? -Math.abs(n) : n;
  return Math.min(54, Math.max(-10, value));
}
