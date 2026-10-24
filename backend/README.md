# MiniLedger — Backend

Node.js + TypeScript + Express + PostgreSQL REST API.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 18 | https://nodejs.org |
| npm | ≥ 9 | comes with Node |
| PostgreSQL | ≥ 14 | https://www.postgresql.org/download/ |

---

## Setup (step by step)

### 1. Install dependencies
```bash
cd miniledger/backend
npm install
```

### 2. Create the PostgreSQL database

Open your PostgreSQL client (psql, pgAdmin, or DBeaver) and run:
```sql
CREATE DATABASE miniledger;
```

### 3. Configure environment variables
```bash
# Copy the example file
cp .env.example .env
```

Now open `.env` and fill in your values:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/miniledger
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=5
```

> **Tip:** For `JWT_SECRET`, use any long random string.
> You can generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Run database migrations

This creates the `users`, `otps`, and `loans` tables:
```bash
npm run migrate
```

You should see:
```
✅  Migration complete – all tables are ready.
```

### 5. Start the development server
```bash
npm run dev
```

You should see:
```
🚀  MiniLedger backend running at http://localhost:3000
   Health check: http://localhost:3000/health
```

---

## Running Tests

Tests use Jest + Supertest. The PostgreSQL pool is mocked, so **no database needed** to run tests.

```bash
npm test
```

Expected output:
```
PASS  src/tests/loans.test.ts
PASS  src/tests/auth.test.ts

Tests: 17 passed, 17 total
```

---

## API Reference

All endpoints return:
```json
{ "success": true, "data": { ... } }       // on success
{ "success": false, "error": "message" }   // on failure
```

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/send-otp` | ❌ | Send OTP (printed to server log) |
| POST | `/auth/verify-otp` | ❌ | Verify OTP, receive JWT |
| GET | `/auth/me` | ✅ | Get current user |

**POST /auth/send-otp**
```json
// Request body
{ "phone": "9876543210" }

// Response
{ "success": true, "data": { "phone": "9876543210" }, "message": "OTP sent successfully (check server logs)" }
```

**POST /auth/verify-otp**
```json
// Request body
{ "phone": "9876543210", "code": "048271" }

// Response
{ "success": true, "data": { "token": "eyJ...", "userId": 1, "phone": "9876543210" } }
```

### Loans (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/loans` | Get all loans (sorted: overdue first) |
| POST | `/loans` | Create a new loan entry |
| GET | `/loans/summary` | Get totals: lent, repaid, overdue |
| GET | `/loans/:id` | Get a single loan |
| PATCH | `/loans/:id/repay` | Mark loan as repaid |
| DELETE | `/loans/:id` | Delete a loan |
| PATCH | `/loans/:id/receipt` | Upload a receipt photo (multipart) |

**POST /loans — Request body**
```json
{
  "friend_name": "Rahul",
  "amount": 500.00,
  "due_date": "2025-12-31",
  "note": "Lunch money"
}
```

**GET /loans/summary — Response**
```json
{
  "success": true,
  "data": {
    "total_lent": 1500.00,
    "total_repaid": 500.00,
    "total_outstanding": 1000.00,
    "total_overdue": 200.00,
    "total_loans": 3,
    "repaid_count": 1,
    "pending_count": 2,
    "overdue_count": 1
  }
}
```

---

## Project Structure

```
src/
├── index.ts                  ← Entry point (starts server)
├── app.ts                    ← Express app setup (routes, middleware)
├── db/
│   ├── pool.ts               ← PostgreSQL connection pool singleton
│   └── migrate.ts            ← Creates tables (run with npm run migrate)
├── controllers/
│   ├── authController.ts     ← sendOtp, verifyOtp, getMe
│   ├── loanController.ts     ← CRUD + summary
│   └── uploadController.ts   ← Receipt photo upload
├── routes/
│   ├── auth.ts               ← /auth routes + Zod schemas
│   └── loans.ts              ← /loans routes + Zod schemas
├── middleware/
│   ├── auth.ts               ← JWT guard (sets req.user)
│   ├── validate.ts           ← Zod validation factory
│   └── errorHandler.ts       ← Global error handler + asyncHandler wrapper
├── utils/
│   ├── otp.ts                ← OTP generation
│   ├── jwt.ts                ← signToken / verifyToken
│   └── response.ts           ← sendSuccess / sendError helpers
└── tests/
    ├── auth.test.ts          ← 7 auth endpoint tests
    └── loans.test.ts         ← 10 loan endpoint tests
```

---

## Key Design Decisions

**Why a connection pool (not a single client)?**  
Multiple API requests can run concurrently. A pool lets pg reuse connections instead of opening a new TCP socket for every query.

**Why asyncHandler?**  
Without it, any thrown error in an async route would be an unhandled promise rejection. `asyncHandler` wraps the function in a `.catch(next)` so every error ends up in the global error handler.

**Why Zod for validation?**  
Zod schemas define both the validation rules AND the TypeScript type in one declaration. The `validate()` middleware factory makes it easy to add validation to any route with one line.

**Why mock OTP instead of SMS?**  
Keeps setup friction to zero — no third-party account or API key needed. The `console.log` line is the only thing that would change in production.
