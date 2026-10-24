/**
 * utils/response.ts
 *
 * Standard JSON response helpers.
 *
 * Every API response follows one of two shapes:
 *   Success → { success: true,  data: <any>,    message?: string }
 *   Error   → { success: false, error: string,  message?: string }
 *
 * Using a consistent shape means the React Native app only needs
 * to check `response.success` to know if a call worked.
 */

import { Response } from "express";

export function sendSuccess(
  res: Response,
  data: unknown,
  message?: string,
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400
) {
  return res.status(statusCode).json({
    success: false,
    error,
  });
}
