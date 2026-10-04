/**
 * "Welches HCPI habe ich heute gespielt?" und die Wirkung auf den Index.
 *
 * Das erste ist in WHS sauber definiert: das Score Differential.
 *
 *     Differential = (113 / Slope) × (AGS − CR − PCC)
 *
 * Es ist exakt die Umkehrung der Vorgabenformel. Wer genau seine Vorgabe
 * spielt (Par + Vorgabe), bekommt sein eigenes HCPI heraus – bis auf die
 * Rundung der Vorgabe. PCC (Platzzustandsberechnung) ist hier immer 0, den
 * Wert legt der Verband am Spieltag fest, nicht die App.
 *
 * AGS ist der *angepasste* Score: jedes Loch zählt höchstens
 * Netto-Doppelbogey, also Par + 2 + Vorgabenschläge. Ohne diesen Deckel würde
 * ein einzelnes verpatztes Loch das Ergebnis unbrauchbar machen. Die Schläge
 * dafür kommen aus dem Course Handicap zu 100 %, nicht aus der Spielvorgabe –
 * die Allowance ist ein Wettspielfaktor und hat mit der Fortschreibung nichts
 * zu tun.
 *
 * Das zweite – die Wirkung auf den Index – hängt daran, die wievielte gewertete
 * Runde das ist. Siehe `indexWirkung`.
 */

import { holesOf, teeById } from '../data/course';
import { courseHandicap, playerCourseHandicap, strokesOnHole } from './handicap';
import type { Player, Round } from '../types';

export interface HandicapAuswertung {
  /** Gespielte Schläge über die Löcher der Runde. */
  gross: number;
  /** Angepasster Score nach Netto-Doppelbogey. */
  ags: number;
  /** Anzahl Löcher, die der Deckel gekürzt hat. */
  gedeckelt: number;
  /** Score Differential, gerundet auf eine Nachkommastelle. */
  differential: number | null;
  /** Vorgabe, die zu diesem Differential auf diesem Platz gehört. */
  entsprichtVorgabe: number | null;
  /** Differential minus HCPI. Negativ = besser gespielt als der Index. */
  abstand: number | null;
  /** Warum es kein Differential gibt, falls es keins gibt. */
  hinweis: string | null;
}

const runde1 = (x: number) => Math.round(x * 10) / 10;

export function auswerten(round: Round, player: Player): HandicapAuswertung {
  const loecher = holesOf(round.layout);
  const scores = round.scores[player.id] ?? [];
  const tee = teeById(player.teeId);
  // Der Deckel richtet sich nach dem Course Handicap, nicht nach der Spielvorgabe.
  const chcp = playerCourseHandicap(player);

  let gross = 0;
  let ags = 0;
  let gedeckelt = 0;
  let fehlend = 0;

  for (const h of loecher) {
    const s = scores[h.nr - 1];
    if (s == null) {
      fehlend++;
      continue;
    }
    const deckel = h.par + 2 + strokesOnHole(chcp, h.si);
    gross += s;
    ags += Math.min(s, deckel);
    if (s > deckel) gedeckelt++;
  }

  const leer = {
    differential: null,
    entsprichtVorgabe: null,
    abstand: null,
  };

  if (fehlend > 0) {
    return {
      gross,
      ags,
      gedeckelt,
      ...leer,
      hinweis: `${fehlend} ${
        fehlend === 1 ? 'Loch ist' : 'Löcher sind'
      } noch ohne Eintrag. Eine Wertung braucht die vollständige Runde.`,
    };
  }

  if (round.layout !== 'full') {
    return {
      gross,
      ags,
      gedeckelt,
      ...leer,
      hinweis:
        'Für eine Neuner-Runde verlangt WHS das Course Rating dieser neun Löcher. Im Platzdatensatz steht nur die 18-Loch-Wertung – ein Differential daraus wäre geraten.',
    };
  }

  const differential = runde1((113 / tee.slope) * (ags - tee.cr));

  return {
    gross,
    ags,
    gedeckelt,
    differential,
    entsprichtVorgabe: courseHandicap(differential, tee),
    abstand: runde1(differential - player.hcpi),
    hinweis: null,
  };
}

