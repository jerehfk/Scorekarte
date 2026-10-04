import PlatzbelegungCard from '../components/PlatzbelegungCard';
import TopMenu, { type AppTab } from '../components/TopMenu';
import { COURSE } from '../data/course';

interface Props {
  active: AppTab;
  onNavigate: (tab: AppTab) => void;
}

export default function PlatzbelegungScreen({ active, onNavigate }: Props) {
  return (
    <div className="safe-top-lg mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pb-8">
      <TopMenu active={active} onNavigate={onNavigate} />

      <header className="pr-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-turf-400">
          Digitale Scorekarte
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight">{COURSE.club}</h1>
      </header>

      <PlatzbelegungCard />
    </div>
  );
}
