import { usePlatzstatus } from '../hooks/usePlatzstatus';
import { SOURCE_URL } from '../lib/platzstatus';
import FacilityIcon from './FacilityIcon';

function isClosed(value: string): boolean {
  const v = value.toLowerCase();
  return v.includes('gesperrt') || v.includes('geschlossen') || v === 'nein';
}

export default function PlatzstatusCard() {
  const { data, loading, error, refresh } = usePlatzstatus();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl leading-tight">Platzstatus</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="text-[11px] font-semibold text-sand-300/40 disabled:opacity-40"
        >
          {loading ? 'Aktualisiere …' : 'Aktualisieren'}
        </button>
      </div>

      {!data && loading && (
        <p className="text-sm text-sand-300/50">Wird geladen …</p>
      )}

      {!data && !loading && (
        <div>
          <p className="text-sm text-sand-300/60">Platzstatus konnte nicht geladen werden.</p>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-turf-400 underline underline-offset-2"
          >
            Auf der Club-Website ansehen
          </a>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {data.items.map((item) => {
              const closed = isClosed(item.value);
              const wide = item.label === 'Kurzspielbereich';
              return (
                <div
                  key={item.label}
                  className={`flex flex-col items-center gap-3 rounded-2xl p-5 text-center ${
                    closed ? 'bg-flag-500' : 'bg-turf-500'
                  } ${wide ? 'col-span-2' : ''}`}
                >
                  <FacilityIcon
                    label={item.label}
                    className="h-10 w-10 text-deep-950"
                  />
                  <p className="font-display text-lg leading-tight text-deep-950">{item.label}</p>
                  <span className="w-full rounded-xl bg-white/25 py-2 text-base font-semibold text-deep-950">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-sand-300/35">
            Stand: {new Date(data.fetchedAt).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            Uhr
            {error && ' · Aktualisierung fehlgeschlagen, letzter bekannter Stand'}
          </p>
        </>
      )}
    </section>
  );
}
