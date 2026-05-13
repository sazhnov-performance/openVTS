"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CreateTableModal } from "./CreateTableModal";

type TableSummary = { table: string; rowCount: number; columns: string[] | null };

export function TablesList() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentTable =
    segments[0] === "table" && segments[1]
      ? decodeURIComponent(segments[1])
      : null;

  const [tables, setTables] = useState<TableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/table/summary");
      const data = await res.json();
      if (data.tables) setTables(data.tables);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onTablesChanged = () => refresh();
    window.addEventListener("openvts-tables-changed", onTablesChanged);
    return () =>
      window.removeEventListener("openvts-tables-changed", onTablesChanged);
  }, [refresh]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="btn-primary mb-3 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
      >
        <span aria-hidden>+</span>
        Create table
      </button>
      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {loading ? (
          <li className="px-3 py-4 text-center text-sm opacity-70">
            Loading…
          </li>
        ) : tables.length === 0 ? (
          <li className="px-3 py-4 text-center text-sm opacity-70">
            No tables yet
          </li>
        ) : (
          tables.map((t) => {
            const isActive = currentTable === t.table;
            return (
              <li key={t.table}>
                <Link
                  href={`/table/${encodeURIComponent(t.table)}`}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-sidebar-hover)] ${
                    isActive ? "bg-[var(--bg-sidebar-hover)]" : ""
                  }`}
                >
                <span className="min-w-0 truncate">{t.table}</span>
                <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-xs tabular-nums">
                  {t.rowCount}
                </span>
              </Link>
            </li>
            );
          })
        )}
      </ul>
      {showCreate && (
        <CreateTableModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
