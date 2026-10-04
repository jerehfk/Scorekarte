import type { ScoreKind } from '../lib/scoring';

interface Props {
  value: number;
  kind: ScoreKind;
  size?: 'sm' | 'md';
}

/**
 * Klassische Scorekarten-Notation: Kreis unter Par, Quadrat über Par,
 * doppelt für Eagle bzw. Doppelbogey und schlechter.
 */
const STYLE: Record<ScoreKind, { shape: string; color: string; rings: number }> = {
  albatross: { shape: 'rounded-full', color: 'border-gold-400 text-gold-400', rings: 2 },
  eagle: { shape: 'rounded-full', color: 'border-gold-400 text-gold-400', rings: 2 },
  birdie: { shape: 'rounded-full', color: 'border-flag-400 text-flag-400', rings: 1 },
  par: { shape: '', color: 'text-sand-100', rings: 0 },
  bogey: { shape: 'rounded-[5px]', color: 'border-sky-tee text-sky-tee', rings: 1 },
  double: { shape: 'rounded-[5px]', color: 'border-indigo-400 text-indigo-400', rings: 2 },
  worse: { shape: 'rounded-[5px]', color: 'border-slate-500 text-slate-400', rings: 2 },
};

export default function ScoreBadge({ value, kind, size = 'md' }: Props) {
  const { shape, color, rings } = STYLE[kind];
  const box = size === 'sm' ? 'h-7 w-7 text-[13px]' : 'h-10 w-10 text-lg';

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center font-semibold ${box} ${color}`}>
      {rings >= 1 && <span className={`absolute inset-0 border-[1.5px] ${shape} ${color}`} />}
      {rings >= 2 && <span className={`absolute inset-[3px] border-[1.5px] ${shape} ${color}`} />}
      <span className="relative">{value}</span>
    </span>
  );
}
