export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-light)] text-2xl font-semibold text-[var(--primary)]"
        aria-hidden
      >
        ◫
      </div>
      <h2 className="text-lg font-medium text-[var(--text)]">
        Select a table
      </h2>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
        Choose a table from the sidebar to view and manage its data, or create a new table from a CSV file.
      </p>
    </div>
  );
}
