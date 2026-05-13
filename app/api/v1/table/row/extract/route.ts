import { NextRequest, NextResponse } from "next/server";
import { getColumns, popRow } from "@/lib/redis-service";

export async function GET(request: NextRequest) {
  try {
    const tableName = request.nextUrl.searchParams.get("tableName");
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    const columns = await getColumns(tableName);
    const row = await popRow(tableName);
    if (columns == null || row == null) {
      return NextResponse.json({ message: "No data found." });
    }
    const response: Record<string, unknown> = {};
    for (let i = 0; i < columns.length && i < row.length; i++) {
      response[columns[i]] = row[i];
    }
    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
