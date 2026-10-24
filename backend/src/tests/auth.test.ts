/**
 * tests/auth.test.ts
 *
 * Integration tests for the authentication endpoints.
 *
 * We use `supertest` to make real HTTP requests against the Express
 * app WITHOUT starting a server — supertest handles that internally.
 *
 * We mock the `pg` Pool so tests don't need a real PostgreSQL DB.
 * This is called "unit-style integration testing": routes, middleware,
 * and controllers are all real code; only the DB is mocked.
 */

import request from "supertest";
import app from "../app";
import pool from "../db/pool";

// Mock the pg pool so no real DB connection is needed
jest.mock("../db/pool", () => ({
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
}));

const mockPool = pool as jest.Mocked<typeof pool>;

// ── send-otp tests ────────────────────────────────────────────────────────────

describe("POST /auth/send-otp", () => {
  it("should return 200 and success message for valid phone", async () => {
    // Mock the INSERT into otps
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/auth/send-otp")
      .send({ phone: "9876543210" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      "OTP sent successfully (check server logs)"
    );
  });

  it("should return 422 for invalid phone (less than 10 digits)", async () => {
    const res = await request(app)
      .post("/auth/send-otp")
      .send({ phone: "12345" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.phone).toBeDefined();
  });

  it("should return 422 for non-numeric phone", async () => {
    const res = await request(app)
      .post("/auth/send-otp")
      .send({ phone: "abcdefghij" });

    expect(res.status).toBe(422);
    expect(res.body.errors.phone).toBeDefined();
  });

  it("should return 422 for missing phone", async () => {
    const res = await request(app).post("/auth/send-otp").send({});
    expect(res.status).toBe(422);
  });
});

// ── verify-otp tests ─────────────────────────────────────────────────────────

describe("POST /auth/verify-otp", () => {
  it("should return 401 when OTP is invalid/not found", async () => {
    // Mock: no matching OTP found
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ phone: "9876543210", code: "000000" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 200 with token when OTP is valid", async () => {
    // Mock sequence:
    // 1. SELECT otps → found one valid OTP
    // 2. UPDATE otps SET is_used = TRUE
    // 3. INSERT/UPSERT user → returns user id
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })   // SELECT otp
      .mockResolvedValueOnce({ rows: [] })              // UPDATE otp
      .mockResolvedValueOnce({ rows: [{ id: 42 }] });  // UPSERT user

    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ phone: "9876543210", code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.userId).toBe(42);
  });

  it("should return 422 for OTP shorter than 6 digits", async () => {
    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ phone: "9876543210", code: "123" });

    expect(res.status).toBe(422);
    expect(res.body.errors.code).toBeDefined();
  });
});
