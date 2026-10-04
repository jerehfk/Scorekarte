import { teeById } from '../data/course';
import { useSticky } from '../hooks/useSticky';
import {
  auswerten,
  indexWirkung,
  WIEVIELTE_OPTIONEN,
  type Wievielte,
} from '../lib/differential';
import { formatCourseHcp, formatHcpi } from '../lib/handicap';
import type { Round } from '../types';

interface Props {
  round: Round;
  onClose: () => void;
}

const komma = (x: number) => Math.abs(x).toFixed(1).replace('.', ',');

export default function HandicapSheet({ round, onClose }: Props) {
  // Nach Spielername gemerkt, damit man es nicht jede Runde neu einstellt.
  const [gemerkt, setGemerkt] = useSticky<Record<string, Wievielte>>(
    'kuhlendahl.wievielte.v1',
    {},
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-deep-950">
      <header className="safe-top border-b border-edge px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <h2 className="font-display text-xl">Gespieltes Handicap</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-edge px-4 py-1.5 text-sm font-semibold"
          >
            Schließen
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-4">
        <ul className="mx-auto flex max-w-md flex-col gap-3">
          {round.players.map((player) => {
            const a = auswerten(round, player);
            const tee = teeById(player.teeId);
            const wievielte = gemerkt[player.name] ?? '20+';
            const w =
              a.differential == null
                ? null
                : indexWirkung(a.differential, player.hcpi, wievielte);

            return (
              <li
                key={player.id}
                className="rounded-2xl border border-edge bg-deep-900 p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold">{player.name}</span>
                  <span className="shrink-0 text-xs text-sand-300/45">
                    {a.gross} Schläge
                    {a.gedeckelt > 0 && ` · gewertet ${a.ags}`}
                  </span>
                </div>

                {a.differential == null ? (
                  <p className="mt-3 text-xs leading-relaxed text-sand-300/50">
                    {a.hinweis}
                  </p>
                ) : (
                  <>
                    <div className="mt-4 flex items-end gap-3">
                      <span className="font-display text-4xl leading-none text-turf-300">
                        {formatHcpi(a.differential)}
                      </span>
                      <span className="pb-1 text-[11px] leading-snug text-sand-300/50">
                        gespieltes HCPI
                        <br />
                        <span className="text-sand-300/35">
                          entspricht Vorgabe {formatCourseHcp(a.entsprichtVorgabe!)} von{' '}
                          {tee.label}
                        </span>
                      </span>
                    </div>

                    {a.gedeckelt > 0 && (
                      <p className="mt-3 text-[11px] leading-relaxed text-sand-300/40">
                        {a.gedeckelt}{' '}
                        {a.gedeckelt === 1 ? 'Loch wurde' : 'Löcher wurden'} auf
                        Netto-Doppelbogey gekürzt – für die Handicap-Rechnung zählen{' '}
                        {a.ags} statt {a.gross} Schläge.
                      </p>
                    )}

                    <p className="mt-3 text-xs text-sand-300/60">
                      {a.abstand! < 0 ? (
                        <>
                          <span className="font-semibold text-turf-300">
                            {komma(a.abstand!)} besser
                          </span>{' '}
                          als HCPI {formatHcpi(player.hcpi)}.
                        </>
                      ) : a.abstand! > 0 ? (
                        <>
                          <span className="font-semibold text-sand-300/80">
                            {komma(a.abstand!)} schlechter
                          </span>{' '}
                          als HCPI {formatHcpi(player.hcpi)}.
                        </>
                      ) : (
                        <>Genau auf HCPI {formatHcpi(player.hcpi)}.</>
                      )}
                    </p>

                    <div className="mt-4 border-t border-edge pt-3">
                      <label className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-sand-300/50">
                          Diese Runde ist deine
                        </span>
                        <select
                          value={wievielte}
                          onChange={(e) =>
                            setGemerkt({
                              ...gemerkt,
                              [player.name]: e.target.value as Wievielte,
                            })
                          }
                          className="rounded-xl border border-edge bg-deep-850 px-3 py-1.5 text-xs font-semibold text-sand-100 outline-none"
                        >
                          {WIEVIELTE_OPTIONEN.map((o) => (
                            <option key={o.wert} value={o.wert}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {w && (w.art === 'exakt' || w.art === 'schaetzung') && (
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-sand-300/40">
                            {w.art === 'exakt' ? 'Neuer Index' : 'Index etwa'}
                          </span>
                          <span className="font-display text-2xl leading-none text-turf-300">
                            {formatHcpi(w.neuerIndex!)}
                          </span>
                          {w.aenderung !== 0 && (
                            <span
                              className={`text-xs font-semibold ${
                                w.aenderung! < 0 ? 'text-turf-300' : 'text-flag-400'
                              }`}
                            >
                              {w.aenderung! < 0 ? '−' : '+'}
                              {komma(w.aenderung!)}
                            </span>
                          )}
                        </div>
                      )}

                      {w && (
                        <p className="mt-2 text-[11px] leading-relaxed text-sand-300/40">
                          {w.text}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mx-auto mt-5 max-w-md text-[11px] leading-relaxed text-sand-300/40">
          Das gespielte HCPI ist das Score Differential nach WHS:{' '}
          <span className="text-sand-300/55">(113 / Slope) × (Score − CR)</span>. Es ist
          die Umkehrung der Vorgabenformel – wer genau seine Vorgabe spielt, bekommt
          sein eigenes HCPI heraus. Verbindlich ist am Ende immer die Fortschreibung
          des Clubs, und die zählt nur für vorgabenwirksame Runden.
        </p>
      </div>
    </div>
  );
}
