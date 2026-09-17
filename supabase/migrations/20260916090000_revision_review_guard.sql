-- Submissions must enter review; even an authenticated REST client cannot
-- insert an already approved revision or impersonate a reviewer.
DROP POLICY IF EXISTS "Authenticated can submit revisions" ON public.entry_revisions;
DROP POLICY IF EXISTS "Authenticated can submit pending revisions" ON public.entry_revisions;
CREATE POLICY "Authenticated can submit pending revisions"
ON public.entry_revisions FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = author_id
  AND status = 'pending'
  AND reviewer_id IS NULL
  AND reviewed_at IS NULL
  AND reviewer_notes IS NULL
);

DROP POLICY IF EXISTS "Authors edit own pending" ON public.entry_revisions;
CREATE POLICY "Authors edit own pending" ON public.entry_revisions
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = author_id AND status = 'pending')
WITH CHECK ((SELECT auth.uid()) = author_id AND status = 'pending'
  AND reviewer_id IS NULL AND reviewed_at IS NULL AND reviewer_notes IS NULL);

-- Preserve authorship/history and derive review attribution on the server.
CREATE OR REPLACE FUNCTION public.guard_revision_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.author_id IS DISTINCT FROM OLD.author_id
    OR NEW.entry_slug IS DISTINCT FROM OLD.entry_slug
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Revision identity and authorship are immutable';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.is_editor_or_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only editors can review revisions';
    END IF;
    NEW.reviewer_id := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_revision_review ON public.entry_revisions;
CREATE TRIGGER guard_revision_review BEFORE UPDATE ON public.entry_revisions
FOR EACH ROW EXECUTE FUNCTION public.guard_revision_review();

CREATE INDEX IF NOT EXISTS idx_revisions_public_created
ON public.entry_revisions (created_at DESC, id DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_revisions_author_status
ON public.entry_revisions (author_id, status);
CREATE INDEX IF NOT EXISTS idx_talk_slug_created
ON public.entry_talk (entry_slug, created_at DESC);
