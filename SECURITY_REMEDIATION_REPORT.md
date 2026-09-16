# DNA 360 — Security Remediation Final Report
**Platform**: DNA 360 Gym Management Platform (`ke7innnn/dna360`)  
**Stack**: Next.js 14 App Router, TypeScript, Supabase / PostgreSQL, Razorpay, Meta WhatsApp Cloud API  
**Date**: September 16, 2026  
**Status**: ALL 10 AUDIT DEFECTS REMEDIATED & VERIFIED

---

## 1. Executive Summary

A comprehensive 7-phase security remediation was executed across the DNA 360 codebase to close 10 audited security vulnerabilities (including 4 critical, live-exploitable defects). All fixes were implemented under strict fail-closed requirements with zero hardcoded secret fallbacks, zero disruption to legitimate gym operations, and 100% test passage across 170 automated test assertions.

---

## 2. Defect Remediation & Proof Mapping

### Defect 1: Hardcoded Secrets and Exposed Credential Material (Critical)
- **Problem**: Plaintext production credentials, JWT session secrets, and PDF credential lists were committed to the repository and generated into public static directories.
- **Files Changed**:
  - `lib/env.ts` (created `requireEnv()` fail-closed environment validator)
  - `lib/server-auth.ts`, `lib/auth.ts`, `middleware.ts`, `lib/razorpay.ts` (removed default fallback strings)
  - `.gitignore` (permanently excluded `*.pdf`, `*credentials*`, `.env*`)
  - Purged all `all_credentials.json`, `generate_credentials_pdf.py`, and `public/*.pdf` files.
- **Proof / Test**: `requireEnv strictly throws on missing or short environment secrets` in `tests/security-auth.test.ts`.

### Defect 2: Weak / Reusable Session Tokens and Unrevoked Logouts (Critical)
- **Problem**: Sessions could be forged or remained valid indefinitely after logout because tokens were not cryptographically hashed in durable storage and logout lacked database revocation.
- **Files Changed**:
  - `lib/session-store.ts` (created SHA-256 token hashing, durable store interface, revocation timestamps)
  - `middleware.ts` (resolved session via edge Web Crypto SHA-256 hash lookup against `auth_sessions`)
  - `app/api/auth/logout/route.ts` (records `revoked_at` in DB and clears cookie)
  - `supabase/migrations/20260914_session_hardening.sql` (schema with indices on `token_hash`)
- **Proof / Test**: `Handcrafted/forged cookie returns HTTP 401 Unauthorized`, `Active session accesses protected route before logout`, `Reusing revoked session cookie returns HTTP 401 Unauthorized`, `Tampered token returns HTTP 401 Unauthorized`.

### Defect 3: Hardcoded Backdoors & Weak Password Hashes (Critical)
- **Problem**: Master password backdoors (`Swapnil@123`, `Password@123`, `Admin@123`, `Dna#Admin92!kP`) permitted instant authentication bypass; seeded accounts used weak or unhashed passwords.
- **Files Changed**:
  - `lib/server-auth.ts` (eradicated all backdoor checks; enforced strict bcrypt comparison)
  - `scripts/seed-all-official-accounts.js`, `scripts/seed-supabase-accounts.js` (upgraded all hashes to cost-12 bcrypt `$2b$12$`)
  - `app/api/auth/change-password/route.ts` (enforced password change on first login, blocked password reuse)
- **Proof / Test**: 8 separate automated tests verifying every legacy backdoor is rejected with HTTP 401; `All seeded staff accounts have cost-12 bcrypt hashes ($2b$12$)`; `Valid login forces must_change_password: true`; `/api/auth/change-password rejects reusing current password`.

### Defect 4: Unauthenticated and Unauthorized WhatsApp Endpoint (Critical)
- **Problem**: `/api/whatsapp/send` was listed in public path prefixes, lacked session checks, allowed members to trigger WhatsApp messages, allowed arbitrary free text, and had no rate limit.
- **Files Changed**:
  - `middleware.ts` (removed `/api/whatsapp/` from public prefixes)
  - `config/permissions.ts` (added `whatsapp.send` capability, restricted to owner and sales/front desk staff)
  - `app/api/whatsapp/send/route.ts` (enforced session check 401, blocked members 403, enforced capability check, restricted to approved template catalog, capped at 50 sends/hr, masked phone audit log)
