"use client";

import { useState } from "react";

export function DeleteModal({
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
      const res = await fetch(
        `/api/v1/table/delete?tableName=${encodeURIComponent(tableName)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Delete failed.");
        return;
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
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
          Delete table
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Permanently delete <strong className="text-[var(--text)]">{tableName}</strong> and all its data? This cannot be undone.
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
            className="rounded-[var(--radius)] bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--danger-hover)] disabled:opacity-50"
          >
            {submitting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
