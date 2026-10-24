/**
 * db/migrate.ts
 *
 * A simple migration script that creates all required tables
 * if they don't already exist.
 *
 * Run with:  npm run migrate
 *
 * Tables:
 * ─────────────────────────────────────────────────────────────
 * users       – one row per phone number that has signed up
 * otps        – temporary OTP codes (expired ones can be pruned)
 * loans       – each loan entry (lender = logged-in user)
 * ─────────────────────────────────────────────────────────────
 */

import pool from "./pool";

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── users ──────────────────────────────────────────────────
    // Stores every registered phone number.
    // created_at is auto-set by the database default.
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        phone      VARCHAR(15) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── otps ───────────────────────────────────────────────────
    // Holds the most recent OTP for each phone number.
    // expires_at lets us reject old codes server-side.
    // is_used prevents replay attacks (same OTP used twice).
    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id         SERIAL PRIMARY KEY,
        phone      VARCHAR(15) NOT NULL,
        code       VARCHAR(6)  NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        is_used    BOOLEAN     DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── loans ──────────────────────────────────────────────────
    // Core table. Each row = one loan from a user to a friend.
    //
    // user_id      → FK to users (the person who lent money)
    // friend_name  → free-text name of the borrower
    // amount       → how much was lent (NUMERIC for exact money math)
    // due_date     → when repayment is expected
    // is_repaid    → toggled to TRUE when friend pays back
    // repaid_at    → timestamp of repayment (NULL until repaid)
    // receipt_url  → optional path to uploaded receipt photo
    await client.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_name  VARCHAR(100) NOT NULL,
        amount       NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
        due_date     DATE        NOT NULL,
        is_repaid    BOOLEAN     DEFAULT FALSE,
        repaid_at    TIMESTAMPTZ,
        receipt_url  TEXT,
        note         TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Index on user_id makes "get all loans for this user" fast.
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
    `);

    await client.query("COMMIT");
    console.log("✅  Migration complete – all tables are ready.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
