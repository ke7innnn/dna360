-- ============================================================
-- DNA 360 Security Remediation — Phase 5: Rate Limiting & Cleanup
-- Routine deleting rate_limit_events older than 24h and expired/revoked sessions older than 30d
-- ============================================================

-- Stored procedure for automated database maintenance
create or replace function cleanup_stale_security_records()
returns jsonb
language plpgsql
security definer
as $$
declare
  events_count int;
  sessions_count int;
  attempts_count int;
begin
  -- 1. Delete rate limit events older than 24 hours
  with deleted as (
    delete from rate_limit_events
    where occurred_at < now() - interval '24 hours'
    returning id
  )
  select count(*) into events_count from deleted;

  -- 2. Delete expired or revoked auth sessions older than 30 days
  with deleted as (
    delete from auth_sessions
    where (expires_at < now() - interval '30 days')
       or (revoked_at is not null and revoked_at < now() - interval '30 days')
    returning id
  )
  select count(*) into sessions_count from deleted;

  -- 3. Delete cleared or expired login lockout attempts older than 24 hours
  with deleted as (
    delete from login_attempts
    where locked_until is not null and locked_until < now() - interval '24 hours'
    returning identifier
  )
  select count(*) into attempts_count from deleted;

  return jsonb_build_object(
    'deleted_events', events_count,
    'deleted_sessions', sessions_count,
    'deleted_attempts', attempts_count,
    'executed_at', now()
  );
end;
$$;

-- Note for Cron / Scheduled Job:
-- Call via Supabase pg_cron:
-- select cron.schedule('cleanup-security-records', '0 3 * * *', 'select cleanup_stale_security_records();');
