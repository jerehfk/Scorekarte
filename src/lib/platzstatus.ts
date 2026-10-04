/**
 * Platzstatus & Platzbelegung von der Club-Website.
 *
 * Die Seite (https://golfclub-velbert.de/platzbelegung/) liefert keine
 * CORS-Freigabe für fremde Domains, ein direkter fetch() aus der App würde
 * also im Browser blockiert. Deshalb geht der Abruf über den Jina-Reader-
 * Proxy (r.jina.ai), der beliebige Seiten als sauberen, CORS-freien Text
 * ausliefert – kein eigener Server nötig, passt also zum "kein Backend"-Ansatz
 * der App. Fällt der Proxy aus, zeigen wir das zuletzt bekannte Ergebnis (aus
 * localStorage) mit Zeitstempel und einen Link zur echten Seite.
 */

const SOURCE_URL = 'https://golfclub-velbert.de/platzbelegung/';
const READER_URL = `https://r.jina.ai/${SOURCE_URL}`;

const CACHE_KEY = 'kuhlendahl.platzstatus.v1';

export interface PlatzStatusItem {
  label: string;
  value: string;
}

export interface Sperrung {
  wochentag: string;
  abschlaege: string;
  zeiten: string;
  grund: string;
}

export interface Periode {
  zeitraum: string;
  sperrungen: Sperrung[];
}

export interface PlatzStatusData {
  items: PlatzStatusItem[];
  periods: Periode[];
  fetchedAt: string;
}

export const WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const;

/** Reihenfolge passend zu Date#getDay() (0 = Sonntag). */
const WEEKDAY_BY_GETDAY = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

const DATE_RANGE_RE = /^\d{2}\.\d{2}\.\d{4}\s*-\s*\d{2}\.\d{2}\.\d{4}$/;

interface Heading {
  level: 2 | 3;
  text: string;
}

function extractHeadings(text: string): Heading[] {
  const headings: Heading[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const m3 = line.match(/^###\s+(.*)$/);
    if (m3) {
      headings.push({ level: 3, text: m3[1].trim() });
      continue;
    }
    const m2 = line.match(/^##\s+(.*)$/);
    if (m2) headings.push({ level: 2, text: m2[1].trim() });
  }
  return headings;
}

/**
 * Parst den von r.jina.ai gelieferten Text der Platzbelegungs-Seite.
 * Wirft einen Fehler, wenn die erwartete Struktur (Platzstatus- und
 * Platzbelegung-Überschriften) nicht gefunden wird – das signalisiert dem
 * Aufrufer, dass sich das Seitenformat geändert hat, statt still falsche
 * Daten anzuzeigen.
 */
export function parsePlatzStatusText(text: string): Omit<PlatzStatusData, 'fetchedAt'> {
  const headings = extractHeadings(text);

  const statusIdx = headings.findIndex((h) => h.text === 'Platzstatus');
  const belegungIdx = headings.findIndex((h) => h.text === 'Platzbelegung');
  if (statusIdx === -1 || belegungIdx === -1 || belegungIdx < statusIdx) {
    throw new Error('Erwartete Abschnitte nicht gefunden – Seitenformat hat sich geändert?');
  }

  // Platzstatus: Paare aus (h3-Label) -> (h2-Wert).
  const items: PlatzStatusItem[] = [];
  for (let i = statusIdx + 1; i < belegungIdx; i++) {
    const h = headings[i];
    const next = headings[i + 1];
    if (h.level === 3 && next?.level === 2) {
      items.push({ label: h.text, value: next.text });
    }
  }
  if (items.length === 0) {
    throw new Error('Keine Platzstatus-Einträge gefunden.');
  }

  // Platzbelegung: flache Folge von h2-Überschriften, gruppiert per
  // Datumsbereich, darin je Wochentag 0–3 Zusatzfelder (Abschläge, Zeiten,
  // Grund) – siehe Kommentar in parse-test / README für die Herleitung.
  const rest: string[] = [];
  for (let i = belegungIdx + 1; i < headings.length; i++) {
    if (headings[i].level !== 2) continue;
    if (headings[i].text === 'Golfclub Velbert') break; // Footer erreicht
    rest.push(headings[i].text);
  }

  const periods: Periode[] = [];
  let cursor = 0;
  while (cursor < rest.length) {
    const title = rest[cursor];
    if (!DATE_RANGE_RE.test(title.replace(/\s+/g, ''))) {
      cursor++;
      continue;
    }
    cursor++;
    if (rest[cursor] === 'Wochentag') cursor += 4; // Tabellenkopf überspringen

    const rows: Sperrung[] = [];
    let current: Sperrung | null = null;
    while (cursor < rest.length && !DATE_RANGE_RE.test((rest[cursor] ?? '').replace(/\s+/g, ''))) {
      const val = rest[cursor];
      if ((WEEKDAYS as readonly string[]).includes(val)) {
        current = { wochentag: val, abschlaege: '', zeiten: '', grund: '' };
        rows.push(current);
      } else if (current) {
        if (!current.abschlaege) current.abschlaege = val;
        else if (!current.zeiten) current.zeiten = val;
        else if (!current.grund) current.grund = val;
      }
      cursor++;
    }
    periods.push({ zeitraum: title, sperrungen: rows.filter((r) => r.abschlaege) });
  }

  return { items, periods };
}

export async function fetchPlatzStatus(): Promise<PlatzStatusData> {
  const res = await fetch(READER_URL);
  if (!res.ok) throw new Error(`Abruf fehlgeschlagen (${res.status})`);
  const text = await res.text();
  const parsed = parsePlatzStatusText(text);
  const data: PlatzStatusData = { ...parsed, fetchedAt: new Date().toISOString() };
  saveCache(data);
  return data;
}

export function loadCache(): PlatzStatusData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlatzStatusData;
  } catch {
    return null;
  }
}

function saveCache(data: PlatzStatusData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Private-Mode o. ä. – dann eben ohne Cache.
  }
}

function parsePeriodStart(zeitraum: string): Date | null {
  const m = zeitraum.replace(/\s+/g, '').match(/^(\d{2})\.(\d{2})\.(\d{4})-(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function parsePeriodEnd(zeitraum: string): Date | null {
  const m = zeitraum.replace(/\s+/g, '').match(/^(\d{2})\.(\d{2})\.(\d{4})-(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  // Ende des Tages, damit "heute" am letzten Tag der Periode noch zählt.
  return new Date(Number(m[6]), Number(m[5]) - 1, Number(m[4]), 23, 59, 59);
}

/** Die Periode, in der "heute" liegt – oder die erste, falls keine passt. */
export function activePeriod(data: PlatzStatusData, now = new Date()): Periode | null {
  if (data.periods.length === 0) return null;
  const match = data.periods.find((p) => {
    const start = parsePeriodStart(p.zeitraum);
    const end = parsePeriodEnd(p.zeitraum);
    return start && end && now >= start && now <= end;
  });
  return match ?? data.periods[0];
}

/** Gesperrte Abschläge für heute, falls vorhanden. */
export function todaysSperrung(data: PlatzStatusData, now = new Date()): Sperrung | null {
  const period = activePeriod(data, now);
  if (!period) return null;
  const weekday = WEEKDAY_BY_GETDAY[now.getDay()];
  return period.sperrungen.find((s) => s.wochentag === weekday) ?? null;
}

export { SOURCE_URL };
