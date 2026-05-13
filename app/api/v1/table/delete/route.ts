import { NextRequest, NextResponse } from "next/server";
import { deleteTable } from "@/lib/redis-service";

export async function DELETE(request: NextRequest) {
  try {
    const tableName = request.nextUrl.searchParams.get("tableName");
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    await deleteTable(tableName);
    return NextResponse.json({
      message: `Table ${tableName} deleted.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
