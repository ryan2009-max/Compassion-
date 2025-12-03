-- Confirm the email for the existing admin user
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'ryanianotieno@gmail.com' AND email_confirmed_at IS NULL;