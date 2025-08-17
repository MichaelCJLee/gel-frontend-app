-- Migration 002: Create profiles table with enhanced security for admin-provisioned users
-- This migration creates the user profile system linked to Supabase auth.users

-- Create profiles table with enhanced constraints and admin management fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE, -- Ensure email uniqueness across profiles
  full_name TEXT,
  role_id UUID REFERENCES public.roles(id) NOT NULL,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true, -- For admin to enable/disable users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance on frequent queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Create updated_at trigger for profiles table (reuse function from migration 001)
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (policies will be defined in later migration)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add helpful comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles for GenOne admin-provisioned authentication system';
COMMENT ON COLUMN public.profiles.id IS 'UUID that matches auth.users.id via foreign key';
COMMENT ON COLUMN public.profiles.role_id IS 'Reference to roles table for role-based access control';
COMMENT ON COLUMN public.profiles.is_active IS 'Admin-controlled flag to enable/disable user access';
COMMENT ON COLUMN public.profiles.last_login IS 'Timestamp of users last successful login for auditing'; 