/**
 * services/api.ts
 *
 * Central Axios instance + all API call functions.
 *
 * WHY ONE FILE?
 * Keeping every network call here means:
 *  - Screens never import axios directly.
 *  - You change the base URL or auth header logic in ONE place.
 *  - It's easy to mock in tests.
 *
 * INTERCEPTOR:
 * The request interceptor reads the token from AsyncStorage and
 * injects it as the Authorization header automatically, so screens
 * don't need to pass the token manually on every call.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, STORAGE_KEY} from '../utils/constants';
import type {Loan, LoanSummary, AuthUser} from '../types';

// ── Create Axios instance ─────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {'Content-Type': 'application/json'},
});

// ── Request interceptor: attach JWT to every request ─────────────────────────
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem(STORAGE_KEY.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth API calls ────────────────────────────────────────────────────────────

/**
 * sendOtp
 * Asks the server to generate and log an OTP for the given phone.
 */
export async function sendOtp(phone: string): Promise<void> {
  await api.post('/auth/send-otp', {phone});
}

/**
 * verifyOtp
 * Sends the OTP code back to the server. On success, returns the
 * JWT token and user info. We then save the token to AsyncStorage.
 */
export async function verifyOtp(
  phone: string,
  code: string,
): Promise<AuthUser> {
  const res = await api.post('/auth/verify-otp', {phone, code});
  const {token, userId} = res.data.data;

  // Persist token so the user stays logged in after app restart
  await AsyncStorage.setItem(STORAGE_KEY.AUTH_TOKEN, token);
  await AsyncStorage.setItem(
    STORAGE_KEY.USER_DATA,
    JSON.stringify({userId, phone, token}),
  );

  return {token, userId, phone};
}

/**
 * logout
 * Clears the stored token. The AuthContext calls this on logout.
 */
export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEY.AUTH_TOKEN,
    STORAGE_KEY.USER_DATA,
  ]);
}

/**
 * getStoredUser
 * Reads persisted user data on app launch to restore session.
 */
export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY.USER_DATA);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

// ── Loans API calls ───────────────────────────────────────────────────────────

export async function fetchLoans(): Promise<Loan[]> {
  const res = await api.get('/loans');
  return res.data.data as Loan[];
}

export async function fetchLoanSummary(): Promise<LoanSummary> {
  const res = await api.get('/loans/summary');
  return res.data.data as LoanSummary;
}

export async function fetchLoan(id: number): Promise<Loan> {
  const res = await api.get(`/loans/${id}`);
  return res.data.data as Loan;
}

export interface CreateLoanPayload {
  friend_name: string;
  amount: number;
  due_date: string;
  note?: string;
}

export async function createLoan(payload: CreateLoanPayload): Promise<Loan> {
  const res = await api.post('/loans', payload);
  return res.data.data as Loan;
}

export async function repayLoan(id: number): Promise<Loan> {
  const res = await api.patch(`/loans/${id}/repay`);
  return res.data.data as Loan;
}

export async function deleteLoan(id: number): Promise<void> {
  await api.delete(`/loans/${id}`);
}

/**
 * uploadReceipt
 * Sends a photo as multipart/form-data.
 * `uri` is the local file URI returned by the image picker.
 */
export async function uploadReceipt(
  loanId: number,
  uri: string,
  type: string,
  name: string,
): Promise<Loan> {
  const formData = new FormData();
  // React Native's FormData accepts this object shape for files
  formData.append('receipt', {uri, type, name} as unknown as Blob);

  const res = await api.patch(`/loans/${loanId}/receipt`, formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return res.data.data as Loan;
}

export default api;
