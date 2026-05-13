import {
  getRedis,
  rowsKey,
  metadataKey,
  pendingSetsKey,
  pendingMetaKey,
  pendingRowsKey,
  TABLE_LIST_KEY,
  serialize,
  deserialize,
} from "./redis";

export type Row = (string | number | boolean | null)[];
type PendingRowObject = Record<string, string | number | boolean | null>;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export type PartialMergeResult = {
  uploadSetId: string;
  rowsMerged: number;
  rowsPromotedToComplete: number;
  rowsStillPending: number;
};

export type IncompleteRowDiagnostic = {
  uploadSetId: string;
  rowIndex: number;
  missingColumns: string[];
  row: Record<string, string | number | boolean | null>;
};

export async function createTable(
  tableName: string,
  columns: string[]
): Promise<void> {
  const redis = getRedis();
  const meta = metadataKey(tableName);
  const rows = rowsKey(tableName);
  await redis
    .multi()
    .del(meta)
    .del(rows)
    .hset(meta, "columns", serialize(columns))
    .sadd(TABLE_LIST_KEY, tableName)
    .exec();
  await clearPendingForTable(tableName);
}

export async function deleteTable(tableName: string): Promise<void> {
  const redis = getRedis();
  const meta = metadataKey(tableName);
  const rows = rowsKey(tableName);
  await redis
    .multi()
    .del(meta)
    .del(rows)
    .srem(TABLE_LIST_KEY, tableName)
    .exec();
  await clearPendingForTable(tableName);
}

export async function addRow(
  tableName: string,
  values: (string | number | boolean | null)[]
): Promise<void> {
  const redis = getRedis();
  await redis.rpush(rowsKey(tableName), serialize(values));
}

export async function addCompleteRow(
  tableName: string,
  values: (string | number | boolean | null)[]
): Promise<void> {
  const columns = await getColumns(tableName);
  if (!columns || columns.length === 0) {
    throw new ValidationError("Table does not exist or has no columns.");
  }
  if (values.length !== columns.length) {
    throw new ValidationError(
      `Row column count mismatch for table ${tableName}. Expected ${columns.length}, got ${values.length}.`
    );
  }
  await addRow(tableName, values);
}

export async function getColumns(tableName: string): Promise<string[] | null> {
  const redis = getRedis();
  const json = await redis.hget(metadataKey(tableName), "columns");
  return deserialize<string[]>(json);
}

export async function getRandomRow(tableName: string): Promise<Row | null> {
  const redis = getRedis();
  const key = rowsKey(tableName);
  const size = await redis.llen(key);
  if (!size) return null;
  const index = Math.floor(Math.random() * size);
  const json = await redis.lindex(key, index);
  return deserialize<Row>(json);
}

export async function popRow(tableName: string): Promise<Row | null> {
  const redis = getRedis();
  const json = await redis.rpop(rowsKey(tableName));
  return deserialize<Row>(json);
}

export async function getTablesWithRowCounts(): Promise<Record<string, number>> {
  const redis = getRedis();
  const names = await redis.smembers(TABLE_LIST_KEY);
  const out: Record<string, number> = {};
  for (const tableName of names) {
    const n = await redis.llen(rowsKey(tableName));
    out[tableName] = n;
  }
  return out;
}

export async function getIncompleteRowDiagnostics(
  tableName: string
): Promise<IncompleteRowDiagnostic[]> {
  const redis = getRedis();
  const columns = await getColumns(tableName);
  if (!columns || columns.length === 0) {
    return [];
  }

  const uploadSetIds = await redis.smembers(pendingSetsKey(tableName));
  const diagnostics: IncompleteRowDiagnostic[] = [];
  for (const uploadSetId of uploadSetIds) {
    const pending = await redis.hgetall(pendingRowsKey(tableName, uploadSetId));
    for (const [rowIndexRaw, rowJson] of Object.entries(pending)) {
      const parsedRow = deserialize<PendingRowObject>(rowJson) ?? {};
      const normalized: Record<string, string | number | boolean | null> = {};
      const missingColumns: string[] = [];
      for (const column of columns) {
        const hasValue = Object.prototype.hasOwnProperty.call(parsedRow, column);
        if (!hasValue) {
          missingColumns.push(column);
          normalized[column] = null;
          continue;
        }
        normalized[column] = parsedRow[column] ?? null;
      }
      if (missingColumns.length > 0) {
        diagnostics.push({
          uploadSetId,
          rowIndex: Number(rowIndexRaw),
          missingColumns,
          row: normalized,
        });
      }
    }
  }
  diagnostics.sort((a, b) =>
    a.uploadSetId === b.uploadSetId
      ? a.rowIndex - b.rowIndex
      : a.uploadSetId.localeCompare(b.uploadSetId)
  );
  return diagnostics;
}

