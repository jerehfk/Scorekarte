# Digitale Scorekarte · Golfclub Velbert – Gut Kuhlendahl

Scorekarte für private Runden auf einem einzigen Platz: 18 Löcher, mehrere Spieler,
Vorgabe pro Loch nach WHS, Zwischenstand nach 9, umschaltbare Zählweise.

React + TypeScript + Vite + Tailwind CSS v4. Kein Backend, keine Anmeldung –
die laufende Runde liegt im `localStorage` des Geräts.

## Loslegen

```bash
npm install
```

```bash
npm run dev
```

## In StackBlitz

1. Auf [stackblitz.com](https://stackblitz.com) ein **Vite → React + TypeScript** Projekt anlegen.
2. Die vorhandenen Dateien dort löschen und den Inhalt dieses Ordners per Drag & Drop
   ins Datei-Panel ziehen – **ohne** `node_modules`, `dist` und `birdiebook.pdf`.
   Gebraucht werden: `src/`, `public/`, `index.html`, `package.json`, `tsconfig.json`,
   `vite.config.ts`.
3. StackBlitz installiert die Abhängigkeiten aus der `package.json` selbst und startet.

Die 18 Bahnengrafiken liegen als WebP in `public/holes/1.webp` … `18.webp`
(zusammen ca. 420 KB) und wurden aus dem Birdiebook des Clubs extrahiert.
Die PDF selbst wird zur Laufzeit nicht gebraucht.

## Platzdaten

Alles an einer Stelle: [`src/data/course.ts`](src/data/course.ts).

Par, Vorgabenverteilung (HCP 1–18) und Längen stammen 1:1 aus dem Birdiebook.
Par 70, Out 35 / In 35, Gelb 5.608 m, Rot 4.930 m.

Course Rating und Slope stehen auf der Clubseite unter „Die Spielbahnen":

| Abschlag | Wertung | CR   | Slope |
| -------- | ------- | ---- | ----- |
| Gelb     | Herren  | 71,8 | 137   |
| Rot      | Damen   | 73,4 | 131   |

Die dort genannte Gesamtlänge von 5.608 m stimmt exakt mit der Summe der
Gelb-Längen aus dem Birdiebook überein – damit ist die Zuordnung Herren = Gelb
bestätigt.

Zwei Dinge, die daran hängen: Die Werte für Rot sind die **Damenwertung**. Spielt
ein Herr von Rot, gilt ein eigenes Rating, das dann als weiterer Abschlag
gehörte. Und weitere Abschläge (Weiß, Blau) ergänzt man so: Eintrag in `tees`
anlegen, `TeeId` in [`src/types.ts`](src/types.ts) erweitern, Länge bei jedem
Loch nachtragen.

## Wie gerechnet wird

Zwei Schritte, jeder für sich auf eine ganze Zahl gerundet – genau in dieser
Reihenfolge schreibt WHS das vor:

```
Vorgabe       = runde( HCPI × Slope / 113 + (CR − Par) )
Spielvorgabe  = runde( Vorgabe × Allowance )
```

Beispiel HCPI 54,0 von Gelb (CR 71,8 · Slope 137 · Par 70):
`54 × 137/113 + 1,8 = 67,27 → Vorgabe 67`, davon 95 % = `63,65 → Spielvorgabe 64`.

Die **Allowance** ist im Setup wählbar: 100 % (Voreinstellung), 95 %
(Einzel-Zählspiel und Einzel-Stableford nach WHS) oder 85 % (Vierball).

Warum 100 % die Voreinstellung ist: die Allowance ist ein reiner
Wettspielfaktor. Sie sorgt in großen Feldern für Chancengleichheit und wirkt nur
auf das Turnierergebnis. Für die **Vorgabenfortschreibung** zählt sie nicht – dort
geht das Course Handicap zu 100 % ein, unter anderem in die Netto-Doppelbogey-
Grenze, mit der das Ergebnis für die Handicap-Rechnung gedeckelt wird. Auf einer
vorgabenwirksamen Runde kann also beides gleichzeitig gelten: 95 % fürs
Turnierergebnis, 100 % für den Handicap-Effekt.

### Vergleich mit handicap-berechnen.de

Wer dort nachrechnet, bekommt andere Zahlen. Dafür gibt es zwei voneinander
unabhängige Gründe.

**Erstens veraltete Platzdaten.** Die Seite rechnet mit CR 71,4, der Club nennt
71,8 – sie blendet dazu selbst den Hinweis „Platzdaten nicht aktuell?" ein. Diese
0,4 verschieben rund 40 % aller HCPI-Werte um einen Schlag.

**Zweitens eine Sonderregel oberhalb von HCPI 36.** Dort wendet die Seite den
Slope nur auf die ersten 36 Punkte an und schlägt den Rest ungewichtet drauf:

```
Seite:  runde( min(HCPI, 36) × Slope/113 + (CR − Par) )  +  max(0, HCPI − 36)
```

Nachgemessen an sieben Werten (HCPI 10 · 20 · 36 · 37 · 39 · 45 · 54) liefert die
Seite 14 · 26 · 45 · 46 · 48 · 54 · 63. Der Knick sitzt genau auf der alten Grenze
der DGV-Vorgabenklasse 6, die früher nicht slope-umgerechnet wurde. Unter WHS gibt
es diese Sonderbehandlung nicht mehr – die Formel gilt durchgehend bis 54,0.

Die Seite rechnet außerdem **ohne Allowance**; zum Vergleichen also hier auf 100 %
stellen.

**Vorgabenschläge pro Loch:** reihum ab HCP 1 verteilt, ausgehend von der
Spielvorgabe – bei 64 also vier Schläge auf den Löchern mit HCP 1–10, drei auf
allen übrigen. Plusspieler (HCPI negativ eintragen, z. B. `-2,4`) geben Schläge ab
HCP 18 zurück.

**Stableford:** `2 + Par + Vorgabenschläge − Schläge`, nie unter 0.
**Netto:** Schläge − Vorgabenschläge. **Brutto:** die reinen Schläge.

Bewusst nicht enthalten: die Fortschreibung des HCPI über die besten 8 aus 20
Runden. Der offizielle Index kommt weiter vom Club bzw. DGV – die App rechnet nur
die Runde.

## Bedienung

- **Eingabe:** ein Loch pro Screen. Die mittlere Zahl im Stepper ist Par und
  grau, solange nichts eingetragen ist – antippen übernimmt Par, `−`/`+` gehen
  von dort aus weiter. So zählt kein Loch mit, das nie gespielt wurde.
- **Punkte-Leiste** unter dem Kopf: gefüllt = alle Spieler eingetragen, halb =
  teilweise. Antippen springt direkt zu diesem Loch.
- **Vorgabe** in der Spielerzeile: die Vorgabenschläge auf genau diesem Loch,
  immer als Zahl. Der farbige Punkt ist das schnelle Signal – grün bekommt
  Schläge, rot gibt welche ab (Plusspieler), grau heißt keine. Rechts daneben in
  Grau steht etwas anderes, nämlich der laufende Gesamtstand.
- **Bahn:** die Birdiebook-Grafik, ein-/ausklappbar (die Einstellung wird
  gemerkt). Antippen öffnet sie formatfüllend.
- **Karte:** die vollständige Scorekarte mit Out/In/Gesamt, klassische Notation
  (Kreis unter Par, Quadrat über Par).
- Die Zählweise ist jederzeit umschaltbar, auch mitten in der Runde – die
  Schlagzahlen bleiben dieselben, nur die Auswertung ändert sich.
- **Umfang** im Setup: 18 Löcher, Front 9 (1–9) oder Back 9 (10–18). Bei den
  Neunern beginnt die Runde direkt am richtigen Loch, der Zwischenstand entfällt
  und die Karte zeigt nur die gespielten Bahnen mit einer Gesamt-Zeile.
- **Abbrechen:** auf dem ersten Loch der Runde heißt die Schaltfläche oben links
  „Abbrechen" und führt zurück zum Start. Vorher fragt ein Dialog nach und sagt,
  auf wie vielen Löchern schon etwas eingetragen ist. „Weiterspielen" liegt dabei
  bewusst oben und ist der grüne Knopf – das Verwerfen ist die stillere Variante
  darunter.

Zur Vorgabe auf einer Neuner-Runde: die Schläge pro Loch sind exakt dieselben wie
auf der großen Runde, es wird nichts halbiert. Die Vorgabenverteilung 1–18
streut die Schläge ohnehin gleichmäßig über beide Neuner, und so bekommst du auf
Loch 2 immer gleich viele Schläge – egal ob du 9 oder 18 spielst. Wer die
WHS-Näherung „halbe Vorgabe" bevorzugt, muss `strokesOnHole` in
[`src/lib/handicap.ts`](src/lib/handicap.ts) anfassen.

## Logo und Icons

Das Motiv: die Kachel ist das Grün, Loch und Fahne sind dunkel ausgespart –
`#22c55e` auf `#04120b`, dieselben Farben wie die App. Das Motiv sitzt fünf
Einheiten links der Mitte, weil die Fahne die Fläche sonst nach rechts kippt.

Alle Dateien werden aus einer Quelle erzeugt:

```bash
python scripts/make_icons.py
```

| Datei                       | wofür                                            |
| --------------------------- | ------------------------------------------------ |
| `favicon.svg`               | Browser-Tab, vektoriell                           |
| `favicon-32.png`            | Fallback für ältere Browser                       |
| `apple-touch-icon.png`      | iOS-Homescreen, 180 px, randlos und ohne Alpha    |
| `icon-192/512.png`          | Android, `purpose: any`                           |
| `icon-maskable-512.png`     | Android adaptive icons, `purpose: maskable`       |

Zwei Fallstricke, die hier schon berücksichtigt sind: iOS rundet die Ecken
selbst ab, deshalb ist `apple-touch-icon.png` randlos und quadratisch – ein
mitgeliefertes Eckenradius würde doppelt gerundet aussehen. Android schneidet je
nach Launcher Kreis, Squircle oder Rechteck aus, deshalb ist das Motiv in der
maskierbaren Variante auf 80 % geschrumpft und bleibt damit innerhalb der
Sicherheitszone.

### Safe Area auf dem iPhone

Als Homescreen-App zeichnet iOS die Statusleiste **über** die Seite
(`apple-mobile-web-app-status-bar-style: black-translucent` zusammen mit
`viewport-fit=cover`). Ohne Gegenmaßnahme liegt der Kopf der App unter Uhrzeit
und Akkuanzeige – im Browser fällt das nicht auf, weil es dort keine Statusleiste
gibt.

Dafür gibt es die Utilities `safe-top` und `safe-top-lg` in
[`src/index.css`](src/index.css). Jeder Bildschirm, der oben anfängt, trägt eine
davon. Auf Geräten ohne Notch ist `env(safe-area-inset-top)` gleich 0, dort ändert
sich also nichts. **Neue Vollbild-Ansichten brauchen die Klasse ebenfalls**, sonst
rutschen sie wieder unter die Statusleiste.

Die Geometrie steht nur in [`scripts/make_icons.py`](scripts/make_icons.py) – das
Skript schreibt auch `public/favicon.svg`. Alles unter `public/` ist erzeugt und
sollte nicht von Hand bearbeitet werden; nach einer Änderung am Skript einmal neu
laufen lassen.

Das Logo taucht bewusst **nirgends in der Oberfläche** auf. Es ist reines
Icon-Material für Browser-Tab und Homescreen – der Code unter `src/` weiß nichts
davon.

## Scorekarte als PDF

Auf dem Schlussstand liegt neben der vollständigen Scorekarte der Knopf **Als PDF
sichern**. Im Dialog wählt man, welche Zählweisen ins PDF sollen – jede wird eine
eigene A4-Seite, sodass man Stableford, Netto und Brutto einzeln weitergeben
kann. Vorausgewählt ist die Zählweise, die gerade angezeigt wird.

Aufgebaut wird das PDF in [`src/lib/scorecardPdf.ts`](src/lib/scorecardPdf.ts).
Drei Punkte, die dort bewusst so gelöst sind:

- **jsPDF wird erst beim Antippen nachgeladen** (dynamischer Import). Die
  Bibliothek wiegt gebaut rund 390 KB und landet in einem eigenen Chunk; das
  Hauptbündel bleibt davon unberührt. Die von jsPDF mitgelieferten `html2canvas`
  und `dompurify` werden nur von dessen `.html()`-Methode gebraucht, die wir nicht
  benutzen – sie laden nie.
- **Teilen statt Herunterladen, wo es geht.** Auf dem iPhone ist der native
  Teilen-Dialog der einzige bequeme Weg in „Dateien" oder eine Nachricht; ein
  reiner Download landet dort im Nirgendwo. Gibt es `navigator.share` mit
  Datei-Unterstützung nicht, fällt die App auf einen normalen Download zurück.
  Bricht der Nutzer das Teilen ab, wird bewusst **nicht** zusätzlich
  heruntergeladen. An `navigator.share` geht ausschließlich `files` – gibt man
  zusätzlich `title` oder `text` mit, legt iOS beim Sichern in „Dateien" aus
  diesem Feld eine zweite, überflüssige `.txt` an.
- **Jede Seite füllt den Satzspiegel.** Zeilenhöhe und Spaltenbreite ergeben sich
  aus Lochanzahl und Spielerzahl, statt fest zu sein: sechs Spieler bekommen
  schmale Spalten über die volle Breite, eine Neuner-Runde mit zwei Spielern
  wird zur Großdruck-Karte. Die Schriftgröße wächst mit der Zeilenhöhe mit,
  gedeckelt bei Faktor 1,8, damit Zahlen nicht in großen Zellen schwimmen.
- **Gerechnet wird nichts neu.** Die Seite zieht dieselben Funktionen aus
  `lib/scoring.ts` und `lib/handicap.ts` wie der Bildschirm, damit PDF und App
  nicht auseinanderlaufen können.

## Gespieltes Handicap

Auf dem Schlussstand führt der Knopf **Gespieltes Handicap** zu einer Auswertung
je Spieler: welchem HCPI die gespielten Schläge entsprechen und wie sich das zum
eigenen Index verhält. Gerechnet wird in
[`src/lib/differential.ts`](src/lib/differential.ts).

Grundlage ist das **Score Differential** nach WHS:

```
Differential = (113 / Slope) × (AGS − CR − PCC)
```

Das ist exakt die Umkehrung der Vorgabenformel: Wer auf jedem Loch Netto-Par
spielt – bei HCPI 18,4 also 94 Schläge – bekommt 18,3 heraus. Die 0,1 Abweichung
ist die Rundung der Vorgabe von 24,108 auf 24, mehr nicht.

`AGS` ist der angepasste Score: jedes Loch zählt höchstens **Netto-Doppelbogey**
(Par + 2 + Vorgabenschläge), sonst würde ein einzelnes verpatztes Loch das
Ergebnis unbrauchbar machen. Die Schläge dafür kommen aus dem Course Handicap zu
100 %, nicht aus der Spielvorgabe – die Allowance ist ein Wettspielfaktor und hat
mit der Fortschreibung nichts zu tun. `PCC` ist immer 0; den Wert legt der
Verband am Spieltag fest, nicht die App.

**Die Wirkung auf den Index hängt daran, die wievielte gewertete Runde das ist.**
Genau danach fragt die Auswahl in der Karte; die Antwort wird pro Spielername
gemerkt. Die Grenzen folgen der WHS-Tabelle 5.2a:

| Diese Runde ist die … | Ergebnis |
| --------------------- | -------- |
| 1. oder 2.            | noch kein Index – WHS braucht drei Runden (54 Löcher) |
| 3.                    | **exakt**: niedrigstes Differential − 2,0 |
| 4.                    | **exakt**: niedrigstes Differential − 1,0 |
| 5.                    | **exakt**: das niedrigste Differential |
| 6. bis 19.            | Schnitt der 2 bis 7 niedrigsten – dafür fehlen die früheren Runden |
| 20. oder später       | **geschätzt** über `Abstand / 8` |

Die drei exakten Fälle gelten unter der Bedingung, dass diese Runde die beste
ist; lief eine frühere besser, bleibt deren Wert maßgeblich. Das steht auch so
in der Karte.

Warum das nötig war: am Anfang zählt eine einzelne Runde fast allein, und der
Index fällt in großen Sprüngen. Ein Anfänger mit HCPI 54, der hier 110 Schläge
spielt, kommt auf ein Differential von 31,5 und damit bei der dritten Runde auf
**29,5**. Die `/8`-Schätzung hätte 51,2 gesagt – über 21 Punkte daneben. Sie
passt eben nur ab 20 Runden.

Der Index ist nach oben bei 54,0 gedeckelt.

Kein Differential gibt es bei unvollständigen Runden und bei Neuner-Runden: WHS
verlangt dafür das Course Rating der gespielten neun Löcher, und im
Platzdatensatz steht nur die 18-Loch-Wertung. Statt einer geratenen Zahl steht
dort eine Erklärung.

## Platzstatus-Icons

Die Kacheln unter Platzstatus benutzen dieselben Icons wie die Clubseite. Die
Pfaddaten liegen in
[`src/components/FacilityIcon.tsx`](src/components/FacilityIcon.tsx), zugeordnet
über das Label, das der Parser von der Website liest. Kommt dort ein neuer
Bereich dazu, den die Datei nicht kennt, rendert ein neutraler Kreis statt eines
Fehlers.

Die Icons stammen aus einem kommerziellen Golf-Icon-Set, das der Club für seine
Website lizenziert hat (die Gruppennamen im Original lauten `18_bag`, `03_court`,
`49_map_point`, `44_cart`, `48_weather`, `02_club`, `20_course`). Für den
privaten Gebrauch dieser App ist das unkritisch; sollte sie irgendwann
öffentlich laufen, wäre das der Punkt, an dem man eine eigene Lizenz braucht
oder die Motive selbst zeichnet.

## Aufs Handy bringen

`npm run build`, dann den `dist/`-Ordner auf Netlify oder Vercel legen (beides
kostenlos, Drag & Drop reicht). Auf dem Handy im Browser öffnen und „Zum
Startbildschirm hinzufügen" – durch `manifest.webmanifest` startet die App dann
ohne Browserleiste im Hochformat, mit richtigem Icon auf iOS wie Android.

**Noch nicht offline-fähig:** dafür fehlt ein Service Worker. Ohne den braucht
die App beim Öffnen Netz. Auf dem Platz ist das der Unterschied zwischen „läuft"
und „läuft nicht", also lohnt sich das noch.
