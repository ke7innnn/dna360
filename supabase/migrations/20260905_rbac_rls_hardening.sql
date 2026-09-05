-- ==============================================================================
-- DNA 360 — Supabase Postgres Row-Level Security (RLS) & RBAC Hardening
-- Migration: 20260905_rbac_rls_hardening.sql
-- Single Source of Truth for Database-Level Access Boundaries
-- ==============================================================================

-- 1. Helper function to extract user role from JWT claims
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    ''
  );
$$;

-- 2. Helper functions for role capabilities
CREATE OR REPLACE FUNCTION public.is_owner_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_user_role() IN ('owner_admin', 'OWNER', 'owner');
$$;

CREATE OR REPLACE FUNCTION public.is_head_trainer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_user_role() IN ('head_trainer', 'HEAD_TRAINER');
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_trainer_for_member(p_member_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "MemberProgram"
    WHERE "memberId" = p_member_id
      AND "trainerId" = auth.uid()::text
      AND "status" = 'ACTIVE'
  );
$$;

-- ==============================================================================
-- 3. Enable RLS on all Training & Member Health Tables
-- ==============================================================================
ALTER TABLE IF EXISTS "MemberProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "MemberProgramRevision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WorkoutSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SessionExercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SetLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BodyMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CoachNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "FormCheck" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. MemberProgram Policies
-- ==============================================================================
DROP POLICY IF EXISTS "member_program_select_policy" ON "MemberProgram";
CREATE POLICY "member_program_select_policy" ON "MemberProgram"
  FOR SELECT
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR "trainerId" = auth.uid()::text
  );

DROP POLICY IF EXISTS "member_program_modify_policy" ON "MemberProgram";
CREATE POLICY "member_program_modify_policy" ON "MemberProgram"
  FOR ALL
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "trainerId" = auth.uid()::text
    OR ("memberId" = auth.uid()::text AND "coachingMode" = 'SELF_COACHED')
  )
  WITH CHECK (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "trainerId" = auth.uid()::text
    OR ("memberId" = auth.uid()::text AND "coachingMode" = 'SELF_COACHED')
  );

-- ==============================================================================
-- 5. WorkoutSession Policies
-- ==============================================================================
DROP POLICY IF EXISTS "workout_session_select_policy" ON "WorkoutSession";
CREATE POLICY "workout_session_select_policy" ON "WorkoutSession"
  FOR SELECT
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR public.is_assigned_trainer_for_member("memberId")
  );

DROP POLICY IF EXISTS "workout_session_modify_policy" ON "WorkoutSession";
CREATE POLICY "workout_session_modify_policy" ON "WorkoutSession"
  FOR ALL
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR public.is_assigned_trainer_for_member("memberId")
  )
  WITH CHECK (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR public.is_assigned_trainer_for_member("memberId")
  );

-- ==============================================================================
-- 6. SessionExercise & SetLog Policies
-- ==============================================================================
DROP POLICY IF EXISTS "session_exercise_select_policy" ON "SessionExercise";
CREATE POLICY "session_exercise_select_policy" ON "SessionExercise"
  FOR SELECT
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR EXISTS (
      SELECT 1 FROM "WorkoutSession" ws
      WHERE ws.id = "SessionExercise"."sessionId"
        AND (ws."memberId" = auth.uid()::text OR public.is_assigned_trainer_for_member(ws."memberId"))
    )
  );

DROP POLICY IF EXISTS "set_log_select_policy" ON "SetLog";
CREATE POLICY "set_log_select_policy" ON "SetLog"
  FOR SELECT
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR EXISTS (
      SELECT 1 FROM "SessionExercise" se
      JOIN "WorkoutSession" ws ON ws.id = se."sessionId"
      WHERE se.id = "SetLog"."sessionExerciseId"
        AND (ws."memberId" = auth.uid()::text OR public.is_assigned_trainer_for_member(ws."memberId"))
    )
  );

DROP POLICY IF EXISTS "set_log_modify_policy" ON "SetLog";
CREATE POLICY "set_log_modify_policy" ON "SetLog"
  FOR ALL
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR EXISTS (
      SELECT 1 FROM "SessionExercise" se
      JOIN "WorkoutSession" ws ON ws.id = se."sessionId"
      WHERE se.id = "SetLog"."sessionExerciseId"
        AND (ws."memberId" = auth.uid()::text OR public.is_assigned_trainer_for_member(ws."memberId"))
    )
  )
  WITH CHECK (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR EXISTS (
      SELECT 1 FROM "SessionExercise" se
      JOIN "WorkoutSession" ws ON ws.id = se."sessionId"
      WHERE se.id = "SetLog"."sessionExerciseId"
        AND (ws."memberId" = auth.uid()::text OR public.is_assigned_trainer_for_member(ws."memberId"))
    )
  );

-- ==============================================================================
-- 7. BodyMetric Policies (HIPAA / Privacy Protected)
-- ==============================================================================
DROP POLICY IF EXISTS "body_metric_select_policy" ON "BodyMetric";
CREATE POLICY "body_metric_select_policy" ON "BodyMetric"
  FOR SELECT
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR public.is_assigned_trainer_for_member("memberId")
  );

DROP POLICY IF EXISTS "body_metric_insert_policy" ON "BodyMetric";
CREATE POLICY "body_metric_insert_policy" ON "BodyMetric"
  FOR INSERT
  WITH CHECK (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR public.is_assigned_trainer_for_member("memberId")
  );

-- ==============================================================================
-- 8. CoachNote Policies (Internal Trainer Notes vs Shared Notes)
-- ==============================================================================
DROP POLICY IF EXISTS "coach_note_select_policy" ON "CoachNote";
CREATE POLICY "coach_note_select_policy" ON "CoachNote"
  FOR SELECT
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "authorId" = auth.uid()::text
    OR ("memberId" = auth.uid()::text AND "readAt" IS NOT NULL)
    OR public.is_assigned_trainer_for_member("memberId")
  );

DROP POLICY IF EXISTS "coach_note_modify_policy" ON "CoachNote";
CREATE POLICY "coach_note_modify_policy" ON "CoachNote"
  FOR ALL
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "authorId" = auth.uid()::text
  )
  WITH CHECK (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "authorId" = auth.uid()::text
  );

-- ==============================================================================
-- 9. FormCheck Policies (Video Assessments)
-- ==============================================================================
DROP POLICY IF EXISTS "form_check_select_policy" ON "FormCheck";
CREATE POLICY "form_check_select_policy" ON "FormCheck"
  FOR SELECT
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR "trainerId" = auth.uid()::text
  );

DROP POLICY IF EXISTS "form_check_modify_policy" ON "FormCheck";
CREATE POLICY "form_check_modify_policy" ON "FormCheck"
  FOR ALL
  USING (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR "trainerId" = auth.uid()::text
  )
  WITH CHECK (
    public.is_owner_or_admin()
    OR public.is_head_trainer()
    OR "memberId" = auth.uid()::text
    OR "trainerId" = auth.uid()::text
  );
