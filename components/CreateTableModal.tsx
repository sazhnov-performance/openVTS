"use client";

import { useState } from "react";

export function CreateTableModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tableName, setTableName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim() || !file) {
      setStatus({ type: "err", msg: "Table name and file are required." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const form = new FormData();
      form.set("tableName", tableName.trim());
      form.set("file", file);
      const res = await fetch(
        `/api/v1/table/upload?tableName=${encodeURIComponent(tableName.trim())}`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "err", msg: data.error ?? "Upload failed." });
        return;
      }
      setStatus({ type: "ok", msg: data.message ?? "Table created." });
      onSuccess();
    } catch (e) {
      setStatus({
        type: "err",
        msg: e instanceof Error ? e.message : "Upload failed.",
      });
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
        className="modal-panel w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Create table from CSV
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          First line will be used as column names.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--text)]">
              Table name
            </span>
            <input
              type="text"
              placeholder="e.g. my_table"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="input-base"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--text)]">
              CSV file
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="input-base file:mr-2 file:rounded file:border-0 file:bg-[var(--primary-light)] file:px-3 file:py-1 file:text-sm file:font-medium file:text-[var(--primary)]"
              required
            />
          </label>
          {status && (
            <div
              className={
                status.type === "ok"
                  ? "rounded-[var(--radius)] bg-[var(--success-bg)] p-3 text-sm text-[var(--success)]"
                  : "rounded-[var(--radius)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]"
              }
            >
              {status.msg}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? "Uploading…" : "Create table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
