-- Migration 004: Row Level Security policies with relaxed permissions for development
-- This migration establishes development-friendly data access patterns for the GenOne authentication system
-- NOTE: Security is intentionally relaxed for smooth authentication flow during development

-- =============================================================================
-- RLS POLICIES FOR PROFILES TABLE
-- =============================================================================

-- Policy: Users can view their own profile only
CREATE POLICY "users_can_view_own_profile" 
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile (relaxed for development)
CREATE POLICY "users_can_update_own_profile"
  ON public.profiles  
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Allow profile insert for authenticated users (for development/testing)
CREATE POLICY "allow_authenticated_profile_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Allow profile delete for authenticated users (for development/testing)
CREATE POLICY "allow_authenticated_profile_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Block anonymous access to profiles (basic security)
CREATE POLICY "no_anonymous_access_to_profiles"
  ON public.profiles
  TO anon
  USING (false);

-- =============================================================================
-- RLS POLICIES FOR ROLES TABLE
-- =============================================================================

-- Policy: Authenticated users can read roles (needed for UI role display)
CREATE POLICY "authenticated_users_can_view_roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Block anonymous access to roles (basic security)
CREATE POLICY "no_anonymous_access_to_roles"
  ON public.roles
  TO anon
  USING (false);

-- =============================================================================
-- ADDITIONAL SECURITY MEASURES
-- =============================================================================

-- Grant necessary permissions for authenticated users (development-friendly)
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.roles TO authenticated;

-- =============================================================================
-- DOCUMENTATION AND COMMENTS
-- =============================================================================

-- Add policy documentation (relaxed security for development)
COMMENT ON POLICY "users_can_view_own_profile" ON public.profiles IS 'Allows authenticated users to view only their own profile data';
COMMENT ON POLICY "users_can_update_own_profile" ON public.profiles IS 'Allows users to update their own profile fields (relaxed for development and testing)';
COMMENT ON POLICY "allow_authenticated_profile_insert" ON public.profiles IS 'Allows profile creation for authenticated users (development-friendly)';
COMMENT ON POLICY "allow_authenticated_profile_delete" ON public.profiles IS 'Allows profile deletion for authenticated users (development-friendly)';
COMMENT ON POLICY "authenticated_users_can_view_roles" ON public.roles IS 'Allows authenticated users to read role definitions for UI display (development-friendly)';

-- Add table-level security documentation (relaxed security)
COMMENT ON TABLE public.profiles IS 'RLS enabled: Users can access their own profile data with relaxed permissions for development.';
COMMENT ON TABLE public.roles IS 'RLS enabled: Read access for authenticated users, relaxed for development.'; 