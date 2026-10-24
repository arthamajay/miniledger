/**
 * middleware/errorHandler.ts
 *
 * Global Express error handler.
 *
 * Any route/controller that calls next(err) OR throws inside an
 * async handler (wrapped with asyncHandler below) ends up here.
 *
 * WHY CENTRALISE?
 * Without this, every try/catch would need its own res.status(500)
 * block. Here we handle it once and always return a consistent JSON.
 */

import { Request, Response, NextFunction } from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction   // must have 4 params for Express to recognise it
): void {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    // Only show detailed message in development
    ...(process.env.NODE_ENV === "development" && { detail: err.message }),
  });
}

/**
 * asyncHandler
 *
 * Wraps an async route handler so you don't need try/catch everywhere.
 *
 * USAGE:
 *   router.get('/path', asyncHandler(async (req, res) => {
 *     const data = await someAsyncThing();
 *     res.json(data);
 *   }));
 *
 * If the promise rejects, the error is forwarded to errorHandler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
