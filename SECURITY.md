# DNA 360 Security Architecture & Role-Based Access Control (RBAC)

## 1. Fail-Closed Secret & Credential Architecture

- **Zero Hardcoded Secrets**: All cryptographic secrets, API keys, webhook verify tokens, and payment secrets are strictly loaded via `requireEnv(name, minLength)` from the runtime environment.
- **Fail-Closed Validation**: The application strictly refuses to boot if any required secret is missing or shorter than 32 characters (`min_length: 32`). Zero default fallback strings exist anywhere in production or utility code.
- **Credential Sanitization**: Production credential dumps and automated PDF credential generators have been permanently purged from repository history and build artifacts, and excluded via `.gitignore`.

---

## 2. Authentication & Session Security Architecture

- **Server-Side Enforcement**: All application pages (`/(app)/*`) and protected data endpoints (`/api/*`) require an active, server-validated session cookie (`dna360_session`). Unauthenticated requests are intercepted at the server edge via Next.js Middleware and redirected (`307 Temporary Redirect`) to `/login?redirect=[path]` or returned `401 Unauthorized` for API routes.
- **Durable Session Hashing**: Session tokens are cryptographically secure 256-bit random hex strings (`crypto.randomBytes(32)`). Only the SHA-256 digest (`token_hash`) is stored in the database (`auth_sessions` table) and session cache. Raw tokens are never logged or persisted in plain text.
- **Tampering & Role Claim Protection**: User roles and capabilities are resolved strictly from the persisted database session record. Client-supplied role claims or headers are completely ignored.
- **Session Revocation & Destruction**: Sessions are explicitly revoked in the database upon logout (`/api/auth/logout`) with `revoked_at` timestamp. Revoked sessions immediately yield `401 Unauthorized` and cannot be reused.
- **Cookie Hardening**: Issued with `HttpOnly; Secure; SameSite=Lax; Path=/` and strict expiration timestamps.

---

## 3. Credential & Password Governance

- **Bcrypt Cost-12 Hashing**: All seeded staff and administrative accounts utilize industry-standard bcrypt hashing with cost parameter 12 (`$2b$12$`).
- **Zero Backdoor Passwords**: All legacy master passwords and bypass backdoor branches have been eliminated. Every login request undergoes standard bcrypt verification.
- **Mandatory First-Login Password Change**: Any account provisioned with `must_change_password: true` is intercepted at middleware and restricted to `/change-password` and `/api/auth/change-password`. All application routes and mutation endpoints return `403 Forbidden` (`MUST_CHANGE_PASSWORD`) until a new compliant password is set.
- **Password Reuse Prevention**: `/api/auth/change-password` verifies that the new password does not match the temporary default password.
- **Complexity Enforcement**: Minimum 10 characters, requiring uppercase, lowercase, numeric, and special character classes.

---

## 4. Endpoint Lockdown & Tampering Protection

### WhatsApp Integration
- **Webhook Handshake (GET)**: Enforces fail-closed token match against `requireEnv('WHATSAPP_WEBHOOK_VERIFY_TOKEN')` without fallback defaults.
- **Webhook Verification (POST)**: Validates raw request payload signature (`x-hub-signature-256`) against `requireEnv('WHATSAPP_APP_SECRET')` using constant-time comparison (`crypto.timingSafeEqual`). Requests with absent or invalid signatures are rejected with `401 Unauthorized`.
- **Outbound WhatsApp API (`/api/whatsapp/send`)**:
  - Requires authenticated staff session with explicit `whatsapp.send` capability.
  - Strictly forbidden to member roles (`403 Forbidden`).
  - Enforces pre-approved Meta template catalog (`dna360_welcome_member`, `dna360_payment_receipt`, `dna360_renewal_reminder`, `dna360_pt_session_booked`). Arbitrary free-text messaging is blocked.
  - Rate-limited to 50 messages/hour with PII-masked audit logging.

### Razorpay Payment Security
- **Order Creation (`/api/razorpay/create-order`)**:
  - Requires authenticated session (`401 Unauthorized`).
  - Ignores client-supplied `amountMinor`. The payable amount is calculated strictly from the server-persisted invoice record (`invoiceId`).
  - Rejects attempts on settled or non-owned invoices (`403 Forbidden`).
  - Records an immutable mapping of `orderId -> invoiceId + expectedAmountMinor`.
- **Payment Verification (`/api/razorpay/verify-payment`)**:
  - Verifies payment signature using HMAC SHA-256 with constant-time comparison.
  - Asserts that the captured amount matches the server's `expectedAmountMinor`. Any tampering triggers immediate payment rejection (`400 Bad Request`) and an audit security event.
  - Marks invoice paid and writes an audit log upon verification.

---

## 5. Durable Rate Limiting & Export Governance

