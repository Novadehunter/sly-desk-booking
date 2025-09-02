-- Fix security issue: Restrict profile access and create secure function for posts
-- Step 1: Update profiles table to only allow users to see their own profile
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can only view their own profile (protects sensitive data like email, avatar_url)
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Step 2: Create a security definer function to get safe profile data for posts
CREATE OR REPLACE FUNCTION public.get_public_profile_data(user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  display_name text,
  department text
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.display_name,
    p.department
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile_data TO authenticated;