import Link from "next/link";
import { TablesList } from "@/components/TablesList";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center border-b border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-[var(--text)]">
          openVTS
        </Link>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col bg-[var(--bg-sidebar)] text-[var(--text-inverse)]">
          <nav className="flex flex-1 flex-col gap-1 overflow-hidden p-3">
            <span className="mb-2 px-2 text-xs font-medium uppercase tracking-wider opacity-70">
              Tables
            </span>
            <TablesList />
            <div className="mt-4 border-t border-white/10 pt-3">
              <Link
                href="/apiguide"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium opacity-90 transition-colors hover:bg-[var(--bg-sidebar-hover)] hover:opacity-100"
              >
                API Guide
              </Link>
            </div>
          </nav>
        </aside>
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <div className="card min-h-[20rem] p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
