-- Migration 001: Create roles table with comprehensive default roles for admin-provisioned system
-- This migration creates the foundational role system for GenOne authentication

-- Create roles table with enhanced structure for future permissions
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  permissions JSONB DEFAULT '{}', -- For future role-based permissions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles with detailed descriptions
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Administrator with full system access and user management capabilities'),
  ('user', 'Standard user with basic GenOne access and conversation features'),
  ('analyst', 'Business analyst with enhanced reporting and analytics access')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function for roles table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance on role name lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Enable Row Level Security (will be configured in later migration)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON TABLE public.roles IS 'Role definitions for GenOne admin-provisioned authentication system';
COMMENT ON COLUMN public.roles.permissions IS 'JSONB field for future role-based permission system'; 