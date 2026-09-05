# DNA 360 Security Architecture & Role-Based Access Control (RBAC)

## 1. Authentication & Session Security Architecture

- **Server-Side Enforcement**: All application pages (`/(app)/*`) and data endpoints (`/api/*`) require a signed, server-validated session cookie (`dna360_session`). Unauthenticated requests are intercepted at the server via Next.js Middleware and redirected (`307 Temporary Redirect`) to `/login?redirect=[path]` or returned `401 Unauthorized` for API routes.
- **Cookie Security**: Issued with `HttpOnly; Secure; SameSite=Lax; Path=/` and a 12-hour idle expiration.
- **Brute Force & Lockout Protection**: Monitored via sliding window; 5 consecutive failed login attempts trigger an automatic 15-minute account lockout (`HTTP 429 Too Many Requests`) with generic error messages preventing user enumeration.
- **Mandatory Password Change**: Any account provisioned with `must_change_password: true` is intercepted at the edge middleware and redirected to `/change-password`. All protected routes and mutation APIs are blocked until the user sets a compliant password.
- **Password Complexity Rules**: Minimum 10 characters, at least one uppercase letter, one lowercase letter, one numeric digit, and one special character (`!@#$%^&*()_+\-=[\]{}|;:,.<>?`).
- **Session Rotation & Destruction**: Session IDs rotate upon authentication. Invoking `/api/auth/logout` explicitly destroys the server session record and clears the cookie.

---

## 2. Canonical Role-Based Access Control (RBAC) & Access Matrix

The system implements 9 canonical staff roles plus `member`. All revenue and financial analytics endpoints are strictly quarantined to `owner_admin`.

| Canonical Role | Slug | Member Directory Scope | Revenue & Financials (`/api/revenue`) | Personal Training Clients | Exports & GSTR-1 | Turnstile / Gates |
|---|---|---|---|---|---|---|
| **Owner / Executive** | `owner_admin` | Full Directory (`members.view.all`) | **Full Access** (`revenue.view`) | All Clients | Allowed (`members.export`, `billing.export`) | All Gates |
| **HR Head** | `hr_head` | Staff Only (`staff.view`) | **403 Forbidden** | None | Denied | None |
| **Sales Head** | `sales_head` | Full Directory (`members.view.all`) | **403 Forbidden** | None | Denied | Gate 1 |
| **Sales Consultant** | `sales_consultant` | Full Directory (`members.view.all`) | **403 Forbidden** | None | Denied | Gate 1 |
| **Front Desk** | `front_desk` | Full Directory (`members.view.all`) | **403 Forbidden** | None | Denied | All Gates |
| **Supervisor** | `supervisor` | Check-in Logs (`checkin.view`) | **403 Forbidden** | None | Denied | All Gates |
| **Head Trainer** | `head_trainer` | Full Directory (`members.view.all`) | **403 Forbidden** | Department-Wide | Denied | Gate View |
| **General Trainer** | `general_trainer` | Assigned PT Only (`members.view.own`) | **403 Forbidden** | **Assigned Clients Only (IDOR Protected)** | Denied | Gate View |
| **Masseur** | `masseur` | Assigned Only (`members.view.own`) | **403 Forbidden** | Spa / Therapy Only | Denied | Gate View |
| **Member** | `member` | Self Portal Only (`portal.access`) | **403 Forbidden** | Self Only | Denied | Turnstile Pass |

---

## 3. Personal Training Data Boundaries (IDOR Defense)

- **Trainer Client Scoping (`/api/training/trainer/clients/[id]`)**: General trainers cannot inspect or alter training data for clients not directly assigned to their roster. Cross-trainer access attempts are intercepted on the server and return `HTTP 403 Forbidden`.
- **Database Row-Level Security (RLS)**: Supabase Postgres policies enforce that `MemberProgram`, `WorkoutSession`, `CoachNote`, and `BodyMetric` tables enforce checks on `auth.uid() = trainerId` or `auth.uid() = memberId`, with administrative bypass exclusively for `owner_admin` and `head_trainer`.

---

## 4. Optical Turnstile & QR Anti-Fraud Engine

- **Dynamic Rolling TOTP**: QR badges rotate every 30 seconds with client-side seed timestamp.
- **Strict Expiry (90-second window)**: Dynamic QR passes older than 90 seconds are rejected with `EXPIRED_TOKEN` (`HTTP 400`).
- **Replay Attack Defense**: Consumed QR seeds are cataloged in an in-memory cache; repeated scans within the token validity window are blocked with `REPLAY_DETECTED`.
- **Scanner Brute-Force Rate Limiting**: 5 consecutive invalid scans within 60 seconds trigger an automated 30-second hardware cooldown lock (`SCANNER_COOLDOWN`).

---

## 5. Data Protection & Export Governance

- **Phone Number Masking**: Member directory listings mask contact details (`+91 ••••• •1234`).
- **Audit Logging**: Any PII unmasking, member export, or GSTR-1 generation writes an immutable audit record containing actor ID, role, client IP, and entity ID.
- **Export Rate Limits**: Maximum 3 member exports per hour per authorized user (`HTTP 429` on violation).

---

## 6. HTTP Defense-in-Depth Headers

Applied across all HTTP responses:
- `X-Robots-Tag`: `noindex, nofollow, noarchive, nosnippet`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy`: Default `'self'` with restricted script, style, and font origins
