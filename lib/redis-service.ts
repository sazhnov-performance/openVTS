import {
  getRedis,
  rowsKey,
  metadataKey,
  TABLE_LIST_KEY,
  serialize,
  deserialize,
} from "./redis";

export type Row = (string | number | boolean | null)[];

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
}

export async function addRow(
  tableName: string,
  values: (string | number | boolean | null)[]
): Promise<void> {
  const redis = getRedis();
  await redis.rpush(rowsKey(tableName), serialize(values));
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
