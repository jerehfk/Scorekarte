interface Props {
  strokes: number;
}

/**
 * Vorgabenschläge auf diesem Loch – auf der Papierkarte die Bleistiftpunkte
 * neben dem Loch.
 *
 * Bewusst immer mit Zahl statt einer Punktreihe: eine Reihe muss man zählen,
 * und bei zwei gegen drei Punkten verschätzt man sich auf dem Platz. Der farbige
 * Punkt bleibt als schnelles Signal – grün bekommt Schläge, rot gibt welche ab
 * (Plusspieler), grau heißt: auf diesem Loch gibt es keine.
 */
export default function HoleStrokes({ strokes }: Props) {
  const dot =
    strokes > 0 ? 'bg-turf-400' : strokes < 0 ? 'bg-flag-400' : 'bg-sand-300/25';
  const value =
    strokes < 0 ? `−${Math.abs(strokes)}` : String(strokes);

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-sand-300/40"
      title={`${strokes} Vorgabenschläge auf diesem Loch`}
    >
      Vorgabe
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className={strokes === 0 ? 'text-sand-300/40' : 'text-turf-300'}>
        {value}
      </span>
    </span>
  );
}
