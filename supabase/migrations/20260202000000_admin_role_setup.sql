-- Migration: Admin Role Setup
-- Sets up admin role management for the application

-- Create a function to set admin role for a user by email
-- This can be called from the Supabase dashboard SQL editor
CREATE OR REPLACE FUNCTION set_admin_role(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to remove admin role from a user
CREATE OR REPLACE FUNCTION remove_admin_role(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data - 'role'
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to list all admin users (for dashboard visibility)
CREATE OR REPLACE VIEW admin_users AS
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_app_meta_data->>'role' as role
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'admin';

-- Grant access to the functions (service role only)
REVOKE ALL ON FUNCTION set_admin_role(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION remove_admin_role(TEXT) FROM PUBLIC;

-- Example usage (run in Supabase SQL editor to make a user admin):
-- SELECT set_admin_role('admin@airenodemo.com');

-- To remove admin role:
-- SELECT remove_admin_role('admin@airenodemo.com');

-- To list all admins:
-- SELECT * FROM admin_users;
