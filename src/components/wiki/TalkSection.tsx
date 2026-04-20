import { useEffect, useState } from "react";
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

  useEffect(() => { load(); }, [slug]);

  async function load() {
    const { data } = await supabase
      .from("entry_talk")
      .select("id, body, author_id, created_at, profiles:author_id(display_name, avatar_url)")
      .eq("entry_slug", slug)
      .order("created_at", { ascending: false });
    setComments((data as any) ?? []);
  }

  async function submit() {
    if (!user) return;
    if (body.trim().length < 2) { toast.error("התגובה קצרה מדי"); return; }
    if (body.length > 2000) { toast.error("התגובה ארוכה מדי"); return; }
    setBusy(true);
    const { error } = await supabase.from("entry_talk").insert({
      entry_slug: slug, author_id: user.id, body: body.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
    load();
  }

  async function remove(id: string) {
    await supabase.from("entry_talk").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      {user ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <Textarea
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
          <Link to="/auth"><Button size="sm">כניסה / הרשמה</Button></Link>
        </div>
      )}

      {comments.length === 0 ? (
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
                        <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive">
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
    </div>
  );
}
