/**
 * controllers/loanController.ts
 *
 * All loan-related business logic lives here.
 *
 * ENDPOINTS HANDLED:
 *   POST   /loans            → create a new loan entry
 *   GET    /loans            → list all loans for the logged-in user
 *   GET    /loans/:id        → get a single loan
 *   PATCH  /loans/:id/repay  → mark a loan as repaid
 *   DELETE /loans/:id        → delete a loan entry
 *   GET    /loans/summary    → totals: lent, repaid, overdue
 *
 * EVERY route here is protected by authMiddleware, so
 * req.user.userId is always available and trusted.
 */

import { Request, Response } from "express";
import pool from "../db/pool";
import { sendSuccess, sendError } from "../utils/response";
import { asyncHandler } from "../middleware/errorHandler";

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * ownsLoan
 * Fetch a loan and verify it belongs to the requesting user.
 * Returns the loan row, or null if not found / not owned.
 * Centralising this check avoids repeating it in every handler.
 */
async function ownsLoan(loanId: number, userId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM loans WHERE id = $1 AND user_id = $2`,
    [loanId, userId]
  );
  return rows[0] ?? null;
}

// ─── POST /loans ─────────────────────────────────────────────────────────────

export const createLoan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { friend_name, amount, due_date, note } = req.body as {
    friend_name: string;
    amount: number;
    due_date: string; // ISO date string "YYYY-MM-DD"
    note?: string;
  };

  const { rows } = await pool.query(
    `INSERT INTO loans (user_id, friend_name, amount, due_date, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, friend_name, amount, due_date, note ?? null]
  );

  sendSuccess(res, rows[0], "Loan entry created", 201);
});

// ─── GET /loans ──────────────────────────────────────────────────────────────

export const getLoans = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // We add a computed column `is_overdue`:
  //   A loan is overdue when it is NOT yet repaid AND its due_date
  //   has already passed (comparing to current date, not timestamp).
  const { rows } = await pool.query(
    `SELECT *,
            (is_repaid = FALSE AND due_date < CURRENT_DATE) AS is_overdue
     FROM loans
     WHERE user_id = $1
     ORDER BY
       -- Show overdue first, then by due date ascending
       (is_repaid = FALSE AND due_date < CURRENT_DATE) DESC,
       due_date ASC`,
    [userId]
  );

  sendSuccess(res, rows);
});

// ─── GET /loans/summary ──────────────────────────────────────────────────────
// NOTE: This route MUST be registered before GET /loans/:id in the router,
// otherwise Express would try to match "summary" as an :id param.

export const getLoanSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const { rows } = await pool.query(
      `SELECT
         -- Total ever lent (all loans regardless of status)
         COALESCE(SUM(amount), 0)                                      AS total_lent,

         -- Total repaid (only rows where is_repaid = true)
         COALESCE(SUM(amount) FILTER (WHERE is_repaid = TRUE), 0)      AS total_repaid,

         -- Outstanding = lent but not yet repaid
         COALESCE(SUM(amount) FILTER (WHERE is_repaid = FALSE), 0)     AS total_outstanding,

         -- Overdue = not repaid AND past due date
         COALESCE(
           SUM(amount) FILTER (
             WHERE is_repaid = FALSE AND due_date < CURRENT_DATE
           ), 0
         )                                                              AS total_overdue,

         COUNT(*)                                                       AS total_loans,
         COUNT(*) FILTER (WHERE is_repaid = TRUE)                      AS repaid_count,
         COUNT(*) FILTER (WHERE is_repaid = FALSE)                     AS pending_count,
         COUNT(*) FILTER (
           WHERE is_repaid = FALSE AND due_date < CURRENT_DATE
         )                                                              AS overdue_count
       FROM loans
       WHERE user_id = $1`,
      [userId]
    );

    // Cast strings from pg to numbers for the client
    const raw = rows[0];
    const summary = {
      total_lent: parseFloat(raw.total_lent),
      total_repaid: parseFloat(raw.total_repaid),
      total_outstanding: parseFloat(raw.total_outstanding),
      total_overdue: parseFloat(raw.total_overdue),
      total_loans: parseInt(raw.total_loans, 10),
      repaid_count: parseInt(raw.repaid_count, 10),
      pending_count: parseInt(raw.pending_count, 10),
      overdue_count: parseInt(raw.overdue_count, 10),
    };

    sendSuccess(res, summary);
  }
);

// ─── GET /loans/:id ──────────────────────────────────────────────────────────

export const getLoan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const loanId = parseInt(req.params.id, 10);

  if (isNaN(loanId)) {
    sendError(res, "Invalid loan ID", 400);
    return;
  }

  const loan = await ownsLoan(loanId, userId);
  if (!loan) {
    sendError(res, "Loan not found", 404);
    return;
  }

  // Attach computed is_overdue field
  const result = {
    ...loan,
    is_overdue: !loan.is_repaid && new Date(loan.due_date) < new Date(),
  };

  sendSuccess(res, result);
});

// ─── PATCH /loans/:id/repay ──────────────────────────────────────────────────

export const repayLoan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const loanId = parseInt(req.params.id, 10);

  if (isNaN(loanId)) {
    sendError(res, "Invalid loan ID", 400);
    return;
  }

  const loan = await ownsLoan(loanId, userId);
  if (!loan) {
    sendError(res, "Loan not found", 404);
    return;
  }

  if (loan.is_repaid) {
    sendError(res, "This loan is already marked as repaid", 400);
    return;
  }

  // Set is_repaid = TRUE and record the exact repayment timestamp
  const { rows } = await pool.query(
    `UPDATE loans
     SET is_repaid = TRUE, repaid_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [loanId]
  );

  sendSuccess(res, rows[0], "Loan marked as repaid");
});

// ─── DELETE /loans/:id ───────────────────────────────────────────────────────

export const deleteLoan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const loanId = parseInt(req.params.id, 10);

  if (isNaN(loanId)) {
    sendError(res, "Invalid loan ID", 400);
    return;
  }

  const loan = await ownsLoan(loanId, userId);
  if (!loan) {
    sendError(res, "Loan not found", 404);
    return;
  }

  await pool.query(`DELETE FROM loans WHERE id = $1`, [loanId]);

  sendSuccess(res, { id: loanId }, "Loan deleted");
});
