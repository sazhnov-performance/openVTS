import Redis from "ioredis";

const TABLE_LIST_KEY = "redis_tables";

function getClient(): Redis {
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = parseInt(process.env.REDIS_PORT ?? "6379", 10);
  const username = process.env.REDIS_USERNAME;
  const password = process.env.REDIS_PASSWORD;
  const db = parseInt(process.env.REDIS_DATABASE ?? "0", 10);

  const opts: Redis.RedisOptions = {
    host,
    port,
    db,
    maxRetriesPerRequest: 3,
  };
  if (username) opts.username = username;
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
