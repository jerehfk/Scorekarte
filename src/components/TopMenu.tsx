import { useState, type ReactNode } from 'react';

export type AppTab = 'scorecard' | 'status' | 'belegung';

interface Props {
  active: AppTab;
  onNavigate: (tab: AppTab) => void;
  /** Platzstatus und Platzbelegung gibt es nur für Clubs, deren Seite wir lesen. */
  platzinfo?: boolean;
}

interface Item {
  tab: AppTab;
  label: string;
  icon: ReactNode;
}

const ICON_COMMON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ITEMS: Item[] = [
  {
    tab: 'status',
    label: 'Platzstatus',
    icon: (
      <svg {...ICON_COMMON}>
        <path d="M7 20V5" />
        <path d="M7 5l10 3.5L7 12" fill="currentColor" fillOpacity="0.25" />
      </svg>
    ),
  },
  {
    tab: 'belegung',
    label: 'Platzbelegung',
    icon: (
      <svg {...ICON_COMMON}>
        <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
        <path d="M4 10h16" />
        <path d="M8 3.5v3" />
        <path d="M16 3.5v3" />
      </svg>
    ),
  },
  {
    tab: 'scorecard',
    label: 'Scorekarte',
    icon: (
      <svg {...ICON_COMMON}>
        <rect x="5" y="3.5" width="14" height="17" rx="2.2" />
        <path d="M8.5 8.5h7" />
        <path d="M8.5 12h7" />
        <path d="M8.5 15.5h4.5" />
      </svg>
    ),
  },
];

/**
 * Burger-Icon oben rechts, öffnet eine kompakte, abgerundete Dropdown-Karte
 * direkt darunter – Icon + Label je Zeile, ohne Untertitel oder Farbflächen,
 * in der normalen Schrift der App.
 */
export default function TopMenu({ active, onNavigate, platzinfo = true }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 z-40" style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}>
      <button
        type="button"
        aria-label="Menü öffnen"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-deep-900/90 text-sand-100 backdrop-blur"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M4 6.5h16" strokeLinecap="round" />
          <path d="M4 12h16" strokeLinecap="round" />
          <path d="M4 17.5h16" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-edge bg-deep-900/95 shadow-2xl backdrop-blur-xl">
            <div className="divide-y divide-edge/60">
              {ITEMS.filter((item) => platzinfo || item.tab === 'scorecard').map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    onNavigate(item.tab);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span
                    className={`h-5 w-5 shrink-0 ${
                      active === item.tab ? 'text-turf-400' : 'text-sand-300/60'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`text-[15px] font-medium ${
                      active === item.tab ? 'text-turf-300' : 'text-sand-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
