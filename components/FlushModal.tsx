"use client";

import { useState } from "react";

export function FlushModal({
  tableName,
  onClose,
  onSuccess,
}: {
  tableName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("tableName", tableName);
      const res = await fetch(
        `/api/v1/table/flush?tableName=${encodeURIComponent(tableName)}`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Flush failed.");
        return;
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Flush failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-panel w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Flush table
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Remove all rows from <strong className="text-[var(--text)]">{tableName}</strong>? Column definitions will be kept.
        </p>
        {error && (
          <div className="mt-3 rounded-[var(--radius)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-[var(--radius)] bg-[var(--warning)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--warning-hover)] disabled:opacity-50"
          >
            {submitting ? "Flushing…" : "Flush"}
          </button>
        </div>
      </div>
    </div>
  );
}
