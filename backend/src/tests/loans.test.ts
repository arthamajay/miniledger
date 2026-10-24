/**
 * tests/loans.test.ts
 *
 * Integration tests for loan endpoints.
 *
 * Strategy:
 * - Generate a real JWT in beforeAll so requests look authenticated.
 * - Mock pool.query to return controlled data — no DB needed.
 */

import request from "supertest";
import app from "../app";
import pool from "../db/pool";
import { signToken } from "../utils/jwt";

jest.mock("../db/pool", () => ({
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
}));

const mockPool = pool as jest.Mocked<typeof pool>;

// A token for user id=1 — used in the Authorization header
const TOKEN = signToken({ userId: 1, phone: "9876543210" });
const AUTH = `Bearer ${TOKEN}`;

// Sample loan row as the DB would return it
const sampleLoan = {
  id: 1,
  user_id: 1,
  friend_name: "Rahul",
  amount: "500.00",
  due_date: "2099-12-31",   // far future → not overdue
  is_repaid: false,
  repaid_at: null,
  receipt_url: null,
  note: "Lunch money",
  created_at: new Date().toISOString(),
  is_overdue: false,
};

// ── POST /loans ───────────────────────────────────────────────────────────────

describe("POST /loans", () => {
  it("should create a loan and return 201", async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [sampleLoan],
    });

    const res = await request(app)
      .post("/loans")
      .set("Authorization", AUTH)
      .send({
        friend_name: "Rahul",
        amount: 500,
        due_date: "2099-12-31",
        note: "Lunch money",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.friend_name).toBe("Rahul");
  });

  it("should return 422 for missing friend_name", async () => {
    const res = await request(app)
      .post("/loans")
      .set("Authorization", AUTH)
      .send({ amount: 500, due_date: "2099-12-31" });

    expect(res.status).toBe(422);
    expect(res.body.errors.friend_name).toBeDefined();
  });

  it("should return 422 for negative amount", async () => {
    const res = await request(app)
      .post("/loans")
      .set("Authorization", AUTH)
      .send({ friend_name: "Rahul", amount: -100, due_date: "2099-12-31" });

    expect(res.status).toBe(422);
    expect(res.body.errors.amount).toBeDefined();
  });

  it("should return 401 without auth token", async () => {
    const res = await request(app)
      .post("/loans")
      .send({ friend_name: "Rahul", amount: 500, due_date: "2099-12-31" });

    expect(res.status).toBe(401);
  });
});

// ── GET /loans ────────────────────────────────────────────────────────────────

describe("GET /loans", () => {
  it("should return list of loans", async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [sampleLoan],
    });

    const res = await request(app)
      .get("/loans")
      .set("Authorization", AUTH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/loans");
    expect(res.status).toBe(401);
  });
});

// ── GET /loans/summary ────────────────────────────────────────────────────────

describe("GET /loans/summary", () => {
  it("should return summary totals", async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          total_lent: "1500.00",
          total_repaid: "500.00",
          total_outstanding: "1000.00",
          total_overdue: "200.00",
          total_loans: "3",
          repaid_count: "1",
          pending_count: "2",
          overdue_count: "1",
        },
      ],
    });

    const res = await request(app)
      .get("/loans/summary")
      .set("Authorization", AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.total_lent).toBe(1500);
    expect(res.body.data.total_repaid).toBe(500);
    expect(res.body.data.total_overdue).toBe(200);
  });
});

// ── PATCH /loans/:id/repay ────────────────────────────────────────────────────

describe("PATCH /loans/:id/repay", () => {
  it("should mark loan as repaid", async () => {
    // ownsLoan query → found
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...sampleLoan }] })
      // UPDATE → repaid
      .mockResolvedValueOnce({
        rows: [{ ...sampleLoan, is_repaid: true, repaid_at: new Date() }],
      });

    const res = await request(app)
      .patch("/loans/1/repay")
      .set("Authorization", AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.is_repaid).toBe(true);
  });

  it("should return 400 if already repaid", async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ ...sampleLoan, is_repaid: true }],
    });

    const res = await request(app)
      .patch("/loans/1/repay")
      .set("Authorization", AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already/i);
  });

  it("should return 404 for loan not belonging to user", async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch("/loans/999/repay")
      .set("Authorization", AUTH);

    expect(res.status).toBe(404);
  });
});
