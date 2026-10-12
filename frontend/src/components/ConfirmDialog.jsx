export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, busy }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog">
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        <div className="dialog-actions">
          <button className="btn secondary" type="button" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button className="btn danger" type="button" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
