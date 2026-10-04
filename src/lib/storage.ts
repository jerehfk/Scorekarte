import type { Round } from '../types';

const KEY = 'kuhlendahl.round.v1';

export function loadRound(): Round | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Round;
    // Minimale Plausibilitätsprüfung, damit ein altes/kaputtes Format die App nicht killt.
    if (!Array.isArray(parsed.players) || !parsed.scores) return null;
    // Ältere Runden ergänzen: damals gab es nur die volle Runde und noch keine
    // Allowance – die wurden also mit 100 % gerechnet. Rückwirkend 95 % zu
    // setzen würde eine laufende Karte still verändern.
    return {
      ...parsed,
      layout: parsed.layout ?? 'full',
      allowance: parsed.allowance ?? 100,
    };
  } catch {
    return null;
  }
}

export function saveRound(round: Round | null): void {
  try {
    if (round) localStorage.setItem(KEY, JSON.stringify(round));
    else localStorage.removeItem(KEY);
  } catch {
    // Private-Mode o. ä. – dann läuft die Runde eben ohne Persistenz weiter.
  }
}
