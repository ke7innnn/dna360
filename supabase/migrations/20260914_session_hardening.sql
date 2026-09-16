-- ==============================================================================
-- DNA 360 — Session Hardening, Login Attempts & Durable Rate Limiting
-- Migration: 20260914_session_hardening.sql
-- ==============================================================================

create table if not exists auth_sessions (
  id                   uuid primary key default gen_random_uuid(),
  token_hash           text not null unique,
  user_id              text not null,
  user_type            text not null check (user_type in ('STAFF','MEMBER')),
  role_slug            text not null,
  must_change_password boolean not null default false,
  created_at           timestamptz not null default now(),
  last_active_at       timestamptz not null default now(),
  expires_at           timestamptz not null,
  revoked_at           timestamptz,
  ip                   text,
  user_agent           text
);

create index if not exists idx_auth_sessions_token on auth_sessions(token_hash);
create index if not exists idx_auth_sessions_user on auth_sessions(user_id);

create table if not exists login_attempts (
  identifier       text primary key,
  attempts         int not null default 0,
  first_attempt_at timestamptz not null default now(),
  locked_until     timestamptz
);

create table if not exists rate_limit_events (
  id          bigserial primary key,
  bucket_key  text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_bucket on rate_limit_events(bucket_key, occurred_at);

alter table auth_sessions enable row level security;
alter table login_attempts enable row level security;
alter table rate_limit_events enable row level security;
-- service-role only; no anon policies
