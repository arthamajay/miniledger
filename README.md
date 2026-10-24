# 💸 MiniLedger

A full-stack mobile app to track money you lend to friends.

**Backend:** Node.js + TypeScript + Express + PostgreSQL  
**Mobile:** React Native (TypeScript)

---

## 📁 Project Structure

```
miniledger/
├── backend/          ← Node.js API server
│   ├── src/
│   │   ├── controllers/    ← Business logic (auth, loans, upload)
│   │   ├── db/             ← DB pool + migration script
│   │   ├── middleware/      ← Auth guard, validation, error handler
│   │   ├── routes/         ← Express routers
│   │   ├── utils/          ← OTP, JWT, response helpers
│   │   └── tests/          ← Jest + Supertest integration tests
│   └── uploads/            ← Receipt photos saved here (git-ignored)
│
└── mobile/           ← React Native app
    └── src/
        ├── screens/        ← LoginScreen, HomeScreen, AddLoanScreen, LoanDetailScreen
        ├── components/     ← SummaryCard, LoanCard (reusable UI)
        ├── services/       ← Axios API layer
        ├── context/        ← AuthContext (global auth state)
        ├── utils/          ← Constants, formatters
        └── types/          ← Shared TypeScript types
```

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd miniledger
```

### 2. Start the backend
See [`backend/README.md`](./backend/README.md)

### 3. Start the mobile app
See [`mobile/README.md`](./mobile/README.md)

---

## ✅ Features

| Feature | Status |
|---|---|
| Phone number login with mock OTP (printed to server logs) | ✅ |
| JWT-based session (persisted across restarts) | ✅ |
| Add loan entry (friend name, amount, due date, note) | ✅ |
| List loans with overdue ones highlighted in red | ✅ |
| Summary card: total lent, repaid, outstanding, overdue | ✅ |
| Mark loan as repaid | ✅ |
| Delete loan | ✅ |
| Upload receipt photo (bonus) | ✅ |
| Input validation on both client and server | ✅ |
| 17 backend integration tests | ✅ |

---

## 🔑 How the OTP Login Works

1. Enter your 10-digit phone number on the Login screen and tap **Send OTP**
2. The server generates a random 6-digit code and **prints it to the terminal**:
   ```
   📱  OTP for 9876543210: 048271  (valid 5 min)
   ```
3. Copy that code into the OTP screen and tap **Verify & Login**
4. The server validates the code and returns a JWT — you're in!

> In production, Step 2 would send an SMS via Twilio/MSG91 instead of console.log.
