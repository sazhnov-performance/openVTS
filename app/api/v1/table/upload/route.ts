import { NextRequest, NextResponse } from "next/server";
import { createTable, addCompleteRow, ValidationError } from "@/lib/redis-service";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const tableName = request.nextUrl.searchParams.get("tableName");
    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }
    const columns = parseCsvLine(lines[0]);
    await createTable(tableName, columns);
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      await addCompleteRow(tableName, values);
    }
    return NextResponse.json({
      message: `Table ${tableName} created and populated from CSV.`,
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json(
        { error: e.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: `Error processing CSV file: ${e instanceof Error ? e.message : e}`,
      },
      { status: 500 }
    );
  }
}
