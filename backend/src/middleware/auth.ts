/**
 * middleware/auth.ts
 *
 * Express middleware that protects routes requiring a logged-in user.
 *
 * HOW IT WORKS:
 * 1. Look for the Authorization header: "Bearer <token>"
 * 2. Verify the JWT with our secret
 * 3. Attach the decoded payload to req.user so controllers can
 *    read req.user.userId without repeating token parsing logic
 *
 * If the token is missing or invalid → 401 Unauthorized.
 */

import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { sendError } from "../utils/response";

// Extend Express's Request type so TypeScript knows about req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Header format: "Authorization: Bearer eyJhbGciOi..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, "No token provided. Please log in.", 401);
    return;
  }

  const token = authHeader.split(" ")[1]; // extract the token part

  try {
    const payload = verifyToken(token);
    req.user = payload; // attach to request for downstream handlers
    next();
  } catch {
    // jwt.verify throws if expired or tampered
    sendError(res, "Invalid or expired token. Please log in again.", 401);
  }
}