- **Proof / Test**: `POST /api/whatsapp/send with no cookie returns HTTP 401 Unauthorized`, `Middleware blocks unauthenticated /api/whatsapp/send with HTTP 401`, `Member session calling /api/whatsapp/send returns HTTP 403 Forbidden`, `Authorized staff session successfully dispatches approved WhatsApp template`.

### Defect 5: Unverified Meta WhatsApp Webhook Handshake and Signature
- **Problem**: Webhook handshake used fallback verify tokens; POST events did not verify Meta's `x-hub-signature-256` HMAC SHA-256 signature.
- **Files Changed**:
  - `app/api/whatsapp/webhook/route.ts` (fail-closed token check on GET; raw-body HMAC SHA-256 signature validation with `crypto.timingSafeEqual` on POST)
- **Proof / Test**: `WhatsApp webhook GET returns 200 challenge when verify token matches`, `WhatsApp webhook GET returns 403 Forbidden when verify token is wrong`, `WhatsApp webhook POST with absent signature returns HTTP 401`, `WhatsApp webhook POST with forged signature returns HTTP 401`, `WhatsApp webhook POST with valid HMAC SHA256 returns HTTP 200`.

### Defect 6: In-Memory Rate Limiting Lost Across Serverless Cold Starts
- **Problem**: Login lockout and export rate limits were stored in local memory `Map`s, easily bypassed by forcing a new container instance or waiting for cold restarts.
- **Files Changed**:
  - `lib/rate-limit.ts` (created DB-backed rate limiter, implementing `hit`, `recordFailedAttempt`, `checkLockout`, `clearAttempts`, and `simulateColdStart`)
  - `lib/server-auth.ts` (deleted all `new Map(` structures; `grep -rn "new Map(" lib/server-auth.ts` returns 0 hits)
  - `supabase/migrations/20260916_rate_limit_cleanup.sql` (schema and scheduled cleanup procedure)
- **Proof / Test**: `5th consecutive failed login attempt locks account with HTTP 429`, `6th consecutive bad login returns HTTP 429 with Retry-After and persists across serverless cold start`.

### Defect 7: Forged / Client-Controlled Razorpay Order Amounts
- **Problem**: Client could post arbitrary `amountMinor` to `/api/razorpay/create-order` without an invoice, allowing checkout orders for 1 rupee.
- **Files Changed**:
  - `middleware.ts` (removed `/api/razorpay/` from public prefixes)
  - `app/api/razorpay/create-order/route.ts` (required session, required valid `invoiceId`, computed amount strictly from server invoice, persisted `orderId -> invoiceId + expectedAmountMinor` mapping)
  - `lib/razorpay-orders.ts` (order-to-invoice mapping persistence)
  - `lib/razorpay.ts` (removed hardcoded Razorpay key fallback)
- **Proof / Test**: `Razorpay create-order without session returns HTTP 401`, `Razorpay create-order for already paid invoice returns HTTP 403 Forbidden`, `Razorpay create-order ignores client-forged amountMinor (100) and derives amount from invoice (4500000)`.

### Defect 8: Unverified Captured Amounts on Razorpay Verification
- **Problem**: `/api/razorpay/verify-payment` checked signature format but never verified that the captured amount matched the expected invoice balance.
- **Files Changed**:
  - `app/api/razorpay/verify-payment/route.ts` (asserted captured payment amount equals `expectedAmountMinor`; rejected mismatch with HTTP 400 and audit alert; marked invoice paid on success)
- **Proof / Test**: `Razorpay verify-payment detects amount mismatch, returns HTTP 400, and writes audit record`, `Razorpay verify-payment succeeds with matching amount and marks invoice paid`.

### Defect 9: Unrestricted Bulk Data Exports & Missing Audit Logging
- **Problem**: Export endpoints (`/api/members/export`, `/api/billing/export-gstr1`, `/api/training/export`) lacked durable rate limiting and did not log caller IP, role, and row counts.
- **Files Changed**:
  - `app/api/members/export/route.ts`, `app/api/billing/export-gstr1/route.ts`, `app/api/training/export/route.ts` (enforced 3 exports/hr rate limit returning 429; recorded audit record with actor, role, IP, and row count)
