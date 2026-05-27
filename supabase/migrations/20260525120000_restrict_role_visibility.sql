-- Roles are needed by their owner and by administrators, but should not
-- expose every user's permissions publicly.
DROP POLICY IF EXISTS "Roles are public" ON public.user_roles;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Submissions must enter moderation and cannot self-approve through a crafted request.
DROP POLICY IF EXISTS "Authenticated can submit revisions" ON public.entry_revisions;
CREATE POLICY "Authenticated can submit pending revisions" ON public.entry_revisions
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND status = 'pending'
    AND reviewer_id IS NULL
    AND reviewed_at IS NULL
  );

DROP POLICY IF EXISTS "Authors edit own pending" ON public.entry_revisions;
CREATE POLICY "Authors edit own pending" ON public.entry_revisions
  FOR UPDATE
  USING (auth.uid() = author_id AND status = 'pending')
  WITH CHECK (
    auth.uid() = author_id
    AND status = 'pending'
    AND reviewer_id IS NULL
    AND reviewed_at IS NULL
  );
