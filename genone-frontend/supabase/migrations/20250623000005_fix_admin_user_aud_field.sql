-- Migration: Fix admin-created user aud field
-- This migration creates a trigger that automatically corrects the aud field
-- for users created via the Supabase Admin Dashboard, allowing them to log in normally.
--
-- Issue: When users are created through the Supabase Dashboard Authentication tab,
-- they get aud = "https://project.supabase.co/auth/v1/admin/users" instead of "authenticated"
-- This prevents them from logging in via normal authentication flows.
--
-- Solution: Automatically convert admin aud to "authenticated" on user creation.

-- =============================================================================
-- CREATE FUNCTION TO FIX AUD FIELD (in public schema due to auth schema restrictions)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fix_admin_created_user_aud()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user was created with admin aud and fix it
  IF NEW.aud LIKE '%/auth/v1/admin/users%' THEN
    NEW.aud := 'authenticated';
    
    -- Log the fix for debugging purposes
    RAISE NOTICE 'Fixed aud field for admin-created user: % (email: %)', NEW.id, NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CREATE TRIGGER ON auth.users TABLE
-- =============================================================================

CREATE TRIGGER fix_admin_user_aud_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fix_admin_created_user_aud();

-- =============================================================================
-- COMMENT FOR DOCUMENTATION (only on function we own)
-- =============================================================================

COMMENT ON FUNCTION public.fix_admin_created_user_aud() IS 
'Automatically fixes the aud field for users created via Supabase Admin Dashboard. 
Converts admin aud URLs to "authenticated" to allow normal login flows.';

-- Note: Cannot add comments to auth.users triggers due to ownership restrictions
-- Trigger: fix_admin_user_aud_trigger ensures admin-created users can log in normally

-- =============================================================================
-- FIX EXISTING USERS (ONE-TIME CLEANUP)
-- =============================================================================

-- Fix any existing users that might have the wrong aud field
UPDATE auth.users 
SET 
    aud = 'authenticated',
    updated_at = NOW()
WHERE aud LIKE '%/auth/v1/admin/users%';

-- Log how many users were fixed
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    IF fixed_count > 0 THEN
        RAISE NOTICE 'Fixed aud field for % existing admin-created users', fixed_count;
    ELSE
        RAISE NOTICE 'No existing users needed aud field fixes';
    END IF;
END $$; 