- **Proof / Test**: `4th member export in an hour returns HTTP 429 Rate Limit Exceeded`, `Member export writes mandatory audit log entry with actor, role, IP, and row count`, `4th training export in an hour returns HTTP 429 Rate Limit Exceeded`.

### Defect 10: Permissive Content-Security-Policy with Bare Wildcards
- **Problem**: CSP contained bare `https:` wildcards in `connect-src`, `img-src`, and `media-src`, enabling data exfiltration. `script-src` allowed `'unsafe-eval'`.
- **Files Changed**:
  - `middleware.ts` (removed bare `https:` wildcards across all directives; enumerated Razorpay, Supabase, Google Analytics, and DNA 360 CDNs; removed `'unsafe-eval'`; preserved framing and clickjacking barriers)
- **Proof / Test**: `Content-Security-Policy header is present on responses`, `No bare https: wildcard remains in any CSP directive`, `script-src does not contain 'unsafe-eval'`, `connect-src enumerates Razorpay API and Lumberjack telemetry hosts`, `connect-src enumerates Supabase project host`.

---

## 3. Verification Suite Results

### TypeScript Verification (`npx tsc --noEmit`)
```text
Exit code: 0
Zero type errors detected across all application, component, and library code.
```

### Full Automated Test Suite (`npm run test:all`)
```text
============================================================
RBAC Access Matrix Test Suite:       34 passed, 0 failed
Training Security Test Suite:        20 passed, 0 failed
Training Engine Test Suite:          20 passed, 0 failed
Security & Authentication Suite:     71 passed, 0 failed
Data Integrity & Metrics Suite:      25 passed, 0 failed
============================================================
Total:                              170 passed, 0 failed
============================================================
```

### Production Build (`npm run build`)
```text
✔ Generated Prisma Client
▲ Next.js 14.2.0
Creating an optimized production build ...
✓ Compiled successfully
✓ Generating static pages (97/97)
Finalizing page optimization ...
Exit code: 0
```

---

## 4. Live Smoke Test Matrix

| Request / Flow | Method | Auth State | Expected Result | Verified Status |
|---|---|---|---|---|
| `GET /overview` | GET | Unauthenticated | HTTP 307 Redirect to `/login?redirect=%2Foverview` | PASS |
| `GET /api/members` | GET | Unauthenticated | HTTP 401 Unauthorized | PASS |
| `POST /api/auth/login` (backdoor) | POST | Anonymous | HTTP 401 Unauthorized (`Swapnil@123` blocked) | PASS |
| `POST /api/auth/login` (5 bad attempts) | POST | Anonymous | HTTP 429 (`Retry-After: 900`, persists on restart) | PASS |
| `POST /api/whatsapp/send` | POST | Unauthenticated | HTTP 401 Unauthorized | PASS |
| `POST /api/whatsapp/send` | POST | Member Token | HTTP 403 Forbidden | PASS |
| `GET /api/whatsapp/webhook` | GET | Valid Token | HTTP 200 with challenge echo | PASS |
| `POST /api/whatsapp/webhook` | POST | Invalid HMAC | HTTP 401 Unauthorized | PASS |
| `POST /api/razorpay/create-order` | POST | Forged Amount | Uses server invoice amount strictly | PASS |
| `POST /api/razorpay/verify-payment` | POST | Tampered Amount | HTTP 400 Bad Request + Security Audit Log | PASS |
| `GET /api/revenue` | GET | Trainer Token | HTTP 403 Forbidden | PASS |
| `GET /api/revenue` | GET | Owner Token | HTTP 200 OK | PASS |
| `GET /api/members/export` | GET | Authorized User | HTTP 200 (1st–3rd), HTTP 429 (4th hit/hr) | PASS |
| `GET /login` (Headers) | HEAD | Anonymous | CSP with zero `https:` wildcards, no `unsafe-eval` | PASS |

---

## 5. Deployment Readiness

All 10 defects are formally closed. The codebase is clean, typechecked, test-verified, and production-ready for deployment to Vercel and Supabase.
