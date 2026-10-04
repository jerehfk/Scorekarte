import { useState } from 'react';
import Segmented from '../components/Segmented';
import TopMenu, { type AppTab } from '../components/TopMenu';
import { COURSES } from '../data/clubs';
import { COURSE, courseTitle, holeRange, parOf, teeById } from '../data/course';
import {
  courseHandicap,
  formatCourseHcp,
  parseHcpi,
  playingHandicap,
} from '../lib/handicap';
import type { Allowance, Player, RoundLayout, ScoreMode, TeeId } from '../types';

interface Draft {
  id: string;
  name: string;
  hcpi: string;
  teeId: TeeId;
}

interface Props {
  onStart: (
    players: Player[],
    mode: ScoreMode,
    layout: RoundLayout,
    allowance: Allowance,
  ) => void;
  active: AppTab;
  onNavigate: (tab: AppTab) => void;
  courseId: string;
  onCourseChange: (id: string) => void;
}

const ALLOWANCE_HINT: Record<Allowance, string> = {
  100: 'Volle Vorgabe – Privatrunden, und der Wert, auf dem die Vorgabenfortschreibung des Clubs aufsetzt.',
  95: 'Einzel-Zählspiel und Einzel-Stableford nach WHS.',
  85: 'Vierball – jeder Spieler bekommt 85 % seiner Vorgabe.',
};

function newDraft(index: number): Draft {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `p${Date.now()}${index}`,
    name: '',
    hcpi: '',
    teeId: COURSE.tees[0].id,
  };
}

const MAX_PLAYERS = 6;

