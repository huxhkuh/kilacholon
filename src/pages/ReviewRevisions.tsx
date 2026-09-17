import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { revisionDiff } from "@/lib/revisionDiff";
import { Textarea } from "@/components/ui/textarea";

type Revision = Tables<"entry_revisions">;

export default function ReviewRevisions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isEditor, loading } = useAuth();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const { entries } = usePublishedEntries();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    document.title = "בדיקת עריכות — מיכלכלה";
    if (!loading && !isEditor) navigate("/", { replace: true });
  }, [isEditor, loading, navigate]);

  useEffect(() => {
    if (isEditor) load();
  }, [isEditor]);

  async function load() {
    setQueueLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("entry_revisions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }).limit(100);

    setQueueLoading(false);

    if (error) {
      toast.error("לא ניתן לטעון את העריכות הממתינות");
      setLoadError(true);
      return;
    }
    setRevisions(data ?? []);
  }

  async function review(revision: Revision, status: "approved" | "rejected") {
    if (!user) return;
    setBusy(revision.id);
    const { data: updated, error } = await supabase
      .from("entry_revisions")
      .update({
        status,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes[revision.id]?.trim() || null,
      })
      .eq("id", revision.id).eq("status", "pending").select("id");

    if (!error && status === "approved") {
      await queryClient.invalidateQueries({ queryKey: ["approved-entry-revisions"] });
    }

    setBusy(null);
    if (error || !updated?.length) {
      toast.error(error ? "שמירת ההחלטה נכשלה" : "הגרסה כבר נבדקה או שאין הרשאה לעדכן אותה");
      return;
    }

    toast.success(status === "approved" ? "העריכה אושרה ופורסמה" : "העריכה נדחתה");
    setRevisions(current => current.filter(item => item.id !== revision.id));
  }

  if (loading || !isEditor) {
    return <Layout><div className="container py-20 text-center text-muted-foreground">טוען...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container max-w-5xl py-10">
        <header className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileCheck2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="heading-display text-2xl text-primary">בדיקת עריכות</h1>
            <p className="text-sm text-muted-foreground">אישור מפרסם את העריכה ומעדכן אוטומטית את אמון הכותב.</p>
          </div>
        </header>

        {queueLoading ? <p role="status">טוען תור עריכות…</p> : loadError ? <div><p>לא ניתן לטעון את תור העריכות.</p><Button onClick={() => void load()} variant="outline">ניסיון נוסף</Button></div> : revisions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
            אין עריכות שממתינות לבדיקה.
          </div>
        ) : (
          <div className="space-y-5">
            {revisions.map(revision => (
              <article key={revision.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-display font-semibold text-xl text-primary">{revision.title}</h2>
                      {revision.is_new_entry && <Badge variant="secondary">ערך חדש</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(revision.created_at).toLocaleString("he-IL")} · {revision.category}
                    </p>
                  </div>
                  <Badge variant="outline">ממתין לבדיקה</Badge>
                </div>

                <p className="rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed mb-3">{revision.summary}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  סיבת השינוי: {revision.change_summary || "לא נמסר תיאור"}
                </p>
                <div className="rounded-lg border border-border p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto mb-5">
                  {revision.content}
                </div>

                <details className="rounded-md border border-border mb-4 p-3">
                  <summary className="font-semibold text-primary cursor-pointer">השוואה לערך שפורסם</summary>
                  <div className="mt-3 text-sm whitespace-pre-wrap max-h-96 overflow-auto" dir="rtl">
                    {revisionDiff(entries.find(entry => entry.slug === revision.entry_slug)?.fullDescription ?? '', revision.content).map((line, index) => <div key={index} className={line.type === 'added' ? 'bg-emerald-50 text-emerald-950' : line.type === 'removed' ? 'bg-rose-50 text-rose-950 line-through' : ''}>
                      <span className="inline-block w-5" aria-label={line.type === 'added' ? 'נוסף' : line.type === 'removed' ? 'הוסר' : ''}>{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</span>{line.text || ' '}
                    </div>)}
                  </div>
                </details>
                <label className="block text-sm mb-4">הערה לכותב (לא חובה)
                  <Textarea className="mt-2" maxLength={2000} value={notes[revision.id] ?? ''} onChange={event => setNotes(current => ({ ...current, [revision.id]: event.target.value }))} placeholder="מה כדאי לשפר או מה נבדק?" />
                </label>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => review(revision, "rejected")}
                    disabled={busy !== null}
                  >
                    <XCircle className="h-4 w-4" /> דחייה
                  </Button>
                  <Button
                    onClick={() => review(revision, "approved")}
                    disabled={busy !== null}
                  >
                    <CheckCircle2 className="h-4 w-4" /> אישור ופרסום
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
