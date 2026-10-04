import { useState } from 'react';
import { usePlatzstatus } from '../hooks/usePlatzstatus';
import {
  SOURCE_URL,
  WEEKDAYS,
  activePeriod,
  defaultPeriod,
  type Periode,
  type Sperrung,
} from '../lib/platzstatus';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/** Alle sieben Wochentage, mit Sperrung wo vorhanden – wie in der Tabelle der Website. */
function fullWeek(sperrungen: Sperrung[]): Array<{ wochentag: string; sperrung: Sperrung | null }> {
  return WEEKDAYS.map((wochentag) => ({
    wochentag,
    sperrung: sperrungen.find((s) => s.wochentag === wochentag) ?? null,
  }));
}

/** Kurzform "17.–23.08." für die Reiter, wenn mehrere Zeiträume vorliegen. */
function shortRange(zeitraum: string): string {
  const m = zeitraum.replace(/\s+/g, '').match(/^(\d{2})\.(\d{2})\.\d{4}-(\d{2})\.(\d{2})\.\d{4}$/);
  if (!m) return zeitraum;
  const [, d1, mo1, d2, mo2] = m;
  return mo1 === mo2 ? `${d1}.–${d2}.${mo2}.` : `${d1}.${mo1}.–${d2}.${mo2}.`;
}

/** Leerzeichen um den Bindestrich, damit "17.08.2026-23.08.2026" nicht verklebt wirkt. */
function formatZeitraum(zeitraum: string): string {
  return zeitraum.replace(/\s*-\s*/, ' - ');
}

const WEEKDAY_BY_GETDAY = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

function WeekTable({ period, highlightToday }: { period: Periode; highlightToday: boolean }) {
  const todayName = WEEKDAY_BY_GETDAY[new Date().getDay()];

  return (
    <div className="overflow-hidden rounded-xl border border-edge">
      {/* Automatisches Spaltenlayout statt fester Prozentbreiten, dazu kurze
          Wochentage: so passen auch lange Wörter wie "(Kanonenstart)" in ihre
          Zelle, statt über den Rand zu laufen. */}
      <table className="w-full border-collapse text-[11px] leading-snug [&_td]:hyphens-auto [&_td]:break-words [&_th]:hyphens-auto">
        <thead>
          <tr className="divide-x divide-edge/40 bg-turf-600">
            <th className="px-2 py-2 text-left font-semibold text-deep-950">Tag</th>
            <th className="px-2 py-2 text-left font-semibold text-deep-950">Abschläge</th>
            <th className="px-2 py-2 text-left font-semibold text-deep-950">Zeiten</th>
            <th className="px-2 py-2 text-left font-semibold text-deep-950">Grund</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge/40">
          {fullWeek(period.sperrungen).map(({ wochentag, sperrung }, i) => {
            const isToday = highlightToday && wochentag === todayName;
            return (
              <tr
                key={wochentag}
                className={`divide-x divide-edge/40 ${
                  isToday ? 'bg-turf-500/15' : i % 2 === 0 ? 'bg-deep-900' : 'bg-deep-850'
                }`}
              >
                <td
                  className={`px-2 py-2 align-top font-semibold ${
                    isToday ? 'text-turf-300' : 'text-sand-100'
                  }`}
                >
                  <abbr title={wochentag} className="no-underline">
                    {wochentag.slice(0, 2)}
                  </abbr>
                </td>
                <td className="px-2 py-2 align-top text-sand-300/80">{sperrung?.abschlaege}</td>
                <td className="px-2 py-2 align-top text-sand-300/80">{sperrung?.zeiten}</td>
                <td className="px-2 py-2 align-top text-sand-300/80">{sperrung?.grund}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PlatzbelegungCard() {
  const { data, loading, error, refresh } = usePlatzstatus();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl leading-tight">Platzbelegung</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="text-[11px] font-semibold text-sand-300/40 disabled:opacity-40"
        >
          {loading ? 'Aktualisiere …' : 'Aktualisieren'}
        </button>
      </div>

      {!data && loading && <p className="text-sm text-sand-300/50">Wird geladen …</p>}

      {!data && !loading && (
        <div>
          <p className="text-sm text-sand-300/60">Platzbelegung konnte nicht geladen werden.</p>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-turf-400 underline underline-offset-2"
          >
            Auf der Club-Website ansehen
          </a>
        </div>
      )}

      {data && data.periods.length === 0 && (
        <p className="text-sm text-turf-300">Aktuell keine gesperrten Abschläge eingetragen.</p>
      )}

      {data && data.periods.length > 0 && (() => {
        const active = activePeriod(data);
        const period =
          data.periods.find((p) => p.zeitraum === selected) ?? defaultPeriod(data) ?? data.periods[0];

        return (
          <>
            {data.periods.length > 1 && (
              <div className="flex gap-2">
                {data.periods.map((p) => (
                  <button
                    key={p.zeitraum}
                    type="button"
                    onClick={() => setSelected(p.zeitraum)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      p.zeitraum === period.zeitraum
                        ? 'border-turf-500 bg-turf-500 text-deep-950'
                        : 'border-edge text-sand-300/60'
                    }`}
                  >
                    {shortRange(p.zeitraum)}
                  </button>
                ))}
              </div>
            )}

            {!active && (
              <p className="text-xs text-sand-300/60">
                Die Club-Website listet die laufende Woche nicht mehr.{' '}
                <a
                  href={SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-turf-400 underline underline-offset-2"
                >
                  Zur Website
                </a>
              </p>
            )}

            <h3 className="font-display text-2xl leading-tight text-turf-300">
              {formatZeitraum(period.zeitraum)}
            </h3>

            <WeekTable period={period} highlightToday={active?.zeitraum === period.zeitraum} />
          </>
        );
      })()}

      {data && (
        <p className="text-[10px] text-sand-300/35">
          Stand: {formatTime(data.fetchedAt)} Uhr
          {error && ' · Aktualisierung fehlgeschlagen, letzter bekannter Stand'}
        </p>
      )}
    </section>
  );
}
