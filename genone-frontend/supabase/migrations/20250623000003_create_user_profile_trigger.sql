-- Migration 003: Enhanced auto-profile creation trigger for admin-provisioned users
-- This migration creates a robust trigger system that automatically creates profiles
-- when administrators add users via the Supabase Authentication dashboard

-- Enhanced function for automatic profile creation with comprehensive error handling
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
  extracted_name TEXT;
BEGIN
  -- Get default 'user' role ID with validation
  SELECT id INTO default_role_id 
  FROM public.roles 
  WHERE name = 'user' 
  LIMIT 1;
  
  -- Ensure default role exists (critical for admin-provisioned system)
  IF default_role_id IS NULL THEN
    RAISE EXCEPTION 'Default user role not found. Database setup incomplete. Please ensure roles table has been populated.';
  END IF;
  
  -- Extract name intelligently from metadata or email
  -- Priority: full_name > name > email prefix
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1) -- Use email prefix as fallback
  );
  
  -- Create profile with default role (admin-provisioned users are immediately active)
  INSERT INTO public.profiles (id, email, full_name, role_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    extracted_name,
    default_role_id,
    true -- Admin-created users are immediately active
  );
  
  -- Log successful profile creation for admin audit trail
  RAISE LOG 'Profile successfully created for admin-provisioned user: % (ID: %), assigned role: %', 
    NEW.email, NEW.id, default_role_id;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle case where profile already exists (shouldn't happen but safety net)
    RAISE LOG 'Profile creation skipped for user % (ID: %) - profile already exists', NEW.email, NEW.id;
    RETURN NEW;
  WHEN foreign_key_violation THEN
    -- Handle case where role reference fails
    RAISE LOG 'Profile creation failed for user % (ID: %) - invalid role reference: %', NEW.email, NEW.id, SQLERRM;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors but don't fail user creation (admin can fix manually)
    RAISE LOG 'Profile creation failed for user % (ID: %) with error: %', NEW.email, NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for migration safety)
DROP TRIGGER IF EXISTS create_user_profile ON auth.users;

-- Create trigger on auth.users insert (fires when admin creates user via dashboard)
CREATE TRIGGER create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Add helpful comments for documentation
COMMENT ON FUNCTION create_profile_for_new_user() IS 'Automatically creates user profile when admin adds user via Supabase dashboard. Includes robust error handling and audit logging.';

-- Grant necessary permissions for the trigger function to work properly
-- Note: SECURITY DEFINER ensures function runs with creator's privileges 