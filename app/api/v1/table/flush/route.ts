import { NextRequest, NextResponse } from "next/server";
import { flushTable } from "@/lib/redis-service";

export async function POST(request: NextRequest) {
  try {
    let tableName = request.nextUrl.searchParams.get("tableName");
    if (!tableName) {
      const formData = await request.formData();
      tableName = formData.get("tableName") as string | null;
    }
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    await flushTable(tableName);
    return NextResponse.json({
      message: "Table flushed successfully.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
