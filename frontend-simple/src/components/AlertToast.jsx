import React from "react";

export default function AlertToast({ open = false, onClose = () => {}, count = 0, threshold = 30 }) {
  if (!open) return null;
  return (
    <div className="alert-toast" role="status" aria-live="polite">
      <div className="alert-content">
        <strong>Alert:</strong> {count} events in the window (threshold {threshold})
      </div>
      <button onClick={onClose} className="alert-close">Dismiss</button>
    </div>
  );
}
