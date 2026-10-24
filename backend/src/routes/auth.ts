/**
 * routes/auth.ts
 *
 * Mounts the authentication endpoints:
 *
 *   POST /auth/send-otp    → request an OTP (no auth needed)
 *   POST /auth/verify-otp  → verify OTP, receive JWT (no auth needed)
 *   GET  /auth/me          → get own profile (JWT required)
 *
 * Validation schemas are defined here using Zod so you can see
 * the rules right next to the route they protect.
 */

import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { sendOtp, verifyOtp, getMe } from "../controllers/authController";

const router = Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

// Phone must be exactly 10 digits (Indian mobile numbers).
// Adjust the regex for other country formats if needed.
const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
});

const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  code: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

// ── Routes ───────────────────────────────────────────────────────────────────

// validate() runs schema check before the controller is called
router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.get("/me", authMiddleware, getMe);

export default router;
