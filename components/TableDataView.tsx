"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FlushModal } from "./FlushModal";
import { DeleteModal } from "./DeleteModal";
import { AppendModal } from "./AppendModal";

type RowRecord = Record<string, unknown>;
type IncompleteRowDiagnostic = {
  uploadSetId: string;
  rowIndex: number;
  missingColumns: string[];
  row: Record<string, string | number | boolean | null>;
};

export function TableDataView({ tableName }: { tableName: string }) {
  const router = useRouter();
  const [columns, setColumns] = useState<string[] | null>(null);
  const [rows, setRows] = useState<RowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [incompleteRows, setIncompleteRows] = useState<IncompleteRowDiagnostic[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [flushOpen, setFlushOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [appendOpen, setAppendOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadColumns = useCallback(async () => {
    const res = await fetch(
      `/api/v1/table/columns/get?tableName=${encodeURIComponent(tableName)}`
    );
    const data = await res.json();
    if (data.data) setColumns(data.data);
    else setColumns(null);
  }, [tableName]);

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      const res = await fetch(
        `/api/v1/table/row/paginate?tableName=${encodeURIComponent(tableName)}&page=${page}&size=50`
      );
      const list = (await res.json()) as RowRecord[];
      if (append) setRows((prev) => [...prev, ...list]);
      else setRows(list);
      setHasMore(list.length === 50);
      setNextPage(page + 1);
    },
    [tableName]
  );

  const loadIncompleteRows = useCallback(async () => {
    const res = await fetch("/api/v1/table/summary");
    const data = await res.json();
    const tableSummary = (data.tables ?? []).find(
      (t: { table: string }) => t.table === tableName
    );
    setIncompleteRows(tableSummary?.incompleteRows ?? []);
  }, [tableName]);

  useEffect(() => {
    setLoading(true);
    setRows([]);
    setNextPage(1);
    setHasMore(true);
    Promise.all([loadColumns(), loadPage(1, false), loadIncompleteRows()]).finally(() =>
      setLoading(false)
    );
  }, [tableName, loadColumns, loadPage, loadIncompleteRows]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadPage(nextPage, true).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, nextPage, loadPage]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: scrollRef.current, rootMargin: "100px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const refresh = useCallback(() => {
    loadColumns();
    loadIncompleteRows();
    setRows([]);
    setNextPage(1);
    setHasMore(true);
    loadPage(1, false);
  }, [loadColumns, loadPage, loadIncompleteRows]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-[var(--text-muted)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        Loading table…
      </div>
    );
  }
  if (!columns) {
    return (
      <p className="py-8 text-[var(--text-muted)]">
        No data found for table: <strong className="text-[var(--text)]">{tableName}</strong>
      </p>
    );
  }

  return (
    <div ref={scrollRef} className="relative -m-2 h-full overflow-auto p-2">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[var(--text)]">{tableName}</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
          >
            Actions
            <span className="text-[var(--text-muted)]" aria-hidden>▾</span>
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <ul className="absolute right-0 top-full z-20 mt-1.5 min-w-[11rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-lg)]">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setFlushOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--bg)]"
                  >
                    Flush rows
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setAppendOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--bg)]"
                  >
                    Append CSV
                  </button>
                </li>
                <li className="border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)]"
                  >
                    Delete table
                  </button>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--bg)]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text)]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg)]"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2.5 text-[var(--text)]"
                  >
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="mt-4 rounded-[var(--radius)] border border-[var(--border)]">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--text)]">
          Incomplete rows ({incompleteRows.length})
        </summary>
        <div className="border-t border-[var(--border)] p-3">
          {incompleteRows.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No incomplete rows.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-[var(--text)]">
                      Upload set
                    </th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-[var(--text)]">
                      Row index
                    </th>
                    {columns.map((col) => (
                      <th
                        key={`incomplete-header-${col}`}
                        className="border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-[var(--text)]"
                      >
                        {col}
                      </th>
                    ))}
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-[var(--text)]">
                      Missing
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {incompleteRows.map((row) => (
                    <tr
                      key={`${row.uploadSetId}-${row.rowIndex}`}
                      className="border-b border-[var(--border)] last:border-b-0"
                    >
                      <td className="px-3 py-2.5 text-[var(--text)]">{row.uploadSetId}</td>
                      <td className="px-3 py-2.5 text-[var(--text)]">{row.rowIndex}</td>
                      {columns.map((col) => (
                        <td
                          key={`${row.uploadSetId}-${row.rowIndex}-${col}`}
                          className="px-3 py-2.5 text-[var(--text)]"
                        >
                          {String(row.row[col] ?? "")}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-[var(--text-muted)]">
                        {row.missingColumns.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>
      <div ref={loadMoreRef} className="py-4 text-center text-sm text-[var(--text-muted)]">
        {loadingMore && (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            Loading more…
          </span>
        )}
        {!hasMore && rows.length > 0 && "End of data"}
      </div>
      {flushOpen && (
        <FlushModal
          tableName={tableName}
          onClose={() => setFlushOpen(false)}
          onSuccess={() => {
            setFlushOpen(false);
            window.dispatchEvent(new CustomEvent("openvts-tables-changed"));
            refresh();
          }}
        />
      )}
      {deleteOpen && (
        <DeleteModal
          tableName={tableName}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            setDeleteOpen(false);
            window.dispatchEvent(new CustomEvent("openvts-tables-changed"));
            router.push("/");
          }}
        />
      )}
      {appendOpen && (
        <AppendModal
          tableName={tableName}
          onClose={() => setAppendOpen(false)}
          onSuccess={() => {
            setAppendOpen(false);
            window.dispatchEvent(new CustomEvent("openvts-tables-changed"));
            refresh();
          }}
        />
      )}
    </div>
  );
}
