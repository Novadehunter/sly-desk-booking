-- Fix security vulnerability: Restrict profile access to authenticated users only
-- Remove the overly permissive policy that allows public access
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create a new policy that only allows authenticated users to view profiles
-- Users can view all profiles but only when authenticated (prevents public harvesting)
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Optional: If you want even stricter access (users can only see their own profile)
-- Uncomment the policy below and comment out the one above
-- CREATE POLICY "Users can view their own profile only" 
-- ON public.profiles 
-- FOR SELECT 
-- TO authenticated
-- USING (auth.uid() = user_id);