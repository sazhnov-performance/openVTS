import { NextRequest, NextResponse } from "next/server";
import { addCompleteRow, ValidationError } from "@/lib/redis-service";

export async function POST(request: NextRequest) {
  try {
    const tableName = request.nextUrl.searchParams.get("tableName");
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    const values = (await request.json()) as (string | number | boolean | null)[];
    if (!Array.isArray(values)) {
      return NextResponse.json(
        { error: "Body must be an array of values" },
        { status: 400 }
      );
    }
    await addCompleteRow(tableName, values);
    return NextResponse.json({
      message: `Row added to ${tableName}`,
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json(
        { error: e.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}
