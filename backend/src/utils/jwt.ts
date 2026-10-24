/**
 * utils/jwt.ts
 *
 * Thin wrappers around the `jsonwebtoken` library.
 *
 * WHY A WRAPPER?
 * Centralising sign/verify here means the rest of the code never
 * imports `jsonwebtoken` directly. If you swap to a different JWT
 * library later, you only change this file.
 *
 * TOKEN PAYLOAD
 * We store { userId, phone } in the token. That's enough for the
 * auth middleware to identify who is making the request without a
 * database round-trip on every API call.
 */

import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  phone: string;
}

/**
 * signToken
 * Creates a signed JWT. The secret and expiry come from .env so
 * they're easy to rotate without changing code.
 */
export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN as string) || "7d";

  // Cast needed because @types/jsonwebtoken's overloads are strict
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * verifyToken
 * Decodes and validates a token. Throws if expired or tampered.
 * Returns the payload so callers can read userId / phone.
 */
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as JwtPayload;
}
