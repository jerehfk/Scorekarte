import { useEffect, useState } from 'react';
import {
  buildScorecardPdf,
  pdfDateiname,
  shareOrDownloadPdf,
} from '../lib/scorecardPdf';
import { modeLabel } from '../lib/scoring';
import type { Round, ScoreMode } from '../types';

interface Props {
  round: Round;
  onClose: () => void;
}

const ALLE: ScoreMode[] = ['stableford', 'netto', 'brutto'];

const BESCHREIBUNG: Record<ScoreMode, string> = {
  stableford: 'Schläge und Punkte je Loch',
  netto: 'Schläge und Netto je Loch',
  brutto: 'nur die gespielten Schläge',
};

export default function PdfExportDialog({ round, onClose }: Props) {
  // Vorausgewählt ist die Zählweise, die gerade angezeigt wird.
  const [gewaehlt, setGewaehlt] = useState<ScoreMode[]>([round.mode]);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const umschalten = (mode: ScoreMode) =>
    setGewaehlt((g) =>
      g.includes(mode) ? g.filter((m) => m !== mode) : [...ALLE.filter((m) => g.includes(m) || m === mode)],
    );

  const alleDrei = gewaehlt.length === 3;

  const erstellen = async () => {
    setBusy(true);
    setFehler(null);
    try {
      const blob = await buildScorecardPdf(round, gewaehlt);
      await shareOrDownloadPdf(blob, pdfDateiname(round));
      onClose();
    } catch (err) {
      setFehler(
        err instanceof Error ? err.message : 'PDF konnte nicht erstellt werden.',
      );
      setBusy(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={() => !busy && onClose()}
      className="safe-bottom fixed inset-0 z-50 flex items-end justify-center bg-deep-950/85 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scorekarte als PDF"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-edge bg-deep-900 p-6"
      >
        <h2 className="font-display text-2xl leading-tight">Scorekarte als PDF</h2>
        <p className="mt-2 text-sm leading-relaxed text-sand-300/60">
          Jede gewählte Zählweise wird eine eigene Seite.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {ALLE.map((mode) => {
            const aktiv = gewaehlt.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                onClick={() => umschalten(mode)}
                aria-pressed={aktiv}
                disabled={busy}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:opacity-50 ${
                  aktiv
                    ? 'border-turf-500/50 bg-turf-500/10'
                    : 'border-edge bg-deep-850'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                    aktiv
                      ? 'border-turf-500 bg-turf-500 text-deep-950'
                      : 'border-edge text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{modeLabel(mode)}</span>
                  <span className="block text-[11px] text-sand-300/45">
                    {BESCHREIBUNG[mode]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => setGewaehlt(alleDrei ? [round.mode] : [...ALLE])}
          className="mt-3 text-xs font-semibold text-sand-300/50 disabled:opacity-50"
        >
          {alleDrei ? 'Nur die aktuelle Zählweise' : 'Alle drei Karten'}
        </button>

        {fehler && (
          <p className="mt-4 text-xs leading-relaxed text-flag-400">{fehler}</p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={erstellen}
            disabled={busy || gewaehlt.length === 0}
            className="rounded-2xl bg-turf-500 py-3.5 text-base font-bold text-deep-950 transition active:scale-[0.99] disabled:opacity-40"
          >
            {busy
              ? 'Wird erstellt …'
              : gewaehlt.length > 1
                ? `${gewaehlt.length} Seiten erstellen`
                : 'PDF erstellen'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-2xl border border-edge py-3.5 text-base font-semibold text-sand-300/80 disabled:opacity-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
