import { useState, type Dispatch } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import PdfExportDialog from '../components/PdfExportDialog';
import HandicapSheet from './HandicapSheet';
import Segmented from '../components/Segmented';
import Standings from '../components/Standings';
import { COURSE, holeRange, layoutLabel, parOf } from '../data/course';
import type { Action } from '../hooks/useRound';
import { modeUnit, primaryValue, rankPlayers, totalsFor } from '../lib/scoring';
import type { Round, ScoreMode } from '../types';

interface Props {
  round: Round;
  dispatch: Dispatch<Action>;
  onOpenCard: () => void;
}

export default function FinishScreen({ round, dispatch, onOpenCard }: Props) {
  const winner = rankPlayers(round)[0];
  const winnerTotals = winner ? totalsFor(round, winner) : null;

  const [neuOffen, setNeuOffen] = useState(false);
  const [pdfOffen, setPdfOffen] = useState(false);
  const [hcpOffen, setHcpOffen] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="safe-top flex items-center justify-between border-b border-edge px-4 py-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'prev' })}
          className="rounded-full px-2 py-1 text-sm text-sand-300/60"
        >
          ‹ Loch {holeRange(round.layout).to}
        </button>
        <button
          type="button"
          onClick={onOpenCard}
          className="rounded-full border border-edge px-3 py-1 text-xs font-semibold text-sand-300/80"
        >
          Karte
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-turf-400">
            Runde beendet
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">
            {winner && winnerTotals && winnerTotals.holesPlayed > 0 ? (
              <>
                {winner.name} gewinnt
                <span className="block text-2xl text-sand-300/60">
                  {primaryValue(winnerTotals, round.mode)} {modeUnit(round.mode)}
                </span>
              </>
            ) : (
              'Schlussstand'
            )}
          </h1>
          <p className="mt-2 text-sm text-sand-300/55">
            {COURSE.club} · {layoutLabel(round.layout)} · Par {parOf(round.layout)}
          </p>
        </div>

        <Segmented
          value={round.mode}
          onChange={(mode: ScoreMode) => dispatch({ type: 'setMode', mode })}
          size="sm"
          options={[
            { value: 'stableford', label: 'Stableford' },
            { value: 'netto', label: 'Netto' },
            { value: 'brutto', label: 'Brutto' },
          ]}
        />

        <Standings round={round} detailed={round.layout === 'full'} />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenCard}
            className="rounded-2xl border border-edge bg-deep-900 py-3.5 text-sm font-semibold"
          >
            Vollständige Scorekarte
          </button>
          <button
            type="button"
            onClick={() => setPdfOffen(true)}
            className="rounded-2xl border border-edge bg-deep-900 py-3.5 text-sm font-semibold"
          >
            Als PDF sichern
          </button>
          <button
            type="button"
            onClick={() => setHcpOffen(true)}
            className="rounded-2xl border border-edge bg-deep-900 py-3.5 text-sm font-semibold"
          >
            Gespieltes Handicap
          </button>
        </div>
      </main>

      <footer className="safe-bottom sticky bottom-0 border-t border-edge bg-deep-950/90 px-4 pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setNeuOffen(true)}
          className="w-full rounded-2xl bg-turf-500 py-4 text-base font-bold text-deep-950 active:scale-[0.99] transition"
        >
          Neue Runde
        </button>
      </footer>

      {hcpOffen && <HandicapSheet round={round} onClose={() => setHcpOffen(false)} />}

      {pdfOffen && (
        <PdfExportDialog round={round} onClose={() => setPdfOffen(false)} />
      )}

      {neuOffen && (
        <ConfirmDialog
          title="Neue Runde starten?"
          body="Diese Karte wird dabei gelöscht. Die App führt keine Historie – was du behalten willst, notier dir vorher oder mach einen Screenshot."
          confirmLabel="Karte löschen und neu starten"
          cancelLabel="Karte behalten"
          danger
          onConfirm={() => dispatch({ type: 'reset' })}
          onCancel={() => setNeuOffen(false)}
        />
      )}
    </div>
  );
}
