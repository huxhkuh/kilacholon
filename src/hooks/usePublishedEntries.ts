import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { entries as seedEntries, mergeApprovedRevisions, type ApprovedRevision } from '@/data/content';

export function usePublishedEntries() {
  const library = useQuery({
    queryKey: ['reference-catalog'],
    queryFn: () => import('@/data/catalog').then(module => module.loadCatalog()),
    staleTime: Infinity,
    gcTime: Infinity,
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
  const entries = useMemo(() => mergeApprovedRevisions(library.data ?? seedEntries, revisions.data ?? []), [library.data, revisions.data]);
  return {
    entries,
    isLoading: library.isPending,
    isCommunityLoading: revisions.isPending,
    error: library.error ?? revisions.error,
    catalogError: library.error,
    communityError: revisions.error,
    retry: () => { void library.refetch(); void revisions.refetch(); },
  };
}
