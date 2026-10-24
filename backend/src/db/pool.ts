/**
 * db/pool.ts
 *
 * Creates and exports a single PostgreSQL connection pool.
 * We use a pool (not a single client) so that multiple requests
 * can run queries concurrently without waiting for each other.
 *
 * The pool reads the DATABASE_URL from environment variables,
 * which keeps credentials out of source code.
 */

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Create one pool for the entire app lifecycle.
// pg will automatically manage connections (default max = 10).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Listen for unexpected errors on idle clients so they don't
// crash the server silently.
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

export default pool;
