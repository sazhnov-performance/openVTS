import Link from "next/link";

function ApiSection({
  method,
  path,
  desc,
  request,
  response,
}: {
  method: string;
  path: string;
  desc: string;
  request: string;
  response: string;
}) {
  const methodColor =
    method === "GET"
      ? "text-[var(--success)]"
      : method === "POST"
        ? "text-[var(--primary)]"
        : "text-[var(--danger)]";

  return (
    <details className="card group">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-[var(--text)] [&::-webkit-details-marker]:hidden">
        <span className={methodColor}>{method}</span>
        <span className="ml-2 font-mono text-sm">{path}</span>
      </summary>
      <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
        <p className="text-sm text-[var(--text-muted)]">{desc}</p>
        <div className="mt-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-xs">
          <span className="font-semibold text-[var(--text)]">Request</span>
          <pre className="mt-1 whitespace-pre-wrap text-[var(--text-muted)]">{request}</pre>
        </div>
        <div className="mt-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--success-bg)] p-3 font-mono text-xs">
          <span className="font-semibold text-[var(--success)]">Response</span>
          <pre className="mt-1 whitespace-pre-wrap text-[var(--text)]">{response}</pre>
        </div>
      </div>
    </details>
  );
}

const SECTIONS = [
  { method: "POST", path: "/api/v1/table/create", desc: "Creates a new Redis table with columns.", request: "POST /api/v1/table/create?tableName=my_table\n\nBody (JSON):\n[\"id\", \"name\", \"email\"]", response: "{\"message\": \"Table my_table created.\"}" },
  { method: "DELETE", path: "/api/v1/table/delete", desc: "Deletes the specified table.", request: "DELETE /api/v1/table/delete?tableName=my_table", response: "{\"message\": \"Table my_table deleted.\"}" },
  { method: "POST", path: "/api/v1/table/row/add", desc: "Adds a row to the table.", request: "POST /api/v1/table/row/add?tableName=my_table\n\nBody (JSON):\n[1, \"John Doe\", \"john@example.com\"]", response: "{\"message\": \"Row added to my_table\"}" },
  { method: "GET", path: "/api/v1/table/row/read", desc: "Returns a random row from the table.", request: "GET /api/v1/table/row/read?tableName=my_table", response: "{\"id\":1,\"name\":\"John Doe\",\"email\":\"john@example.com\"}" },
  { method: "GET", path: "/api/v1/table/row/cycle", desc: "Cycles the last row to the front and returns it.", request: "GET /api/v1/table/row/cycle?tableName=my_table", response: "{\"id\":3,\"name\":\"Alice\",\"email\":\"alice@example.com\"}" },
  { method: "GET", path: "/api/v1/table/row/paginate", desc: "Fetches paginated rows (page 1-based).", request: "GET /api/v1/table/row/paginate?tableName=my_table&page=1&size=50", response: "[\n  {\"id\":1,\"name\":\"John Doe\",\"email\":\"john@example.com\"},\n  {\"id\":2,\"name\":\"Jane Smith\",\"email\":\"jane@example.com\"}\n]" },
  { method: "GET", path: "/api/v1/table/columns/get", desc: "Returns column names for the table.", request: "GET /api/v1/table/columns/get?tableName=my_table", response: "{\"data\": [\"id\", \"name\", \"email\"]}" },
  { method: "GET", path: "/api/v1/table/row/extract", desc: "Pops and returns the last row.", request: "GET /api/v1/table/row/extract?tableName=my_table", response: "{\"id\":1,\"name\":\"John Doe\",\"email\":\"john@example.com\"}" },
  { method: "GET", path: "/api/v1/table/summary", desc: "Summary of all tables with complete and incomplete row diagnostics.", request: "GET /api/v1/table/summary", response: "{\n  \"tables\": [\n    {\n      \"table\": \"users\",\n      \"rowCount\": 10,\n      \"columns\": [\"id\", \"name\", \"email\"],\n      \"incompleteRowCount\": 1,\n      \"incompleteRows\": [\n        {\n          \"uploadSetId\": \"f2f3...\",\n          \"rowIndex\": 3,\n          \"missingColumns\": [\"email\"],\n          \"row\": {\"id\": \"42\", \"name\": \"Jane\", \"email\": null}\n        }\n      ]\n    }\n  ]\n}" },
  { method: "POST", path: "/api/v1/table/upload", desc: "Create and populate table from CSV. First line = headers.", request: "POST /api/v1/table/upload?tableName=my_table\nForm-Data: file (CSV)", response: "{\"message\": \"Table my_table created and populated from CSV.\"}" },
  { method: "POST", path: "/api/v1/table/append", desc: "Append rows from CSV. First line skipped as header.", request: "POST /api/v1/table/append?tableName=my_table\nForm-Data: tableName, file", response: "{\"message\": \"Table appended successfully.\"}" },
  { method: "POST", path: "/api/v1/table/flush", desc: "Removes all rows (keeps column definitions).", request: "POST /api/v1/table/flush?tableName=my_table", response: "{\"message\": \"Table flushed successfully.\"}" },
];

export function ApiGuideContent() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-[var(--text)]">
        API Guide
      </h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        All endpoints are under <code className="rounded bg-[var(--bg)] px-1 py-0.5 font-mono text-[var(--primary)]">/api/v1</code>. No external scripts or styles are used in this app.
      </p>
      <div className="mt-6 space-y-2">
        {SECTIONS.map((s) => (
          <ApiSection
            key={s.path}
            method={s.method}
            path={s.path}
            desc={s.desc}
            request={s.request}
            response={s.response}
          />
        ))}
      </div>
      <p className="mt-8">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          ← Back to tables
        </Link>
      </p>
    </div>
  );
}
