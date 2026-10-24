# MiniLedger — Mobile App

React Native app (TypeScript) for tracking loans to friends.

---

## Prerequisites

| Tool | Install |
|---|---|
| Node.js ≥ 18 | https://nodejs.org |
| React Native CLI | `npm install -g react-native-cli` |
| Android Studio + emulator **or** a physical Android device | https://developer.android.com/studio |
| JDK 17 | bundled with Android Studio |

> **iOS:** Requires a Mac with Xcode. The Android path works on Windows/Mac/Linux.

---

## Setup

### 1. Install dependencies
```bash
cd miniledger/mobile
npm install
```

### 2. Configure the API URL

Open `src/utils/constants.ts` and set `API_BASE_URL`:

```ts
// Android emulator → host machine's localhost
export const API_BASE_URL = 'http://10.0.2.2:3000';

// iOS simulator
// export const API_BASE_URL = 'http://localhost:3000';

// Physical device (replace with your machine's local network IP)
// export const API_BASE_URL = 'http://192.168.1.X:3000';
```

### 3. Make sure the backend is running

Follow the backend README first. The server must be running at the URL you set above.

### 4. Run on Android emulator

```bash
# Terminal 1 – start Metro bundler
npm start

# Terminal 2 – build and install on emulator
npm run android
```

The app will open in the emulator. Metro stays running for hot reload.

---

## Running on a Physical Android Device

1. Enable **Developer Options** and **USB Debugging** on your phone
2. Connect via USB
3. Run `adb devices` to confirm the device is detected
4. Replace `API_BASE_URL` with your machine's LAN IP (e.g. `192.168.1.42:3000`)
5. Run `npm run android`

---

## App Flow

```
Launch
  └── AuthProvider checks AsyncStorage for saved token
       ├── Token found → Home screen (stay logged in)
       └── No token    → Login screen
                           └── Enter phone → Send OTP
                                 └── OTP screen → Verify OTP
                                       └── Home screen ✅
```

### Home Screen
- **Summary card** at top: total lent, repaid, outstanding, overdue
- **Loan list** sorted by overdue first, then by due date
- Overdue loans have a **red border** and "Xd overdue" badge
- Pull down to refresh
- **＋ FAB** to add a new loan

### Add Loan Screen
- Fields: Friend name, Amount (₹), Due date (YYYY-MM-DD), Note (optional)
- Client-side validation mirrors the server's Zod schema

### Loan Detail Screen
- Full loan info with colour-coded status
- **Mark as Repaid** button (confirms before updating)
- **Attach Receipt** button — opens image library, uploads photo to server
- **Delete** button

---

## Project Structure

```
src/
├── App.tsx                    ← Root component, navigation setup
├── types/
│   └── index.ts               ← All TypeScript types & navigation params
├── utils/
│   ├── constants.ts           ← API_BASE_URL, COLORS, STORAGE_KEY
│   └── formatters.ts          ← formatCurrency, formatDate, getDaysOverdue
├── services/
│   └── api.ts                 ← All Axios API calls (single source of truth)
├── context/
│   └── AuthContext.tsx        ← Global auth state + session restore
├── components/
│   ├── SummaryCard.tsx        ← 4-tile overview widget
│   └── LoanCard.tsx           ← Single loan row with status highlighting
└── screens/
    ├── LoginScreen.tsx        ← Phone input → calls sendOtp
    ├── OtpVerifyScreen.tsx    ← OTP input → calls verifyOtp, sets auth
    ├── HomeScreen.tsx         ← Summary + loan list + FAB
    ├── AddLoanScreen.tsx      ← Create loan form
    └── LoanDetailScreen.tsx   ← Details + repay + receipt upload + delete
```

---

## Key Design Decisions

**Why AuthContext instead of passing user as a prop?**  
Any screen needs to know who's logged in or be able to log out. Context avoids threading these props through every navigator level.

**Why useFocusEffect on HomeScreen?**  
React Navigation keeps screens mounted when you navigate away. Without `useFocusEffect`, the Home screen would show stale data after adding or repaying a loan. Re-fetching on focus ensures the list is always fresh.

**Why a single `api.ts` service file?**  
It's the only file that imports Axios. If you change the base URL, add auth headers, or switch to a different HTTP library, you change one file.

**Why AsyncStorage for the token?**  
It persists across app restarts so users don't have to log in every time. The token is read automatically by the Axios request interceptor — screens never handle it directly.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Network request failed` | Make sure the backend is running and `API_BASE_URL` is correct |
| Blank screen on Android emulator | Run `adb reverse tcp:3000 tcp:3000` to forward the port |
| Metro bundler port conflict | Run `npx react-native start --port 8082` |
| `Unable to load script` | Make sure Metro is running (`npm start`) before `npm run android` |
