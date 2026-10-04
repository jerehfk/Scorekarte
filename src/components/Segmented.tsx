interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

export default function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  size = 'md',
}: Props<T>) {
  const pad = size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-sm';

  return (
    <div className="flex gap-1 rounded-2xl border border-edge bg-deep-900 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex-1 rounded-xl px-3 font-semibold transition-colors ${pad} ${
              active
                ? 'bg-turf-500 text-deep-950 shadow-[0_2px_12px_-2px_rgba(34,197,94,0.6)]'
                : 'text-sand-300/70 hover:text-sand-100'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
