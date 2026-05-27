import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { entries as seedEntries, mergeApprovedRevisions, type ApprovedRevision } from "@/data/content";

export function usePublishedEntries() {
  const query = useQuery({
    queryKey: ["approved-entry-revisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entry_revisions")
        .select("entry_slug, title, category, summary, content, tags, created_at, reviewed_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ApprovedRevision[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    entries: mergeApprovedRevisions(seedEntries, query.data ?? []),
    isLoading: query.isLoading,
    error: query.error,
  };
}