export async function getRowsWithPagination(
  tableName: string,
  pageNumber: number,
  pageSize: number
): Promise<Row[]> {
  const redis = getRedis();
  const start = (pageNumber - 1) * pageSize;
  const end = start + pageSize - 1;
  const key = rowsKey(tableName);
  const list = await redis.lrange(key, start, end);
  const rows: Row[] = [];
  for (const json of list) {
    const row = deserialize<Row>(json);
    if (row) rows.push(row);
  }
  return rows;
}

export async function flushTable(tableName: string): Promise<void> {
  const redis = getRedis();
  await redis.del(rowsKey(tableName));
}

/**
 * Pops from right and pushes to left; returns the cycled row.
 */
export async function cycleRow(tableName: string): Promise<Row | null> {
  const redis = getRedis();
  const key = rowsKey(tableName);
  const json = await redis.rpoplpush(key, key);
  return deserialize<Row>(json);
}

export async function mergePartialRows(
  tableName: string,
  subsetColumns: string[],
  rows: (string | number | boolean | null)[][],
  uploadSetId?: string
): Promise<PartialMergeResult> {
  const redis = getRedis();
  const finalUploadSetId = uploadSetId ?? crypto.randomUUID();
  const tableColumns = await getColumns(tableName);
  if (!tableColumns || tableColumns.length === 0) {
    throw new ValidationError("Table does not exist or has no columns.");
  }
  if (subsetColumns.length === 0) {
    throw new ValidationError("CSV header is empty.");
  }

  const tableColumnSet = new Set(tableColumns);
  for (const column of subsetColumns) {
    if (!tableColumnSet.has(column)) {
      throw new ValidationError(`Unknown column '${column}' for table ${tableName}.`);
    }
  }

  const expectedRows = rows.length;
  const metaKey = pendingMetaKey(tableName, finalUploadSetId);
  const pendingKey = pendingRowsKey(tableName, finalUploadSetId);
  const existingExpected = await redis.hget(metaKey, "expectedRowCount");
  if (existingExpected != null && Number(existingExpected) !== expectedRows) {
    throw new ValidationError(
      `Row count mismatch for uploadSetId ${finalUploadSetId}. Expected ${existingExpected}, got ${expectedRows}.`
    );
  }

  await redis
    .multi()
    .sadd(pendingSetsKey(tableName), finalUploadSetId)
    .hset(metaKey, "expectedRowCount", String(expectedRows))
    .hset(metaKey, "updatedAt", String(Date.now()))
    .exec();

  let rowsPromotedToComplete = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const field = String(rowIndex);
    const existingJson = await redis.hget(pendingKey, field);
    const current = (deserialize<PendingRowObject>(existingJson) ?? {}) as PendingRowObject;
    const incoming = rows[rowIndex];
    for (let i = 0; i < subsetColumns.length; i++) {
      current[subsetColumns[i]] = incoming[i] ?? null;
    }

    const isComplete = tableColumns.every((col) => Object.prototype.hasOwnProperty.call(current, col));
    if (isComplete) {
      const fullRow: Row = tableColumns.map((col) => current[col] ?? null);
      await redis.multi().rpush(rowsKey(tableName), serialize(fullRow)).hdel(pendingKey, field).exec();
      rowsPromotedToComplete++;
      continue;
    }

    await redis.hset(pendingKey, field, serialize(current));
  }

  const rowsStillPending = await redis.hlen(pendingKey);
  if (rowsStillPending === 0) {
    await redis
      .multi()
      .del(metaKey)
      .del(pendingKey)
      .srem(pendingSetsKey(tableName), finalUploadSetId)
      .exec();
  }

  return {
    uploadSetId: finalUploadSetId,
    rowsMerged: rows.length,
    rowsPromotedToComplete,
    rowsStillPending,
  };
}

async function clearPendingForTable(tableName: string): Promise<void> {
  const redis = getRedis();
  const setKey = pendingSetsKey(tableName);
  const uploadSetIds = await redis.smembers(setKey);
  const multi = redis.multi();
  for (const uploadSetId of uploadSetIds) {
    multi.del(pendingMetaKey(tableName, uploadSetId));
    multi.del(pendingRowsKey(tableName, uploadSetId));
  }
  multi.del(setKey);
  await multi.exec();
}
