/**
 * types/index.ts
 *
 * Shared TypeScript types used across the entire app.
 * Defining them once here keeps every screen and service in sync.
 */

// ── API Response wrapper ──────────────────────────────────────────────────────
// Every backend response follows this shape
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  userId: number;
  phone: string;
  token: string;
}

// ── Loan ─────────────────────────────────────────────────────────────────────
export interface Loan {
  id: number;
  user_id: number;
  friend_name: string;
  amount: number;       // stored as string in PG, parsed to number by backend
  due_date: string;     // "YYYY-MM-DD"
  is_repaid: boolean;
  repaid_at: string | null;
  receipt_url: string | null;
  note: string | null;
  created_at: string;
  is_overdue: boolean;  // computed column from backend
}

// ── Summary ───────────────────────────────────────────────────────────────────
export interface LoanSummary {
  total_lent: number;
  total_repaid: number;
  total_outstanding: number;
  total_overdue: number;
  total_loans: number;
  repaid_count: number;
  pending_count: number;
  overdue_count: number;
}

// ── Navigation ────────────────────────────────────────────────────────────────
// Defines every screen and what params it accepts.
// React Navigation reads this at compile time for type-safe navigation.
export type RootStackParamList = {
  Login: undefined;
  OtpVerify: { phone: string };
  Home: undefined;
  AddLoan: undefined;
  LoanDetail: { loanId: number };
};
