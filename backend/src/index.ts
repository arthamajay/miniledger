/**
 * index.ts
 *
 * Application entry point.
 *
 * Responsibilities:
 *  1. Load environment variables from .env
 *  2. Import the configured Express app
 *  3. Start listening on PORT
 *
 * We keep this file minimal so that tests can import `app`
 * from app.ts without triggering a real server.listen() call.
 */

import dotenv from "dotenv";
dotenv.config(); // must run before importing anything that reads process.env

import app from "./app";

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`\n🚀  MiniLedger backend running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
