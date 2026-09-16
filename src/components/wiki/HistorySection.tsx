import { useEffect, useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import WikiText from './WikiText';
import { usePublishedEntries } from '@/hooks/usePublishedEntries';

type Revision = Tables<'entry_revisions'> & { profiles?: { display_name: string } };
const statuses = { approved: 'מאושר', pending: 'ממתין', rejected: 'נדחה' };
export default function HistorySection({ slug }: { slug: string }) {
  const { user, isEditor } = useAuth();
  const { entries } = usePublishedEntries();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [restoring, setRestoring] = useState<string | null>(null);
  const userId = user?.id;
  const scope = `${slug}:${userId ?? 'anonymous'}:${isEditor ? 'editor' : 'reader'}`;
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    setRevisions([]);
    Promise.resolve(supabase.from('entry_revisions').select('*').eq('entry_slug', slug)
      .order('created_at', { ascending: false }).limit(100))
      .then(async ({ data, error: failure }) => {
        const ids = [...new Set((data ?? []).map(row => row.author_id))];
        const profiles = ids.length ? await supabase.from('profiles').select('id, display_name').in('id', ids) : { data: [] };
        const byId = new Map((profiles.data ?? []).map(profile => [profile.id, profile]));
        if (!active) return;
        setError(!!failure);
        setRevisions((data ?? []).map(row => ({ ...row, profiles: byId.get(row.author_id) })));
        setLoadedScope(scope);
        setLoading(false);
      }).catch(() => {
        if (!active) return;
        setError(true); setLoadedScope(scope); setLoading(false);
      });
    return () => { active = false; };
  }, [slug, reload, scope]);
  async function restore(revision: Revision) {
    if (!user || !isEditor) return;
    setRestoring(revision.id);
    const { error: failure } = await supabase.from('entry_revisions').insert({
      entry_slug: slug, title: revision.title, summary: revision.summary, content: revision.content,
      category: revision.category, tags: revision.tags, author_id: user.id, status: 'pending',
      change_summary: `בקשת שחזור לגרסה מ־${new Date(revision.created_at).toLocaleString('he-IL')}`,
    });
    setRestoring(null);
    if (failure) { toast.error('בקשת השחזור לא נשמרה'); return; }
    toast.success('גרסת השחזור נשלחה לתור האישור. הערך שפורסם נשאר כפי שהיה.');
    setReload(value => value + 1);
  }
  if (loading || loadedScope !== scope) return <p role="status" className="py-8 text-muted-foreground">טוען היסטוריה…</p>;
  if (error) return <div className="py-8"><p>לא ניתן לטעון היסטוריה כרגע.</p><Button variant="outline" className="mt-3" onClick={() => setReload(value => value + 1)}>ניסיון נוסף</Button></div>;
  if (!revisions.length) return <div className="text-center text-sm text-muted-foreground py-10"><History className="h-8 w-8 mx-auto mb-2" />טרם פורסמו עריכות קהילתיות. ערך הבסיס נשמר במאגר התוכן.</div>;
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">עד 100 הגרסאות האחרונות הזמינות לפי ההרשאות שלך. פתיחת גרסה מציגה את התוכן שנשמר בה.</p>
    {revisions.map(revision => <details key={revision.id} className="rounded-md border border-border bg-card p-4">
      <summary className="cursor-pointer leading-relaxed"><span className="font-semibold">{revision.change_summary || revision.title}</span><span className="block text-xs text-muted-foreground mt-1">{new Date(revision.created_at).toLocaleString('he-IL')} · {revision.profiles?.display_name || 'כותב'} · {statuses[revision.status]}</span></summary>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-4">{revision.summary}</p>
        <WikiText text={revision.content} knownEntries={entries} />
        {revision.reviewer_notes && <p className="mt-4 rounded bg-secondary p-3 text-sm"><strong>הערת העורך: </strong>{revision.reviewer_notes}</p>}
        {isEditor && <Button className="mt-4" size="sm" variant="outline" disabled={restoring !== null} onClick={() => restore(revision)}><RotateCcw className="h-4 w-4" />הגשת גרסה זו לשחזור</Button>}
      </div>
    </details>)}
  </div>;
}
