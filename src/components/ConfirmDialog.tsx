import { useEffect } from 'react';

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Stellt die harmlose Antwort nach vorn und färbt die andere rot. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const PRIMARY =
  'rounded-2xl bg-turf-500 py-3.5 text-base font-bold text-deep-950 ' +
  'transition active:scale-[0.99]';

const QUIET =
  'rounded-2xl border border-edge py-3.5 text-base font-semibold ' +
  'text-sand-300/80 transition active:scale-[0.99]';

const QUIET_DANGER =
  'rounded-2xl border border-flag-500/40 py-3.5 text-base font-semibold ' +
  'text-flag-400 transition active:scale-[0.99]';

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const confirmBtn = (
    <button
      type="button"
      onClick={onConfirm}
      className={danger ? QUIET_DANGER : PRIMARY}
    >
      {confirmLabel}
    </button>
  );

  const cancelBtn = (
    <button type="button" onClick={onCancel} className={danger ? PRIMARY : QUIET}>
      {cancelLabel}
    </button>
  );

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="safe-bottom fixed inset-0 z-50 flex items-end justify-center bg-deep-950/85 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-edge bg-deep-900 p-6"
      >
        <h2 className="font-display text-2xl leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-sand-300/65">{body}</p>
        <div className="mt-6 flex flex-col gap-2">
          {/* Bei einer nicht umkehrbaren Aktion liegt die harmlose Antwort oben. */}
          {danger ? cancelBtn : confirmBtn}
          {danger ? confirmBtn : cancelBtn}
        </div>
      </div>
    </div>
  );
}
