/**
 * routes/loans.ts
 *
 * All loan-related routes. Every route here requires a valid JWT
 * because authMiddleware is applied at the router level (once,
 * at the top — it protects ALL routes below it automatically).
 *
 * Route order matters:
 *   GET /summary must come BEFORE GET /:id, otherwise Express
 *   would interpret the string "summary" as an :id param.
 */

import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import {
  createLoan,
  getLoans,
  getLoan,
  repayLoan,
  deleteLoan,
  getLoanSummary,
} from "../controllers/loanController";
import { upload, uploadReceipt } from "../controllers/uploadController";

const router = Router();

// ── Apply auth to ALL loan routes ────────────────────────────────────────────
router.use(authMiddleware);

// ── Zod schema for creating a loan ───────────────────────────────────────────
const createLoanSchema = z.object({
  friend_name: z
    .string()
    .trim()
    .min(1, "Friend name is required")
    .max(100, "Name too long"),

  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),

  due_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format")
    .refine(
      (d) => new Date(d) > new Date(new Date().setHours(0, 0, 0, 0)),
      "Due date must be in the future"
    ),

  note: z.string().trim().max(500, "Note too long").optional(),
});

// ── Routes ───────────────────────────────────────────────────────────────────

// Summary FIRST (before /:id to avoid route collision)
router.get("/summary", getLoanSummary);

router.get("/", getLoans);
router.post("/", validate(createLoanSchema), createLoan);
router.get("/:id", getLoan);
router.patch("/:id/repay", repayLoan);
router.delete("/:id", deleteLoan);

// Bonus: upload a receipt photo (multipart/form-data, field name "receipt")
router.patch("/:id/receipt", upload.single("receipt"), uploadReceipt);

export default router;
