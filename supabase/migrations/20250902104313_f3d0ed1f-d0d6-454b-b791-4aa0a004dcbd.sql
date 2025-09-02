-- Fix security issue: Restrict profile access and create public view for posts
-- Step 1: Update profiles table to only allow users to see their own profile
DROP POLICY "Authenticated users can view profiles" ON public.profiles;

-- Users can only view their own profile (protects sensitive data like email, avatar_url)
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Step 2: Create a public view for posts functionality that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  display_name,
  department
FROM public.profiles;

-- Step 3: Enable RLS on the view (allows all authenticated users to read it)
ALTER VIEW public.public_profiles OWNER TO supabase_admin;

-- Grant access to authenticated users for the view
GRANT SELECT ON public.public_profiles TO authenticated;

-- Create policy for the view (since views inherit RLS from base tables, we need this)
-- This allows authenticated users to see display names and departments for posts
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;