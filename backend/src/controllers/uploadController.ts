/**
 * controllers/uploadController.ts
 *
 * Handles receipt photo uploads (Bonus feature).
 *
 * HOW IT WORKS:
 * 1. Multer (file upload middleware) reads the multipart/form-data
 *    request and saves the file to the `uploads/` folder on disk.
 * 2. We update the loan row with the saved file path.
 * 3. The path is returned so the app can show the image.
 *
 * IN PRODUCTION you'd upload to S3/GCS instead of local disk.
 * The structure here makes that swap easy — just change the
 * multer storage engine and update the URL logic.
 */

import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import pool from "../db/pool";
import { sendSuccess, sendError } from "../utils/response";
import { asyncHandler } from "../middleware/errorHandler";

// ── Multer storage configuration ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Files land in the `uploads/` directory at the project root.
    // This folder is git-ignored so real photos aren't committed.
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (_req, file, cb) => {
    // Prefix with timestamp to avoid name collisions.
    // e.g. "1704067200000-receipt.jpg"
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

// Only accept image files (JPEG, PNG, WebP)
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  }
};

// Max size = 5 MB
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── PATCH /loans/:id/receipt ─────────────────────────────────────────────────

export const uploadReceipt = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const loanId = parseInt(req.params.id, 10);

    if (isNaN(loanId)) {
      sendError(res, "Invalid loan ID", 400);
      return;
    }

    if (!req.file) {
      sendError(res, "No file uploaded", 400);
      return;
    }

    // Verify the loan belongs to this user before updating
    const { rows: check } = await pool.query(
      `SELECT id FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId]
    );

    if (check.length === 0) {
      sendError(res, "Loan not found", 404);
      return;
    }

    // Build a URL path that the app can use to display the image.
    // e.g. "/uploads/1704067200000-receipt.jpg"
    const receiptUrl = `/uploads/${req.file.filename}`;

    const { rows } = await pool.query(
      `UPDATE loans SET receipt_url = $1 WHERE id = $2 RETURNING *`,
      [receiptUrl, loanId]
    );

    sendSuccess(res, rows[0], "Receipt uploaded successfully");
  }
);
