import { NextRequest, NextResponse } from "next/server";
import {
  addCompleteRow,
  getColumns,
  mergePartialRows,
  ValidationError,
} from "@/lib/redis-service";

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
    const mode = request.nextUrl.searchParams.get("mode");
    const uploadSetId = request.nextUrl.searchParams.get("uploadSetId");
    if (!tableName) {
      const formData = await request.formData();
      const name = formData.get("tableName");
      if (!name || typeof name !== "string") {
        return NextResponse.json(
          { error: "tableName is required" },
          { status: 400 }
        );
      }
    }
    const formData = await request.formData();
    const tableNameFromForm = formData.get("tableName") as string | null;
    const finalTableName = tableName ?? tableNameFromForm;
    if (!finalTableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 }
      );
    }
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
    const existingColumns = await getColumns(finalTableName);
    if (!existingColumns) {
      return NextResponse.json(
        { error: "Table does not exist. Use upload to create it." },
        { status: 400 }
      );
    }

    if (mode === "partial") {
      const subsetColumns = parseCsvLine(lines[0]);
      if (subsetColumns.length === 0 || subsetColumns.every((v) => v.length === 0)) {
        return NextResponse.json(
          { error: "CSV header is empty." },
          { status: 400 }
        );
      }
      const rows: (string | number | boolean | null)[][] = [];
      for (let i = 1; i < lines.length; i++) {
        rows.push(parseCsvLine(lines[i]));
      }
      const result = await mergePartialRows(
        finalTableName,
        subsetColumns,
        rows,
        uploadSetId ?? undefined
      );
      return NextResponse.json({
        message: "Partial CSV merged successfully.",
        ...result,
      });
    }

    // Default append mode: skip header and append raw rows.
    const startIndex = 1; // skip first line (header) like Java
    for (let i = startIndex; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      await addCompleteRow(finalTableName, values);
    }
    return NextResponse.json({
      message: "Table appended successfully.",
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
