export type TeeId = 'gelb' | 'rot';

/** Umschaltbare Zählweise. `netto`/`brutto` sind beides Zählspiel. */
export type ScoreMode = 'stableford' | 'netto' | 'brutto';

/** Umfang der Runde: alle 18, nur Löcher 1–9 oder nur 10–18. */
export type RoundLayout = 'full' | 'front' | 'back';

/**
 * Handicap-Allowance in Prozent. Nach WHS 95 % im Einzel (Zählspiel wie
 * Stableford), 85 % im Vierball; 100 % für die Runde unter Freunden.
 */
export type Allowance = 100 | 95 | 85;

export interface Hole {
  nr: number;
  par: number;
  /** Vorgabenverteilung (Stroke Index) 1–18 */
  si: number;
  lengths: Record<TeeId, number>;
}

export interface Tee {
  id: TeeId;
  label: string;
  /** Hex für den Farbpunkt in der UI */
  hex: string;
  /** Course Rating */
  cr: number;
  /** Slope Rating */
  slope: number;
}

export interface Course {
  club: string;
  par: number;
  parOut: number;
  parIn: number;
  holes: Hole[];
  tees: Tee[];
}

export interface Player {
  id: string;
  name: string;
  /** HCPI (Handicap-Index). Plusspieler negativ, z. B. -2.4 */
  hcpi: number;
  teeId: TeeId;
}

export type Stage = 'hole' | 'turn' | 'finish';

export interface Round {
  id: string;
  startedAt: string;
  mode: ScoreMode;
  layout: RoundLayout;
  allowance: Allowance;
  players: Player[];
  /** playerId -> 18 Schlagzahlen, null = noch nicht eingetragen */
  scores: Record<string, (number | null)[]>;
  currentHole: number;
  stage: Stage;
}