export default function SetupScreen({
  onStart,
  active,
  onNavigate,
  courseId,
  onCourseChange,
}: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(() => [newDraft(0)]);
  const [mode, setMode] = useState<ScoreMode>('stableford');
  const [layout, setLayout] = useState<RoundLayout>('full');
  const [allowance, setAllowance] = useState<Allowance>(100);

  const patch = (id: string, changes: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...changes } : d)));

  const changeCourse = (id: string) => {
    onCourseChange(id);
    // Abschläge heißen auf jedem Platz anders – auf den ersten des neuen Platzes setzen.
    const tee = COURSES.find((c) => c.id === id)?.tees[0].id;
    if (tee) setDrafts((ds) => ds.map((d) => ({ ...d, teeId: tee })));
  };

  const start = () => {
    const players: Player[] = drafts.map((d, i) => ({
      id: d.id,
      name: d.name.trim() || `Spieler ${i + 1}`,
      hcpi: parseHcpi(d.hcpi) ?? 54,
      teeId: d.teeId,
    }));
    onStart(players, mode, layout, allowance);
  };

  return (
    <div className="safe-top-lg mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pb-8">
      <TopMenu active={active} onNavigate={onNavigate} platzinfo={!!COURSE.platzinfo} />

      <header className="pr-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-turf-400">
          Digitale Scorekarte
        </p>
        <label className="relative mt-2 block">
          <span className="sr-only">Golfclub wählen</span>
          <h1 className="font-display text-3xl leading-tight">
            {courseTitle()} <span className="text-xl text-sand-300/50">▾</span>
          </h1>
          <select
            value={courseId}
            onChange={(e) => changeCourse(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {courseTitle(c)}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-sm text-sand-300/60">
          18 Löcher · Par {COURSE.par} · Out {COURSE.parOut} / In {COURSE.parIn}
        </p>
        {COURSE.ungeprueft && (
          <p className="mt-2 text-[11px] text-flag-400">
            Platzdaten ungeprüft – Par, Vorgaben und Längen bitte mit der Scorekarte des Clubs
            vergleichen.
          </p>
        )}
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sand-300/70">
            Spieler
          </h2>
          <span className="text-xs text-sand-300/40">
            {drafts.length} von {MAX_PLAYERS}
          </span>
        </div>

        {drafts.map((d, i) => {
          const hcpi = parseHcpi(d.hcpi);
          const tee = teeById(d.teeId);
          const chcp = hcpi === null ? null : courseHandicap(hcpi, tee);

          return (
            <div
              key={d.id}
              className="flex flex-col gap-3 rounded-2xl border border-edge bg-deep-900 p-4"
            >
              <div className="flex items-center gap-3">
                <input
                  value={d.name}
                  onChange={(e) => patch(d.id, { name: e.target.value })}
                  placeholder={`Spieler ${i + 1}`}
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-sand-300/25"
                />
                {drafts.length > 1 && (
                  <button
                    type="button"
                    aria-label="Spieler entfernen"
                    onClick={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))}
                    className="shrink-0 rounded-full px-2 py-1 text-lg leading-none text-sand-300/35 hover:text-flag-400"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-32 flex-1 items-center gap-2 rounded-xl border border-edge bg-deep-850 px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-300/50">
                    HCPI
                  </span>
                  <input
                    value={d.hcpi}
                    onChange={(e) => patch(d.id, { hcpi: e.target.value })}
                    inputMode="decimal"
                    placeholder="54,0"
                    className="w-full min-w-0 bg-transparent text-right text-base font-semibold outline-none placeholder:text-sand-300/25"
                  />
                </label>

                <div className="ml-auto flex flex-wrap gap-1 rounded-xl border border-edge bg-deep-850 p-1">
                  {COURSE.tees.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => patch(d.id, { teeId: t.id })}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        d.teeId === t.id
                          ? 'bg-deep-700 text-sand-100'
                          : 'text-sand-300/45'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: t.hex }}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-sand-300/50">
                {chcp === null ? (
                  <>HCPI eingeben – ohne Angabe wird mit 54,0 gerechnet.</>
                ) : (
                  <>
                    Vorgabe{' '}
                    <span className="font-semibold text-turf-300">
                      {formatCourseHcp(chcp)}
                    </span>
                    {allowance !== 100 && (
                      <>
                        {' → Spielvorgabe '}
                        <span className="font-semibold text-turf-300">
                          {formatCourseHcp(playingHandicap(chcp, allowance))}
                        </span>
                      </>
                    )}
                    <span className="text-sand-300/35">
                      {' · CR '}
                      {tee.cr.toFixed(1).replace('.', ',')} · Slope {tee.slope}
                      {allowance !== 100 && ` · ${allowance} %`}
                    </span>
                  </>
                )}
              </p>
            </div>
          );
        })}

        {drafts.length < MAX_PLAYERS && (
          <button
            type="button"
            onClick={() => setDrafts((ds) => [...ds, newDraft(ds.length)])}
            className="rounded-2xl border border-dashed border-edge py-3 text-sm font-semibold text-sand-300/60 hover:text-sand-100"
          >
            + Spieler hinzufügen
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sand-300/70">
          Zählweise
        </h2>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'stableford', label: 'Stableford' },
            { value: 'netto', label: 'Netto' },
            { value: 'brutto', label: 'Brutto' },
          ]}
        />
        <p className="text-[11px] text-sand-300/45">
          Jederzeit während der Runde umschaltbar – die Schlagzahlen bleiben dieselben.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sand-300/70">
          Runde
        </h2>
        <Segmented
          value={layout}
          onChange={setLayout}
          options={[
            { value: 'full', label: '18 Löcher' },
            { value: 'front', label: 'Front 9' },
            { value: 'back', label: 'Back 9' },
          ]}
        />
        <p className="text-[11px] text-sand-300/45">
          {layout === 'full' ? (
            <>Löcher 1–18, Par {parOf('full')} – mit Zwischenstand nach der neunten Bahn.</>
          ) : (
            <>
              Löcher {holeRange(layout).from}–{holeRange(layout).to}, Par {parOf(layout)}.
              Die Vorgabenschläge pro Loch bleiben dieselben wie auf der großen Runde.
            </>
          )}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sand-300/70">
          Allowance
        </h2>
        <Segmented
          value={allowance}
          onChange={setAllowance}
          options={[
            { value: 100, label: '100 %' },
            { value: 95, label: '95 %' },
            { value: 85, label: '85 %' },
          ]}
        />
        <p className="text-[11px] text-sand-300/45">{ALLOWANCE_HINT[allowance]}</p>
      </section>

      <button
        type="button"
        onClick={start}
        className="mt-auto rounded-2xl bg-turf-500 py-4 text-base font-bold text-deep-950 active:scale-[0.99] transition"
      >
        Runde starten
      </button>
    </div>
  );
}
