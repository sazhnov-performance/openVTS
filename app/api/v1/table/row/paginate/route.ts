import { NextRequest, NextResponse } from "next/server";
import {
  getColumns,
  getRowsWithPagination,
} from "@/lib/redis-service";

export async function GET(request: NextRequest) {
  try {
    const tableName = request.nextUrl.searchParams.get("tableName");
    const pageParam = request.nextUrl.searchParams.get("page");
    const sizeParam = request.nextUrl.searchParams.get("size");
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const size = sizeParam ? parseInt(sizeParam, 10) : 50;
    const columns = await getColumns(tableName);
    const rows = await getRowsWithPagination(tableName, page, size);
    if (columns == null || rows.length === 0) {
      return NextResponse.json([]);
    }
    const responseList: Record<string, unknown>[] = [];
    for (const row of rows) {
      const rowMap: Record<string, unknown> = {};
      for (let i = 0; i < columns.length && i < row.length; i++) {
        rowMap[columns[i]] = row[i];
      }
      responseList.push(rowMap);
    }
    return NextResponse.json(responseList);
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
