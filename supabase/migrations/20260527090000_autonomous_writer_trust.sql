-- Self-service contributors are promoted only from revisions approved by a trusted editor.
CREATE OR REPLACE FUNCTION public.auto_promote_user(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  SELECT count(*) INTO approved_count
  FROM public.entry_revisions
  WHERE author_id = _user_id AND status = 'approved';

  UPDATE public.profiles
  SET contributions_count = approved_count,
      updated_at = now()
  WHERE id = _user_id;

  IF approved_count >= 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'new_writer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF approved_count >= 10 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'veteran_writer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_writer_trust_after_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.auto_promote_user(NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_revision_reviewed_sync_writer_trust ON public.entry_revisions;
CREATE TRIGGER on_revision_reviewed_sync_writer_trust
  AFTER UPDATE OF status ON public.entry_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_writer_trust_after_review();

-- A contributor may edit public profile text, but never their trusted contribution count.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, bio, avatar_url) ON public.profiles TO authenticated;

-- Promotion is an internal consequence of review, never a client-callable action.
REVOKE EXECUTE ON FUNCTION public.auto_promote_user(UUID) FROM PUBLIC, anon, authenticated;

-- Bring existing profiles and ranks in line with revisions already approved.
DO $$
DECLARE
  profile RECORD;
BEGIN
  FOR profile IN SELECT id FROM public.profiles LOOP
    PERFORM public.auto_promote_user(profile.id);
  END LOOP;
END;
$$;
