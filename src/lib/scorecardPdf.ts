/**
 * Scorekarte als PDF.
 *
 * jsPDF wird erst beim Antippen nachgeladen (dynamischer Import), damit die
 * rund 390 KB nicht bei jedem Start der App mitgeladen werden – auf dem Platz
 * zählt jede Sekunde Ladezeit.
 *
 * Pro gewählter Zählweise entsteht eine eigene Seite, damit man die Karten
 * einzeln ausdrucken oder weitergeben kann. Jede Seite füllt den Satzspiegel:
 * Zeilenhöhe und Spaltenbreite ergeben sich aus Spielerzahl und Lochanzahl,
 * statt fest zu sein.
 */

import { COURSE, holeRange, holesOf, layoutLabel, parOf, teeById } from '../data/course';
import {
  formatCourseHcp,
  formatHcpi,
  playerCourseHandicap,
  playerPlayingHandicap,
  strokesOnHole,
} from './handicap';
import { modeLabel, scoreKind, stablefordPoints, totalsFor } from './scoring';
import type { Round, ScoreMode } from '../types';

const RAND = 15;
const SEITE_BREITE = 210;
const NUTZ_BREITE = SEITE_BREITE - 2 * RAND;

/** Grundverhältnis der drei Vorspalten; wird bei Bedarf gemeinsam gestreckt. */
const SPALTE_LOCH = 16;
const SPALTE_PAR = 13;
const SPALTE_HCP = 13;
const VORSPALTEN = SPALTE_LOCH + SPALTE_PAR + SPALTE_HCP;
/** Eine einzelne Spielerspalte soll nicht ins Absurde wachsen. */
const MAX_SPIELER_SPALTE = 60;
const MAX_VOR_FAKTOR = 1.6;

const KOPF_Y = 36;
const FUSSNOTE_Y = 287;
/** Höhe einer Zeile im Spielerblock unter der Tabelle. */
const BLOCK_ZEILE = 4.6;

const TINTE: [number, number, number] = [26, 26, 26];
const GRAU: [number, number, number] = [125, 125, 125];
const LINIE: [number, number, number] = [190, 190, 190];

type Doc = import('jspdf').jsPDF;

interface Zeile {
  art: 'loch' | 'summe';
  label: string;
  par: number;
  si?: number;
  von: number;
  bis: number;
  stark?: boolean;
}

function zeilen(round: Round): Zeile[] {
  const { from, to } = holeRange(round.layout);
  const loch = holesOf(round.layout).map(
    (h): Zeile => ({
      art: 'loch',
      label: String(h.nr),
      par: h.par,
      si: h.si,
      von: h.nr,
      bis: h.nr,
    }),
  );

  if (round.layout !== 'full') {
    return [
      ...loch,
      { art: 'summe', label: 'Gesamt', par: parOf(round.layout), von: from, bis: to, stark: true },
    ];
  }

  return [
    ...loch.slice(0, 9),
    { art: 'summe', label: 'Out', par: COURSE.parOut, von: 1, bis: 9 },
    ...loch.slice(9),
    { art: 'summe', label: 'In', par: COURSE.parIn, von: 10, bis: 18 },
    { art: 'summe', label: 'Gesamt', par: COURSE.par, von: 1, bis: 18, stark: true },
  ];
}

/** Kreis für unter Par, Quadrat für über Par – wie auf der Papierkarte. */
function markiere(doc: Doc, x: number, y: number, gross: number, par: number, skala: number) {
  const kind = scoreKind(gross, par);
  if (kind === 'par') return;

  doc.setDrawColor(...TINTE);
  doc.setLineWidth(0.25);

  const rund = kind === 'birdie' || kind === 'eagle' || kind === 'albatross';
  const doppelt = kind !== 'birdie' && kind !== 'bogey';
  const r = 2.8 * skala;

  for (const groesse of doppelt ? [r * 0.93, r * 1.21] : [r]) {
    if (rund) doc.circle(x, y - skala, groesse, 'S');
    else doc.rect(x - groesse, y - skala - groesse, groesse * 2, groesse * 2, 'S');
  }
}

