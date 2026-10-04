import type { Course, RoundLayout } from '../types';
import { COURSES } from './clubs';

/**
 * Der gerade aktive Platz. `selectCourse` tauscht ihn aus; dank ES-Modul-Live-
 * Bindings sehen alle Importe von `COURSE`, `OUT_HOLES` und `IN_HOLES` danach
 * den neuen Platz. App.tsx ruft `selectCourse` vor dem Rendern der Screens auf.
 */
export let COURSE: Course = COURSES[0];
export let OUT_HOLES = COURSE.holes.slice(0, 9);
export let IN_HOLES = COURSE.holes.slice(9);

export function courseById(id: string | undefined): Course {
  return COURSES.find((c) => c.id === id) ?? COURSES[0];
}

export function selectCourse(id: string | undefined): void {
  const next = courseById(id);
  if (next === COURSE) return;
  COURSE = next;
  OUT_HOLES = COURSE.holes.slice(0, 9);
  IN_HOLES = COURSE.holes.slice(9);
}

/** Club und ggf. Platz in einer Zeile, z. B. für Überschriften und PDF. */
export function courseTitle(course: Course = COURSE): string {
  return course.platz ? `${course.club} · ${course.platz}` : course.club;
}

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
