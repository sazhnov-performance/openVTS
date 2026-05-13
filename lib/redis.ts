import Redis, { RedisOptions } from "ioredis";

const TABLE_LIST_KEY = "redis_tables";

function getClient(): Redis {
  // Support both REDIS_* and SPRING_DATA_REDIS_* (Spring Boot) env vars for K8s drop-in compatibility
  const host =
    process.env.REDIS_HOST ??
    process.env.SPRING_DATA_REDIS_HOST ??
    "127.0.0.1";
  const port = parseInt(
    process.env.REDIS_PORT ??
      process.env.SPRING_DATA_REDIS_PORT ??
      "6379",
    10
  );
  const password =
    process.env.REDIS_PASSWORD ?? process.env.SPRING_DATA_REDIS_PASSWORD;
  const db = parseInt(
    process.env.REDIS_DATABASE ??
      process.env.SPRING_DATA_REDIS_DATABASE ??
      "0",
    10
  );

  const opts: RedisOptions = {
    host,
    port,
    db,
    maxRetriesPerRequest: 3,
  };
  if (password) opts.password = password;

  return new Redis(opts);
}

// Lazy singleton for server-side use (API routes)
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) _redis = getClient();
  return _redis;
}

export function rowsKey(tableName: string): string {
  return `table:${tableName}:rows`;
}

export function metadataKey(tableName: string): string {
  return `table:${tableName}:metadata`;
}

export function pendingSetsKey(tableName: string): string {
  return `table:${tableName}:pending_sets`;
}

export function pendingMetaKey(tableName: string, uploadSetId: string): string {
  return `table:${tableName}:pending:${uploadSetId}:meta`;
}

export function pendingRowsKey(tableName: string, uploadSetId: string): string {
  return `table:${tableName}:pending:${uploadSetId}:rows`;
}

export { TABLE_LIST_KEY };

export function serialize(obj: unknown): string {
  return JSON.stringify(obj);
}

export function deserialize<T = unknown>(json: string | null): T | null {
  if (json == null) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