function datumsText(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function seite(doc: Doc, round: Round, mode: ScoreMode) {
  const nSp = round.players.length;
  const reihen = zeilen(round);

  // Waagerecht: erst bekommen die Spielerspalten ihren Anteil, die übrige
  // Breite geht an die Vorspalten. So steht die Tabelle bei jeder Spielerzahl
  // im Satzspiegel, statt bei zwei Spielern als schmaler Streifen zu enden.
  const spalten = Math.min(MAX_SPIELER_SPALTE, (NUTZ_BREITE - VORSPALTEN) / nSp);
  const vorFaktor = Math.min(
    MAX_VOR_FAKTOR,
    Math.max(1, (NUTZ_BREITE - spalten * nSp) / VORSPALTEN),
  );
  const cLoch = SPALTE_LOCH * vorFaktor;
  const cPar = SPALTE_PAR * vorFaktor;
  const cHcp = SPALTE_HCP * vorFaktor;
  const vorspalten = cLoch + cPar + cHcp;
  const tabellenBreite = vorspalten + spalten * nSp;
  const x0 = RAND;
  const mitteVon = (i: number) => x0 + vorspalten + spalten * i + spalten / 2;

  // Senkrecht: die Zeilen füllen den Raum bis zum Spielerblock. Die Schrift
  // wächst mit, sonst schwimmen kleine Zahlen in großen Zellen.
  const tabellenStart = KOPF_Y + 5;
  const tabellenEnde = FUSSNOTE_Y - 8 - nSp * BLOCK_ZEILE - 8;
  const hoehe = (tabellenEnde - tabellenStart) / reihen.length;
  const skala = Math.min(1.8, Math.max(0.85, hoehe / 9.5));
  const fs = (basis: number) => doc.setFontSize(basis * skala);

  // Kopf
  doc.setTextColor(...TINTE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(COURSE.club, RAND, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAU);
  doc.text(
    `${layoutLabel(round.layout)} · Par ${parOf(round.layout)} · ${datumsText(round.startedAt)}`,
    RAND,
    26,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TINTE);
  doc.text(modeLabel(mode), SEITE_BREITE - RAND, 20, { align: 'right' });

  // Tabellenkopf
  doc.setFontSize(8);
  doc.setTextColor(...GRAU);
  doc.text('Loch', x0 + cLoch / 2, KOPF_Y, { align: 'center' });
  doc.text('Par', x0 + cLoch + cPar / 2, KOPF_Y, { align: 'center' });
  doc.text('HCP', x0 + cLoch + cPar + cHcp / 2, KOPF_Y, { align: 'center' });

  round.players.forEach((p, i) => {
    doc.setTextColor(...TINTE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(p.name, mitteVon(i), KOPF_Y, { align: 'center', maxWidth: spalten - 2 });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAU);
    doc.setFontSize(6.5);
    doc.text(
      `SpV ${formatCourseHcp(playerPlayingHandicap(p, round.allowance))}`,
      mitteVon(i),
      KOPF_Y + 3.2,
      { align: 'center' },
    );
  });

  let y = tabellenStart;
  doc.setDrawColor(...LINIE);
  doc.setLineWidth(0.3);
  doc.line(x0, y, x0 + tabellenBreite, y);

  for (const zeile of reihen) {
    y += hoehe;
    const mitteY = y - hoehe / 2 + 1.6 * skala;

    if (zeile.art === 'summe') {
      doc.setFillColor(zeile.stark ? 232 : 243, zeile.stark ? 240 : 243, zeile.stark ? 233 : 243);
      doc.rect(x0, y - hoehe, tabellenBreite, hoehe, 'F');
    }

    doc.setFont('helvetica', zeile.art === 'summe' ? 'bold' : 'normal');
    fs(zeile.art === 'summe' ? 8.5 : 9);
    doc.setTextColor(...TINTE);
    doc.text(zeile.label, x0 + cLoch / 2, mitteY, { align: 'center' });

    doc.setTextColor(...GRAU);
    doc.setFont('helvetica', 'normal');
    doc.text(String(zeile.par), x0 + cLoch + cPar / 2, mitteY, { align: 'center' });
    if (zeile.si != null) {
      fs(7.5);
      doc.text(String(zeile.si), x0 + cLoch + cPar + cHcp / 2, mitteY, { align: 'center' });
    }

    round.players.forEach((p, i) => {
      const mitte = mitteVon(i);
      doc.setTextColor(...TINTE);

      if (zeile.art === 'summe') {
        const t = totalsFor(round, p, zeile.von, zeile.bis);
        const wert =
          t.holesPlayed === 0
            ? '–'
            : String(mode === 'stableford' ? t.points : mode === 'netto' ? t.netto : t.gross);
        doc.setFont('helvetica', 'bold');
        fs(9);
        doc.text(wert, mitte, mitteY, { align: 'center' });
        return;
      }

      const gross = round.scores[p.id]?.[zeile.von - 1] ?? null;
      doc.setFont('helvetica', 'normal');
      fs(9.5);
      if (gross == null) {
        doc.setTextColor(...LINIE);
        doc.text('–', mitte, mitteY, { align: 'center' });
        return;
      }

      doc.text(String(gross), mitte, mitteY, { align: 'center' });
      markiere(doc, mitte, mitteY, gross, zeile.par, skala);

      if (mode !== 'brutto') {
        const strokes = strokesOnHole(playerPlayingHandicap(p, round.allowance), zeile.si!);
        const neben =
          mode === 'stableford'
            ? stablefordPoints(gross, zeile.par, strokes)
            : gross - strokes;
        fs(6.5);
        doc.setTextColor(...GRAU);
        // Dicht an die Schlagzahl, sonst liest man sie der Nachbarspalte zu.
        doc.text(String(neben), mitte + 8 * skala, mitteY, { align: 'right' });
      }
    });

    doc.setDrawColor(...LINIE);
    doc.setLineWidth(zeile.art === 'summe' ? 0.3 : 0.1);
    doc.line(x0, y, x0 + tabellenBreite, y);
  }

  // Spielerblock
  let fussY = y + 8;
  doc.setFontSize(7.5);
  for (const p of round.players) {
    const tee = teeById(p.teeId);
    const chcp = playerCourseHandicap(p);
    const spv = playerPlayingHandicap(p, round.allowance);
    doc.setTextColor(...TINTE);
    doc.setFont('helvetica', 'bold');
    doc.text(p.name, RAND, fussY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAU);
    doc.text(
      `HCPI ${formatHcpi(p.hcpi)} · Abschlag ${tee.label} (CR ${tee.cr
        .toFixed(1)
        .replace('.', ',')} / Slope ${tee.slope}) · Vorgabe ${formatCourseHcp(chcp)}` +
        (round.allowance === 100
          ? ''
          : ` · Spielvorgabe ${formatCourseHcp(spv)} bei ${round.allowance} %`),
      RAND + 32,
      fussY,
    );
    fussY += BLOCK_ZEILE;
  }

  doc.setFontSize(6.5);
  doc.setTextColor(...LINIE);
  doc.text(
    `Erstellt am ${datumsText(new Date().toISOString())} · ` +
      (mode === 'brutto'
        ? 'Zahlen sind die gespielten Schläge'
        : `Große Zahl: Schläge · kleine Zahl: ${mode === 'stableford' ? 'Stableford-Punkte' : 'Netto'}`),
    RAND,
    FUSSNOTE_Y,
  );
}

export function pdfDateiname(round: Round): string {
  const d = new Date(round.startedAt);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return `Scorekarte_Gut-Kuhlendahl_${iso}.pdf`;
}

export async function buildScorecardPdf(
  round: Round,
  modes: ScoreMode[],
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  modes.forEach((mode, i) => {
    if (i > 0) doc.addPage();
    seite(doc, round, mode);
  });

  return doc.output('blob');
}

/**
 * Teilen wo möglich, sonst herunterladen.
 *
 * Auf dem iPhone ist der native Teilen-Dialog der einzige bequeme Weg in
 * "Dateien" oder eine Nachricht; ein reiner Download landet dort im Nirgendwo.
 *
 * Wichtig: ausschließlich `files` übergeben. Nimmt man zusätzlich `title` oder
 * `text` dazu, legt iOS beim Sichern in "Dateien" aus diesem Feld eine zweite
 * Datei an – man bekommt dann neben dem PDF eine überflüssige .txt.
 */
export async function shareOrDownloadPdf(blob: Blob, dateiname: string): Promise<void> {
  const datei = new File([blob], dateiname, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [datei] })) {
    try {
      await navigator.share({ files: [datei] });
      return;
    } catch (err) {
      // Abbruch durch den Nutzer ist kein Fehler – dann auch nicht herunterladen.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // Alles andere (z. B. verlorene Nutzergeste) fällt auf den Download zurück.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
