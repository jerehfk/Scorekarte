import { useState } from 'react';
import { COURSES } from '../data/clubs';
import { courseTitle } from '../data/course';
import type { Course } from '../types';

interface Props {
  course: Course;
  onChange: (id: string) => void;
}

/**
 * Clubname als Überschrift; Tippen öffnet eine Dropdown-Karte im Stil des
 * Menüs oben rechts mit allen Plätzen.
 */
export default function ClubPicker({ course, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-2">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-left"
      >
        <h1 className="font-display text-3xl leading-tight">
          {courseTitle(course)} <span className="text-xl text-sand-300/50">▾</span>
        </h1>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="no-scrollbar absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-edge bg-deep-900/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="divide-y divide-edge/60">
              {COURSES.map((c) => {
                const aktiv = c.id === course.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={aktiv}
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[15px] font-medium ${
                          aktiv ? 'text-turf-300' : 'text-sand-100'
                        }`}
                      >
                        {c.club}
                      </span>
                      {c.platz && (
                        <span className="block text-xs text-sand-300/50">{c.platz}</span>
                      )}
                    </span>
                    {aktiv && <span className="shrink-0 text-turf-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
