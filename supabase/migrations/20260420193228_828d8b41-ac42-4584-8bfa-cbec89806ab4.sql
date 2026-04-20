-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('viewer', 'new_writer', 'veteran_writer', 'editor', 'admin');

-- Enum for revision status
CREATE TYPE public.revision_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  contributions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Entry revisions (history)
CREATE TABLE public.entry_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  change_summary TEXT NOT NULL DEFAULT '',
  status revision_status NOT NULL DEFAULT 'pending',
  author_id UUID NOT NULL REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  is_new_entry BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Talk pages
CREATE TABLE public.entry_talk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_slug TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  parent_id UUID REFERENCES public.entry_talk(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security definer function for role checks (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user is at least an editor
CREATE OR REPLACE FUNCTION public.is_editor_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('editor', 'admin')
  )
$$;

-- Auto-create profile + default 'viewer' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-promote based on contributions
CREATE OR REPLACE FUNCTION public.auto_promote_user(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO approved_count
  FROM public.entry_revisions
  WHERE author_id = _user_id AND status = 'approved';

  IF approved_count >= 1 AND NOT public.has_role(_user_id, 'new_writer') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'new_writer')
    ON CONFLICT DO NOTHING;
  END IF;
  IF approved_count >= 10 AND NOT public.has_role(_user_id, 'veteran_writer') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'veteran_writer')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_talk ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Roles are public" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Entry revisions policies
CREATE POLICY "Approved revisions are public" ON public.entry_revisions
  FOR SELECT USING (status = 'approved' OR auth.uid() = author_id OR public.is_editor_or_admin(auth.uid()));
CREATE POLICY "Authenticated can submit revisions" ON public.entry_revisions
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors edit own pending" ON public.entry_revisions
  FOR UPDATE USING (auth.uid() = author_id AND status = 'pending');
CREATE POLICY "Editors manage all revisions" ON public.entry_revisions
  FOR UPDATE USING (public.is_editor_or_admin(auth.uid()));

-- Talk policies
CREATE POLICY "Talk is public" ON public.entry_talk FOR SELECT USING (true);
CREATE POLICY "Authenticated can post talk" ON public.entry_talk FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete own talk" ON public.entry_talk FOR DELETE USING (auth.uid() = author_id OR public.is_editor_or_admin(auth.uid()));

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE INDEX idx_revisions_slug ON public.entry_revisions(entry_slug);
CREATE INDEX idx_revisions_status ON public.entry_revisions(status);
CREATE INDEX idx_talk_slug ON public.entry_talk(entry_slug);