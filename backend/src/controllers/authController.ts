/**
 * controllers/authController.ts
 *
 * Handles the two-step phone/OTP login flow:
 *
 * Step 1 – POST /auth/send-otp
 *   • Client sends { phone }
 *   • Server generates a 6-digit OTP, stores it in the otps table
 *     with a 5-minute expiry, and **prints it to the console**.
 *   • (In production you'd send an SMS here instead)
 *
 * Step 2 – POST /auth/verify-otp
 *   • Client sends { phone, code }
 *   • Server looks up the latest unused, unexpired OTP for that phone
 *   • If valid → marks it used, upserts the user row, returns a JWT
 *   • If invalid/expired → 401
 */

import { Request, Response } from "express";
import pool from "../db/pool";
import { generateOTP, getOTPExpiry } from "../utils/otp";
import { signToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { asyncHandler } from "../middleware/errorHandler";

// ─── Step 1: Send OTP ────────────────────────────────────────────────────────

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };

  const code = generateOTP();
  const expiresAt = getOTPExpiry(5); // 5 minutes from now

  // Store the OTP. We insert a fresh row each time rather than
  // updating, so there's an audit trail. Old rows can be pruned
  // by a cron job in production.
  await pool.query(
    `INSERT INTO otps (phone, code, expires_at) VALUES ($1, $2, $3)`,
    [phone, code, expiresAt]
  );

  // ── MOCK: Print OTP to server console ───────────────────────
  // In a real app replace this with an SMS API call.
  console.log(`\n📱  OTP for ${phone}: ${code}  (valid 5 min)\n`);
  // ─────────────────────────────────────────────────────────────

  sendSuccess(res, { phone }, "OTP sent successfully (check server logs)");
});

// ─── Step 2: Verify OTP & issue JWT ─────────────────────────────────────────

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, code } = req.body as { phone: string; code: string };

  // Find the latest valid OTP for this phone number.
  // Conditions: correct phone, correct code, not used, not expired.
  const { rows } = await pool.query(
    `SELECT id FROM otps
     WHERE phone = $1
       AND code = $2
       AND is_used = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone, code]
  );

  if (rows.length === 0) {
    sendError(res, "Invalid or expired OTP. Please request a new one.", 401);
    return;
  }

  const otpId = rows[0].id;

  // Mark this OTP as used so it can't be reused (replay attack prevention)
  await pool.query(`UPDATE otps SET is_used = TRUE WHERE id = $1`, [otpId]);

  // Upsert user: create if first login, return existing id otherwise.
  // ON CONFLICT DO NOTHING + RETURNING handles both cases cleanly.
  const upsertResult = await pool.query(
    `INSERT INTO users (phone)
     VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id`,
    [phone]
  );

  const userId: number = upsertResult.rows[0].id;

  // Issue a JWT. The token carries userId and phone so protected
  // routes can identify the user without a DB lookup.
  const token = signToken({ userId, phone });

  sendSuccess(
    res,
    { token, userId, phone },
    "Login successful",
    200
  );
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Returns the current user's info. Useful to check if token is still valid.

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // req.user is set by authMiddleware
  const { userId, phone } = req.user!;
  sendSuccess(res, { userId, phone });
});
