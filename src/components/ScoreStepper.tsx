interface Props {
  value: number | null;
  par: number;
  onChange: (value: number) => void;
}

const BTN =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-edge ' +
  'bg-deep-800 text-2xl font-light text-sand-100 active:scale-95 active:bg-deep-700 ' +
  'transition disabled:opacity-30';

export default function ScoreStepper({ value, par, onChange }: Props) {
  const empty = value == null;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Ein Schlag weniger"
        disabled={!empty && value <= 1}
        onClick={() => onChange(empty ? par - 1 : Math.max(1, value - 1))}
        className={BTN}
      >
        −
      </button>

      <button
        type="button"
        onClick={() => empty && onChange(par)}
        aria-label={empty ? `Par ${par} eintragen` : `${value} Schläge`}
        className="flex h-14 w-16 flex-col items-center justify-center"
      >
        <span
          className={`font-display text-4xl leading-none ${
            empty ? 'text-sand-300/25' : 'text-sand-100'
          }`}
        >
          {empty ? par : value}
        </span>
        {empty && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-sand-300/40">
            Par
          </span>
        )}
      </button>

      <button
        type="button"
        aria-label="Ein Schlag mehr"
        disabled={!empty && value >= 15}
        onClick={() => onChange(empty ? par + 1 : Math.min(15, value + 1))}
        className={BTN}
      >
        +
      </button>
    </div>
  );
}
