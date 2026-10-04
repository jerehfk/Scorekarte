/// <reference types="vite/client" />
import type { Course, Hole, Tee } from '../../types';
import { VELBERT } from './velbert';

/**
 * Die übrigen GolfHochZehn-Clubs (golfhochzehn.de). Die JSON-Dateien sind die
 * Rohdaten der Recherche vom 04.10.2026, mit Quellen und offenen Punkten in
 * `sources` und `notes`. Übernommen werden nur Plätze mit vollständigen 18
 * Bahnen (Par und Vorgabe je Loch), sonst lassen sich keine Vorgabenschläge
 * verteilen.
 */
interface RawClub {
  club: string;
  short: string;
  confidence: 'hoch' | 'mittel' | 'niedrig';
  courses: {
    name: string;
    par: number;
    holes: { nr: number; par: number | null; si: number | null; lengths: Record<string, number | null> }[];
    ratings: { tee: string; gender: 'H' | 'D'; cr: number | null; slope: number | null; par?: number | null }[];
  }[];
}

const RAW = import.meta.glob<RawClub>('./*.json', { eager: true, import: 'default' });

const FARBEN: Record<string, { label: string; hex: string }> = {
  weiss: { label: 'Weiß', hex: '#f5f5f4' },
  schwarz: { label: 'Schwarz', hex: '#1c1917' },
  gelb: { label: 'Gelb', hex: '#facc15' },
  blau: { label: 'Blau', hex: '#3b82f6' },
  rot: { label: 'Rot', hex: '#ef4444' },
  orange: { label: 'Orange', hex: '#f97316' },
  magenta: { label: 'Magenta', hex: '#d946ef' },
  gruen: { label: 'Grün', hex: '#22c55e' },
};

function toCourse(slug: string, raw: RawClub, course: RawClub['courses'][number]): Course | null {
  if (course.holes.length !== 18) return null;
  if (course.holes.some((h) => h.par == null || h.si == null)) return null;

  const holes: Hole[] = course.holes.map((h) => {
    const lengths: Hole['lengths'] = {};
    for (const [farbe, m] of Object.entries(h.lengths)) if (m != null) lengths[farbe] = m;
    return { nr: h.nr, par: h.par!, si: h.si!, lengths };
  });

  const tees: Tee[] = course.ratings
    .filter((r) => r.cr != null && r.slope != null)
    .map((r) => {
      const farbe = FARBEN[r.tee] ?? { label: r.tee, hex: '#a8a29e' };
      return {
        id: `${r.tee}-${r.gender.toLowerCase()}`,
        label: `${farbe.label} ${r.gender}`,
        hex: farbe.hex,
        cr: r.cr!,
        slope: r.slope!,
        par: r.par ?? undefined,
        lengthKey: r.tee,
      };
    });
  if (tees.length === 0) return null;

  const parOut = holes.slice(0, 9).reduce((s, h) => s + h.par, 0);
  const parIn = holes.slice(9).reduce((s, h) => s + h.par, 0);
  const mehrerePlaetze = raw.courses.length > 1;

  return {
    id: mehrerePlaetze ? `${slug}-${raw.courses.indexOf(course) + 1}` : slug,
    club: raw.club,
    platz: mehrerePlaetze ? course.name : undefined,
    ungeprueft: raw.confidence === 'niedrig',
    par: parOut + parIn,
    parOut,
    parIn,
    holes,
    tees,
  };
}

const WEITERE: Course[] = Object.entries(RAW)
  .flatMap(([path, raw]) => {
    const slug = path.replace(/^\.\/|\.json$/g, '');
    return raw.courses.map((c) => ({ short: raw.short, course: toCourse(slug, raw, c) }));
  })
  .sort((a, b) => a.short.localeCompare(b.short, 'de'))
  .flatMap(({ course }) => (course ? [course] : []));

/** Velbert zuerst (Heimatclub), danach alphabetisch. */
export const COURSES: Course[] = [VELBERT, ...WEITERE];
