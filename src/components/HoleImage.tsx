import { useState } from 'react';

interface Props {
  holeNr: number;
}

/** Die Bahnengrafik aus dem Birdiebook. Tippen öffnet sie formatfüllend. */
export default function HoleImage({ holeNr }: Props) {
  const [full, setFull] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setFull(true)}
        className="mx-auto block w-fit overflow-hidden rounded-2xl border border-edge bg-white"
      >
        <img
          src={`/holes/${holeNr}.webp`}
          alt={`Bahn ${holeNr}`}
          className="max-h-[34vh] w-auto object-contain"
          loading="eager"
        />
      </button>

      {full && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-deep-950/95 backdrop-blur-sm"
          onClick={() => setFull(false)}
        >
          <div className="safe-top flex items-center justify-between px-5 py-4">
            <span className="font-display text-xl">Bahn {holeNr}</span>
            <button
              type="button"
              className="rounded-full border border-edge px-4 py-1.5 text-sm"
              onClick={() => setFull(false)}
            >
              Schließen
            </button>
          </div>
          <div className="no-scrollbar flex-1 overflow-auto px-3 pb-6">
            <img
              src={`/holes/${holeNr}.webp`}
              alt={`Bahn ${holeNr}`}
              className="mx-auto w-full max-w-md rounded-2xl bg-sand-100"
            />
          </div>
        </div>
      )}
    </>
  );
}
