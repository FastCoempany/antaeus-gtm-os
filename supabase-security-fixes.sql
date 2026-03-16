-- ============================================================
-- Supabase Security Advisor Fixes
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: RUN THIS FIRST to see your current view definitions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT viewname, definition
FROM pg_views
WHERE viewname IN ('discovery_analytics', 'top_worked_items')
  AND schemaname = 'public';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: THEN run these fixes (one block at a time is safest)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─── FIX 1 & 2: Security Definer Views ──────────────────────
-- Error: Views use SECURITY DEFINER, bypassing RLS for the 
-- querying user. Fix: toggle to SECURITY INVOKER.
--
-- This uses ALTER VIEW (Postgres 15+) which Supabase supports.
-- No need to drop/recreate — just flips the flag.

ALTER VIEW public.discovery_analytics SET (security_invoker = true);
ALTER VIEW public.top_worked_items SET (security_invoker = true);

-- ─── FIX 3: Function Search Path Mutable ────────────────────
-- Warning: update_updated_at_column has no search_path set.
-- An attacker could hijack the function by manipulating 
-- search_path. Fix: pin it to 'public'.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ─── FIX 4: Leaked Password Protection ──────────────────────
-- This is a UI toggle, not SQL. Go to:
--   Authentication → Settings (gear icon) → Password Protection
--   Toggle ON: "Enable Leaked Password Protection"
--
-- Checks new passwords against HaveIBeenPwned on signup/change.
-- Zero downside, just flip it on.

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: VERIFY — after running, click Refresh in Security
-- Advisor. Should show 0 errors, 0 warnings (or 1 if you 
-- haven't toggled the password protection in the UI yet).
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

