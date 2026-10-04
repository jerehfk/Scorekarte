import type { Course, RoundLayout } from '../types';

/**
 * Golfclub Velbert – Gut Kuhlendahl, Par 70.
 *
 * Par, Vorgabenverteilung (HCP) und Längen stammen 1:1 aus dem Birdiebook des Clubs.
 * Course Rating und Slope stehen auf der Clubseite unter "Die Spielbahnen":
 * Herren 137 / CR 71,8, Damen 131 / CR 73,4 – hier als Gelb bzw. Rot geführt.
 * Die dort genannte Gesamtlänge von 5.608 m deckt sich mit der Summe der
 * Gelb-Längen unten, was die Zuordnung bestätigt.
 */
export const COURSE: Course = {
  club: 'Golfclub Velbert – Gut Kuhlendahl',
  par: 70,
  parOut: 35,
  parIn: 35,
  tees: [
    { id: 'gelb', label: 'Gelb', hex: '#facc15', cr: 71.8, slope: 137 },
    { id: 'rot', label: 'Rot', hex: '#ef4444', cr: 73.4, slope: 131 },
  ],
  holes: [
    { nr: 1, par: 4, si: 5, lengths: { gelb: 306, rot: 274 } },
    { nr: 2, par: 4, si: 1, lengths: { gelb: 376, rot: 333 } },
    { nr: 3, par: 3, si: 13, lengths: { gelb: 189, rot: 166 } },
    { nr: 4, par: 4, si: 17, lengths: { gelb: 330, rot: 291 } },
    { nr: 5, par: 4, si: 11, lengths: { gelb: 367, rot: 324 } },
    { nr: 6, par: 5, si: 7, lengths: { gelb: 445, rot: 391 } },
    { nr: 7, par: 4, si: 9, lengths: { gelb: 339, rot: 300 } },
    { nr: 8, par: 3, si: 15, lengths: { gelb: 150, rot: 133 } },
    { nr: 9, par: 4, si: 3, lengths: { gelb: 343, rot: 303 } },
    { nr: 10, par: 4, si: 2, lengths: { gelb: 370, rot: 327 } },
    { nr: 11, par: 3, si: 8, lengths: { gelb: 164, rot: 148 } },
    { nr: 12, par: 4, si: 6, lengths: { gelb: 321, rot: 283 } },
    { nr: 13, par: 5, si: 14, lengths: { gelb: 462, rot: 409 } },
    { nr: 14, par: 3, si: 18, lengths: { gelb: 127, rot: 109 } },
    { nr: 15, par: 4, si: 4, lengths: { gelb: 378, rot: 310 } },
    { nr: 16, par: 3, si: 16, lengths: { gelb: 148, rot: 131 } },
    { nr: 17, par: 4, si: 10, lengths: { gelb: 316, rot: 279 } },
    { nr: 18, par: 5, si: 12, lengths: { gelb: 477, rot: 419 } },
  ],
};

export const OUT_HOLES = COURSE.holes.slice(0, 9);
export const IN_HOLES = COURSE.holes.slice(9);

export function teeById(id: string) {
  return COURSE.tees.find((t) => t.id === id) ?? COURSE.tees[0];
}

export function holeByNr(nr: number) {
  return COURSE.holes[nr - 1];
}

/** Erstes und letztes Loch der gewählten Runde, 1-basiert und inklusive. */
export function holeRange(layout: RoundLayout): { from: number; to: number } {
  if (layout === 'front') return { from: 1, to: 9 };
  if (layout === 'back') return { from: 10, to: 18 };
  return { from: 1, to: 18 };
}

export function holesOf(layout: RoundLayout) {
  const { from, to } = holeRange(layout);
  return COURSE.holes.slice(from - 1, to);
}

export function parOf(layout: RoundLayout): number {
  if (layout === 'front') return COURSE.parOut;
  if (layout === 'back') return COURSE.parIn;
  return COURSE.par;
}

export function layoutLabel(layout: RoundLayout): string {
  if (layout === 'front') return 'Front 9';
  if (layout === 'back') return 'Back 9';
  return '18 Löcher';
}
