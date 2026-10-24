/**
 * middleware/validate.ts
 *
 * Zod-based request validation middleware factory.
 *
 * USAGE:
 *   router.post('/login', validate(sendOtpSchema), sendOtpHandler);
 *
 * HOW IT WORKS:
 * - Takes a Zod schema as argument, returns an Express middleware.
 * - Parses req.body against the schema.
 * - If valid → attaches the parsed (type-safe) body back to req.body
 *   and calls next().
 * - If invalid → returns 422 with Zod's formatted error messages so
 *   the client knows exactly which field failed and why.
 *
 * WHY ZOD?
 * Zod lets you define the shape and rules (e.g. phone must be 10 digits)
 * in one place and get TypeScript types inferred automatically.
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format Zod errors into a readable object: { fieldName: "error msg" }
      const errors: Record<string, string> = {};
      (result.error as ZodError).errors.forEach((e) => {
        const field = e.path.join(".");
        errors[field] = e.message;
      });

      res.status(422).json({
        success: false,
        error: "Validation failed",
        errors,
      });
      return;
    }

    req.body = result.data; // replace with coerced/parsed values
    next();
  };
}
