import { NextRequest, NextResponse } from "next/server";
import { createTable } from "@/lib/redis-service";

export async function POST(request: NextRequest) {
  try {
    const tableName = request.nextUrl.searchParams.get("tableName");
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    const columns = (await request.json()) as string[];
    if (!Array.isArray(columns)) {
      return NextResponse.json(
        { error: "Body must be an array of column names" },
        { status: 400 }
      );
    }
    await createTable(tableName, columns);
    return NextResponse.json({
      message: `Table ${tableName} created.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
