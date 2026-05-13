# openVTS (Next.js)

Fullstack Next.js TypeScript app that replicates the openVTS Java Spring Boot API and UI for managing Redis-stored tables.

## Environment variables

Same semantics as the Spring Boot app (`application.properties`):

| Variable         | Default   | Description        |
|------------------|-----------|--------------------|
| `REDIS_HOST`     | `127.0.0.1` | Redis host         |
| `REDIS_PORT`     | `6379`    | Redis port         |
| `REDIS_USERNAME` | (none)    | Optional username  |
| `REDIS_PASSWORD` | (none)    | Optional password  |
| `REDIS_DATABASE`| `0`       | Redis DB index     |

Create a `.env.local` from `.env.example` and set these if needed.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The UI lists tables from Redis, lets you create tables (upload CSV), view table data with infinite scroll, and flush/delete/append via actions.

## API

All endpoints live under `/api/v1/` and match the Java `RedisController`:

- `POST /api/v1/table/create` – create table (query: `tableName`, body: JSON array of column names)
- `DELETE /api/v1/table/delete` – delete table (query: `tableName`)
- `POST /api/v1/table/row/add` – add row (query: `tableName`, body: JSON array of values)
- `GET /api/v1/table/row/read` – random row (query: `tableName`)
- `GET /api/v1/table/columns/get` – get columns (query: `tableName`)
- `GET /api/v1/table/row/extract` – pop last row (query: `tableName`)
- `GET /api/v1/table/summary` – all tables with row counts and columns
- `GET /api/v1/table/row/paginate` – paginated rows (query: `tableName`, `page`, `size`)
- `POST /api/v1/table/upload` – create table from CSV (query: `tableName`, form: `file`)
- `GET /api/v1/table/row/cycle` – cycle last row to front (query: `tableName`)
- `POST /api/v1/table/flush` – remove all rows (query or form: `tableName`)
- `POST /api/v1/table/append` – append rows from CSV (query or form: `tableName`, form: `file`)

The in-app **API Guide** at `/apiguide` documents each endpoint.

## Redis key layout (compatible with Java app)

- `redis_tables` – Set of table names
- `table:{tableName}:metadata` – Hash with `columns` (JSON array of column names)
- `table:{tableName}:rows` – List of JSON-serialized row arrays

You can run this Next.js app against the same Redis instance as the Java app; data is compatible.
