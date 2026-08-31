# DNA 360 Security Architecture & Role Matrix

## 1. Authentication & Session Architecture

- **Server-Side Enforcement**: All application pages (`/(app)/*`) and data endpoints (`/api/*`) require a signed, server-validated session cookie (`dna360_session`). Unauthenticated requests are intercepted at the server via Next.js Middleware and redirected (`307 Temporary Redirect`) to `/login?redirect=[path]` or returned `401 Unauthorized` for API routes.
- **Cookie Security**: Issued with `HttpOnly; Secure; SameSite=Lax; Path=/` and a 12-hour idle expiration.
- **Brute Force & Lockout Protection**: Monitored via sliding window; 5 consecutive failed login attempts trigger an automatic 15-minute account lockout (`HTTP 429 Too Many Requests`).
- **Session Rotation & Destruction**: Session IDs rotate upon authentication. Invoking `/api/auth/logout` explicitly deletes the server session record and clears the cookie.

---

## 2. Role-Based Access Control (RBAC) & Capability Matrix

| Role | Members Access | Revenue & Financials | Classes & Timetable | Leads & CRM | Exports | Settings & Roles |
|---|---|---|---|---|---|---|
| **Owner / Executive (`OWNER`)** | Full Directory (`members.view.all`) | Unrestricted (`revenue.view`) | Full (`classes.manage.all`) | Full (`leads.manage`) | **All Exports** (`members.export`, `billing.export`) | Full (`settings.manage`, `roles.assign`) |
| **HR Head (`HR_HEAD`)** | Staff & Self-Service | Unrestricted (`revenue.view`) | Self-Service | None | None | None |
| **Marketing Head (`MARKETING_HEAD`)** | Full Directory (`members.view.all`) | Unrestricted (`revenue.view`) | Self-Service | Full (`leads.manage`, `campaigns.manage`) | None | None |
| **Sales Head (`SALES_HEAD`)** | Full Directory (`members.view.all`) | Unrestricted (`revenue.view`) | Booking View | Full (`leads.manage`) | None | None |
| **Head Trainer (`HEAD_TRAINER`)** | Full Directory (`members.view.all`) | **LOCKED** (403 Forbidden) | Full (`classes.manage.all`) | None | None | None |
| **General Trainer (`TRAINER`)** | **Assigned Clients Only** (`members.view.own`) | **LOCKED** (403 Forbidden) | Assigned Sessions (`classes.manage.own`) | None | **LOCKED** (403 Forbidden) | None |
| **Fitness Consultant (`FITNESS_CONSULTANT`)** | Full Directory (`members.view.all`) | **LOCKED** (403 Forbidden) | Booking View | Full (`leads.manage`) | **LOCKED** (403 Forbidden) | None |
| **Supervisor (`SUPERVISOR`)** | Check-in & Gate View | **LOCKED** (403 Forbidden) | Self-Service | None | None | None |
| **Masseur (`MASSEUR`)** | Assigned Clients Only | **LOCKED** (403 Forbidden) | Therapy Bookings | None | None | None |
| **Employee (`EMPLOYEE`)** | Self-Service | **LOCKED** (403 Forbidden) | Self-Service | None | None | None |
| **Member (`MEMBER`)** | Self Portal Only | **LOCKED** (403 Forbidden) | Member Booking | None | None | None |

---

## 3. Data Protection & PII Masking

- **List-View Phone Masking**: Member directory payloads mask contact numbers by default (`+91 ••••• •1234`).
- **Explicit PII Reveal Audit**: Unmasking a contact number requires a dedicated call to `/api/members/[id]/reveal-phone`, which writes an immutable record to the audit trail.
- **Server-Side Pagination**: Directory queries are paginated on the server (default 20 records) to prevent full-database dumping in initial payloads.

---

## 4. Export Controls & Rate Limiting

- **Restricted Access**: Full member list exports (`/api/members/export`) and GSTR-1 returns (`/api/billing/export-gstr1`) are restricted to the `OWNER` role (`members.export` / `billing.export`).
- **Rate Limit**: Enforced to a maximum of **3 exports per hour** per user.
- **Audit Logging**: Every export records the timestamp, user ID, user IP/session, entity type, and row count in the system audit log.

---

## 5. Defense-in-Depth Security Headers

Applied across all HTTP responses:
- `X-Robots-Tag`: `noindex, nofollow, noarchive, nosnippet`
- `X-Frame-Options`: `DENY` (Clickjacking defense)
- `X-Content-Type-Options`: `nosniff` (MIME sniffing defense)
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy`: Default `'self'` with restricted script, style, and font origins
- `robots.txt`: Explicit Disallow rules for all internal and administrative routes