- **Durable Storage**: Rate-limit counters and lockout tracking are persisted in `rate_limit_events` / `login_attempts` tables, ensuring rate limits hold across serverless invocations and cold starts.
- **Dual-Keyed Login Lockout**: 5 failed login attempts within 15 minutes trigger an automatic 15-minute account lockout (`HTTP 429 Too Many Requests` with `Retry-After: 900`). Lockout is tracked separately on both account identifier and client IP address to prevent targeted denial-of-service against real accounts.
- **Export Governance**: Sensitive data exports (`/api/members/export`, `/api/billing/export-gstr1`, `/api/training/export`) are strictly capped at 3 requests per hour per user (`HTTP 429` on 4th hit).
- **Mandatory Audit Logging**: All PII reveals and bulk exports record actor ID, role, client IP, and row count in the audit ledger.
- **Database Maintenance**: Scheduled procedure `cleanup_stale_security_records()` purges rate-limit records older than 24 hours and revoked/expired sessions older than 30 days.

---

## 6. Canonical Role-Based Access Control (RBAC) & Access Matrix

The system implements 9 canonical staff roles plus `member`. All revenue and financial analytics endpoints are strictly quarantined to `owner_admin`.

| Canonical Role | Slug | Member Directory Scope | Revenue & Financials (`/api/revenue`) | Personal Training Clients | Exports & GSTR-1 | WhatsApp Send | Turnstile / Gates |
|---|---|---|---|---|---|---|---|
| **Owner / Executive** | `owner_admin` | Full Directory (`members.view.all`) | **Full Access** (`revenue.view`) | All Clients | Allowed (`members.export`, `billing.export`) | Allowed | All Gates |
| **HR Head** | `hr_head` | Staff Only (`staff.view`) | **403 Forbidden** | None | Denied | Denied | None |
| **Sales Head** | `sales_head` | Full Directory (`members.view.all`) | **403 Forbidden** | None | Denied | Allowed | Gate 1 |
| **Sales Consultant** | `sales_consultant` | Full Directory (`members.view.all`) | **403 Forbidden** | None | Denied | Allowed | Gate 1 |
| **Front Desk** | `front_desk` | Full Directory (`members.view.all`) | **403 Forbidden** | None | Denied | Allowed | All Gates |
| **Supervisor** | `supervisor` | Check-in Logs (`checkin.view`) | **403 Forbidden** | None | Denied | Denied | All Gates |
| **Head Trainer** | `head_trainer` | Full Directory (`members.view.all`) | **403 Forbidden** | Department-Wide | Denied | Denied | Gate View |
| **General Trainer** | `general_trainer` | Assigned PT Only (`members.view.own`) | **403 Forbidden** | **Assigned Clients Only (IDOR Protected)** | Denied | Denied | Gate View |
| **Masseur** | `masseur` | Assigned Only (`members.view.own`) | **403 Forbidden** | Spa / Therapy Only | Denied | Denied | Gate View |
| **Member** | `member` | Self Portal Only (`portal.access`) | **403 Forbidden** | Self Only | Denied | Denied | Turnstile Pass |

---

## 7. Personal Training Data Boundaries (IDOR Defense)

- **Trainer Client Scoping (`/api/training/trainer/clients/[id]`)**: General trainers cannot inspect or alter training data for clients not directly assigned to their roster. Cross-trainer access attempts are intercepted on the server and return `HTTP 403 Forbidden`.
- **Database Row-Level Security (RLS)**: Supabase Postgres policies enforce checks on `auth.uid() = trainerId` or `auth.uid() = memberId`, with administrative bypass exclusively for `owner_admin` and `head_trainer`.

---

## 8. Optical Turnstile & QR Anti-Fraud Engine

- **Dynamic Rolling TOTP**: QR badges rotate every 30 seconds with client-side seed timestamp.
- **Strict Expiry (90-second window)**: Dynamic QR passes older than 90 seconds are rejected with `EXPIRED_TOKEN` (`HTTP 400`).
- **Replay Attack Defense**: Consumed QR seeds are cataloged; repeated scans within the token validity window are blocked with `REPLAY_DETECTED`.
- **Scanner Brute-Force Rate Limiting**: 5 consecutive invalid scans within 60 seconds trigger an automated 30-second hardware cooldown lock (`SCANNER_COOLDOWN`).

---

## 9. Transport & Content-Security Policy (CSP)

Defense-in-depth headers applied across all responses via Next.js Middleware:
- `X-Robots-Tag`: `noindex, nofollow, noarchive, nosnippet`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- `X-XSS-Protection`: `1; mode=block`
- `Content-Security-Policy`:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://*.googletagmanager.com` (Zero `'unsafe-eval'`)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com https://checkout.razorpay.com data:`
  - `img-src 'self' data: blob: https://www.dna360.in http://www.dna360.in https://checkout.razorpay.com https://cdn.razorpay.com https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://*.doubleclick.net`
  - `connect-src 'self' https://<supabase-host> wss://<supabase-host> https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net` (Zero bare `https:` wildcards)
  - `media-src 'self' data: blob:` (Zero bare `https:` wildcards)
  - `frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.google.com`
  - `frame-ancestors 'none'`
  - `base-uri 'self'`
  - `form-action 'self'`
