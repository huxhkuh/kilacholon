import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mergeApprovedRevisions, type ApprovedRevision } from '@/data/content';
import { embeddedArticle, fetchArticle, referenceEntries, referenceBySlug } from '@/data/reference';

export function usePublishedEntries(slug?: string) {
  const metadata = referenceBySlug.get(slug ?? '');
  const library = useQuery({
    queryKey: ['reference-entry', slug, metadata?.contentFile],
    queryFn: ({ signal }) => fetchArticle(metadata!, signal),
    enabled: !!metadata?.contentFile,
    initialData: () => embeddedArticle(metadata),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  const revisions = useQuery({
    queryKey: ['approved-entry-revisions'],
    queryFn: async ({ signal }) => {
      // Supabase caps responses by default; page through all approved revisions.
      const result: ApprovedRevision[] = [];
      const size = 500;
      for (let offset = 0; ; offset += size) {
        const { data, error } = await supabase.from('entry_revisions')
          .select('entry_slug, title, category, summary, content, tags, created_at, reviewed_at')
          .eq('status', 'approved').order('created_at', { ascending: false })
          .order('id', { ascending: false }).range(offset, offset + size - 1).abortSignal(signal);
        if (error) throw error;
        result.push(...(data ?? []));
        if (!data || data.length < size) return result;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const entries = useMemo(() => {
    const base = library.data ? referenceEntries.map(entry => entry.slug === library.data.slug ? library.data : entry) : referenceEntries;
    return mergeApprovedRevisions(base, revisions.data ?? []);
  }, [library.data, revisions.data]);
  return {
    entries,
    isLoading: !!metadata?.contentFile && library.isPending,
    isCommunityLoading: revisions.isPending,
    error: library.error ?? revisions.error,
    catalogError: library.error,
    communityError: revisions.error,
    retry: () => { if (metadata?.contentFile) void library.refetch(); if (revisions.error) void revisions.refetch(); },
  };
}
