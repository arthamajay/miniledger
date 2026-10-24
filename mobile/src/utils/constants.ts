/**
 * utils/constants.ts
 *
 * App-wide constants.
 *
 * API_BASE_URL:
 *   - Android emulator: 10.0.2.2 is a special alias for the host machine's
 *     localhost. Your Node server runs on the host, so we use that IP.
 *   - iOS simulator: localhost works fine.
 *   - Real device: replace with your machine's local network IP (e.g. 192.168.x.x).
 *
 * STORAGE_KEY:
 *   AsyncStorage key where we persist the auth token between app restarts.
 */

export const API_BASE_URL = 'http://localhost:3000'; // Android emulator default

export const STORAGE_KEY = {
  AUTH_TOKEN: '@miniledger/auth_token',
  USER_DATA: '@miniledger/user_data',
};

// Colour palette – used across all screens for consistency
export const COLORS = {
  primary: '#6C63FF',       // purple – brand colour
  danger: '#FF4757',        // red – overdue / destructive
  success: '#2ED573',       // green – repaid / positive
  warning: '#FFA502',       // orange – pending
  background: '#F8F9FE',    // light grey background
  card: '#FFFFFF',          // white card
  text: '#2F3542',          // near-black body text
  textLight: '#747D8C',     // grey secondary text
  border: '#DFE4EA',        // light grey border
};
