import { NextResponse } from "next/server";
import {
  getTablesWithRowCounts,
  getColumns,
  getIncompleteRowDiagnostics,
} from "@/lib/redis-service";

export async function GET() {
  try {
    const rowCounts = await getTablesWithRowCounts();
    const tableSummaries: {
      table: string;
      rowCount: number;
      columns: string[] | null;
      incompleteRowCount: number;
      incompleteRows: {
        uploadSetId: string;
        rowIndex: number;
        missingColumns: string[];
        row: Record<string, string | number | boolean | null>;
      }[];
    }[] = [];
    for (const [tableName, rowCount] of Object.entries(rowCounts)) {
      const columns = await getColumns(tableName);
      const incompleteRows = await getIncompleteRowDiagnostics(tableName);
      tableSummaries.push({
        table: tableName,
        rowCount,
        columns: columns ?? null,
        incompleteRowCount: incompleteRows.length,
        incompleteRows,
      });
    }
    return NextResponse.json({ tables: tableSummaries });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
