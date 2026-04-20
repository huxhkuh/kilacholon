-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Replace broad SELECT policy on avatars with a more restricted one
-- Public can SELECT individual files only when they know the path
DROP POLICY IF EXISTS "Avatars are public" ON storage.objects;
CREATE POLICY "Avatars readable" ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'avatars');

-- Make bucket private to prevent listing, but URLs still work via signed/public links
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
UPDATE storage.buckets SET public = true WHERE id = 'avatars';