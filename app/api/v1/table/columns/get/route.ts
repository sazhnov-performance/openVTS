import { NextRequest, NextResponse } from "next/server";
import { getColumns } from "@/lib/redis-service";

export async function GET(request: NextRequest) {
  try {
    const tableName = request.nextUrl.searchParams.get("tableName");
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    const row = await getColumns(tableName);
    if (row == null) {
      return NextResponse.json({ message: "No data found." });
    }
    return NextResponse.json({ data: row });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
