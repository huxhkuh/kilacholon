import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Comment = {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
};

export default function TalkSection({ slug }: { slug: string }) {
  const { user, isEditor } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const cursor = useRef<{ id: string; created_at: string } | null>(null);
  const paging = useRef(false);
  const loadRequest = useRef(0);
  const activeSlug = useRef<string | null>(null);

  const load = useCallback(async (append = false) => {
    if (activeSlug.current !== slug || (append && paging.current)) return;
    paging.current = true;
    const request = ++loadRequest.current;
    if (append) { setLoadingMore(true); setMoreError(false); }
    else { setLoading(true); setLoadError(false); setMoreError(false); setLoadingMore(false); }
    try {
      let query = supabase
        .from("entry_talk")
        .select("id, body, author_id, created_at")
        .eq("entry_slug", slug)
        .order("created_at", { ascending: false }).order("id", { ascending: false });
      // Stable keyset pagination survives equal timestamps and concurrent deletes.
      if (append && cursor.current) {
        const { created_at, id } = cursor.current;
        query = query.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`);
      }
      const { data, error } = await query.limit(101);
      if (request !== loadRequest.current) return;
      if (error) throw error;
      const page = (data ?? []).slice(0, 100);
      const ids = [...new Set(page.map(row => row.author_id))];
      const profiles = ids.length ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids) : { data: [] };
      if (request !== loadRequest.current) return;
      const byId = new Map((profiles.data ?? []).map(profile => [profile.id, profile]));
      const next = page.map(row => ({ ...row, profiles: byId.get(row.author_id) }));
      setComments(current => append ? [...current, ...next.filter(row => !current.some(item => item.id === row.id))] : next);
      cursor.current = page[page.length - 1] ?? null;
      setHasMore((data ?? []).length > 100);
    } catch {
      if (request !== loadRequest.current) return;
      if (append) setMoreError(true); else setLoadError(true);
    } finally {
      if (request === loadRequest.current) {
        paging.current = false;
        setLoading(false); setLoadingMore(false);
      }
    }
  }, [slug]);

  const cancelLoad = useCallback(() => {
    activeSlug.current = null;
    loadRequest.current += 1;
  }, []);

  useEffect(() => {
    activeSlug.current = slug;
    cursor.current = null;
    paging.current = false;
    setHasMore(false);
    setComments([]);
    setBody("");
    setBusy(false);
    setRemoving(null);
    void load();
    return cancelLoad;
  }, [load, slug, cancelLoad]);

  async function submit() {
    if (!user) return;
    if (body.trim().length < 2) { toast.error("התגובה קצרה מדי"); return; }
    if (body.length > 2000) { toast.error("התגובה ארוכה מדי"); return; }
    setBusy(true);
    const { error } = await supabase.from("entry_talk").insert({
      entry_slug: slug, author_id: user.id, body: body.trim(),
    });
    if (activeSlug.current !== slug) return;
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
    load();
  }

  async function remove(id: string) {
    setRemoving(id);
    const { error } = await supabase.from("entry_talk").delete().eq("id", id);
    if (activeSlug.current !== slug) return;
    setRemoving(null);
    if (error) { toast.error('לא ניתן למחוק את התגובה כרגע'); return; }
    void load();
  }

  return (
    <div className="space-y-5">
      {user ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <Textarea
            aria-label="תגובה לדיון"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="הוסיפו דיון, שאלה או הצעת תיקון לערך..."
            rows={3}
            maxLength={2000}
            className="resize-none border-0 focus-visible:ring-0 px-0"
          />
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">{body.length}/2000</span>
            <Button size="sm" onClick={submit} disabled={busy || body.trim().length < 2}>
              <Send className="h-3.5 w-3.5" /> פרסום
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-secondary/50 border border-border p-5 text-center">
          <p className="text-sm text-muted-foreground mb-3">להשתתפות בדיון נדרשת הרשמה.</p>
          <Button asChild size="sm"><Link to="/auth">כניסה / הרשמה</Link></Button>
        </div>
      )}

      {loading ? <p role="status">טוען דיון…</p> : loadError ? <div><p>לא ניתן לטעון את הדיון כרגע.</p><Button variant="outline" onClick={() => void load()}>ניסיון נוסף</Button></div> : comments.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8">
          <MessageCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          עדיין אין דיון על הערך הזה. התחילו את השיחה.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{c.profiles?.display_name?.slice(0, 2) ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground">{c.profiles?.display_name ?? "משתמש"}</span>
                    <div className="flex items-center gap-2">
                      <time className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("he-IL")}</time>
                      {(user?.id === c.author_id || isEditor) && (
                        <button aria-label="מחיקת תגובה" disabled={removing !== null} onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive disabled:opacity-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !loadError && hasMore && <div className="text-center space-y-2">
        {moreError && <p role="alert">לא ניתן לטעון תגובות נוספות. נסו שוב.</p>}
        <Button variant="outline" disabled={loadingMore} onClick={() => void load(true)}>
          {loadingMore ? "טוען תגובות…" : moreError ? "ניסיון נוסף לטעינת תגובות" : "תגובות קודמות"}
        </Button>
      </div>}
    </div>
  );
}
