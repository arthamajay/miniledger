/**
 * app.ts
 *
 * Creates and configures the Express application.
 * Separated from index.ts so we can import `app` in tests
 * without actually binding to a port.
 */

import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import loanRoutes from "./routes/loans";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────

// CORS: allow requests from the React Native app (and any origin in dev)
app.use(cors());

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded form data (not used much but good to have)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded receipt images as static files at /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/auth", authRoutes);
app.use("/loans", loanRoutes);

// Health-check endpoint – useful to confirm the server is running
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler for unrecognised routes
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Global error handler (must be last) ──────────────────────────────────────
// This catches any error passed to next(err) from any route.
app.use(errorHandler);

export default app;
