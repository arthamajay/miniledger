/**
 * utils/otp.ts
 *
 * Helpers for generating and validating OTP codes.
 *
 * WHY MOCK?
 * In production you'd send the OTP via SMS (Twilio, MSG91, etc.).
 * For this assignment we simply console.log() the code so you
 * can copy it from the server terminal – zero external deps needed.
 */

import crypto from "crypto";

/**
 * generateOTP
 * Returns a random 6-digit string like "048271".
 *
 * crypto.randomInt is cryptographically secure and avoids the
 * slight bias you get with Math.random().
 */
export function generateOTP(): string {
  // randomInt(0, 1_000_000) gives 0–999999; padStart ensures 6 digits
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, "0");
}

/**
 * getOTPExpiry
 * Returns a Date that is `minutes` from now.
 * Default is 5 minutes – enough time to paste it from the logs.
 */
export function getOTPExpiry(minutes: number = 5): Date {
  return new Date(Date.now() + minutes * 60 * 1_000);
}
