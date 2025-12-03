-- Create test admin users
-- First, we need to manually create these users via Supabase Auth
-- This migration will prepare the admin and role entries

-- For testing, you can create these users through the Add Administrator form:
-- User 1: admin@compassionsafe.com / Password: Admin123!
-- User 2: superadmin@compassionsafe.com / Password: SuperAdmin123!

-- This comment serves as documentation for the test users setup
SELECT 'Please create admin users through the Add Administrator form using valid email domains like @gmail.com, @compassionsafe.com, etc.' as instruction;