/* ------------------------------------------------------------------ */
/* Wirkung auf den Index                                               */
/* ------------------------------------------------------------------ */

/**
 * Die wievielte gewertete Runde diese ist – inklusive der gerade gespielten.
 * Die Grenzen folgen der WHS-Tabelle 5.2a.
 */
export type Wievielte = '1-2' | '3' | '4' | '5' | '6-19' | '20+';

export const WIEVIELTE_OPTIONEN: { wert: Wievielte; label: string }[] = [
  { wert: '1-2', label: '1. oder 2.' },
  { wert: '3', label: '3.' },
  { wert: '4', label: '4.' },
  { wert: '5', label: '5.' },
  { wert: '6-19', label: '6. bis 19.' },
  { wert: '20+', label: '20. oder später' },
];

export interface IndexWirkung {
  /**
   * `exakt` – die Zahl steht fest, sofern diese Runde die beste ist.
   * `schaetzung` – braucht die Annahme über die verdrängte Runde.
   * `kein-index` / `unbestimmt` – bewusst keine Zahl.
   */
  art: 'exakt' | 'schaetzung' | 'kein-index' | 'unbestimmt';
  neuerIndex: number | null;
  aenderung: number | null;
  text: string;
}

/** Der HCPI ist nach oben bei 54,0 gedeckelt. */
const MAX_HCPI = 54;

export function indexWirkung(
  differential: number,
  hcpi: number,
  wievielte: Wievielte,
): IndexWirkung {
  if (wievielte === '1-2') {
    return {
      art: 'kein-index',
      neuerIndex: null,
      aenderung: null,
      text: 'Einen Index gibt es nach WHS erst ab drei gewerteten Runden, also 54 Löchern. Bis dahin bleibt es bei dem Wert aus der Platzreife.',
    };
  }

  if (wievielte === '6-19') {
    return {
      art: 'unbestimmt',
      neuerIndex: null,
      aenderung: null,
      text: 'Zwischen der 6. und 19. Runde bildet WHS den Schnitt der 2 bis 7 niedrigsten Differentials. Dafür bräuchte die App deine früheren Runden – die kennt sie nicht.',
    };
  }

  if (wievielte === '20+') {
    // Ab 20 Runden ist der Index der Schnitt der besten 8. Eine neue Runde
    // verschiebt ihn nur, wenn sie in diese acht rutscht.
    if (differential >= hcpi) {
      return {
        art: 'schaetzung',
        neuerIndex: runde1(hcpi),
        aenderung: 0,
        text: 'Diese Runde würde den Index nicht direkt verbessern – dafür müsste sie unter deinem HCPI liegen.',
      };
    }
    const aenderung = runde1((differential - hcpi) / 8);
    return {
      art: 'schaetzung',
      neuerIndex: runde1(Math.min(MAX_HCPI, hcpi + aenderung)),
      aenderung,
      text: 'Geschätzt: der Index ist der Schnitt der besten 8 aus 20 Runden, die App kennt die anderen 19 nicht. Gerechnet mit der Annahme, dass diese Runde eine durchschnittliche der besten acht ersetzt – tatsächlich fällt die Änderung meist etwas größer aus.',
    };
  }

  // 3., 4. und 5. Runde: der Index kommt aus dem *niedrigsten* Differential,
  // bei der 3. und 4. mit Abschlag. Ist diese Runde die beste, steht die Zahl fest.
  const abzug = wievielte === '3' ? 2 : wievielte === '4' ? 1 : 0;
  const neuerIndex = runde1(Math.min(MAX_HCPI, differential - abzug));
  const abzugText = abzug ? ` minus ${abzug.toFixed(1).replace('.', ',')}` : '';

  return {
    art: 'exakt',
    neuerIndex,
    aenderung: runde1(neuerIndex - hcpi),
    text: `Bei der ${wievielte}. gewerteten Runde bildet WHS den Index aus dem niedrigsten Differential${abzugText}. Diese Zahl gilt, wenn das hier deine beste Runde ist – lief eine frühere besser, bleibt deren Wert maßgeblich.`,
  };
}
