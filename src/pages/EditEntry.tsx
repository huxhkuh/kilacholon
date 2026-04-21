import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Bold, Italic, Link2, List, ListOrdered, Heading2, Save, Eye, AlertTriangle, BookOpen, FileQuestion } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import WikiText from "@/components/wiki/WikiText";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { categories, entries as allEntries, getEntry } from "@/data/content";
import { cn } from "@/lib/utils";

type Mode = "edit" | "preview";

export default function EditEntry() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const existing = getEntry(slug);
  const isNew = !existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? categories[0]?.slug ?? "");
  const [summary, setSummary] = useState(existing?.shortDescription ?? "");
  const [content, setContent] = useState(existing?.fullDescription ?? "");
  const [tagsRaw, setTagsRaw] = useState((existing?.tags ?? []).join(", "));
  const [changeSummary, setChangeSummary] = useState("");
  const [mode, setMode] = useState<Mode>("edit");
  const [submitting, setSubmitting] = useState(false);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [isStub, setIsStub] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    document.title = isNew ? `ערך חדש — פדיה פיננסית` : `עריכה: ${existing?.title} — פדיה פיננסית`;
  }, [isNew, existing]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // ---------- Editor toolbar helpers ----------
  function wrapSelection(before: string, after = before) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
    });
  }

  function insertAtLineStart(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + prefix.length;
    });
  }

  function insertWikiLink(linkSlug: string, label?: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end).trim();
    const text = label ?? selected;
    const snippet = text && text !== linkSlug ? `[[${linkSlug}|${text}]]` : `[[${linkSlug}]]`;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    setLinkPickerOpen(false);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + snippet.length;
    });
  }

  // ---------- Submit ----------
  async function handleSubmit() {
    if (!user) { navigate("/auth"); return; }
    if (isStub && isNew) {
      if (!title.trim() || !category) {
        toast.error("נא למלא כותרת וקטגוריה לערך הריק");
        return;
      }
    } else {
      if (!title.trim() || !summary.trim() || !content.trim() || !category) {
        toast.error("נא למלא כותרת, קטגוריה, תקציר ותוכן");
        return;
      }
      if (!changeSummary.trim()) {
        toast.error("נא לכתוב תקציר עריכה (מה שונה ולמה)");
        return;
      }
    }

    const slugForSave = isNew
      ? title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0590-\u05FF\-]/g, "")
      : slug;

    const stubSummary = "ערך זה הוא קצרמר. אתם מוזמנים להרחיב אותו.";
    const stubContent = `## ${title.trim()}\n\nזהו ערך ריק (קצרמר) שעדיין לא נכתב.\n\nאתם מוזמנים [לערוך](/edit/${slugForSave}) ולהוסיף תוכן: הגדרה, הסבר, דוגמאות וקישורים פנימיים בעזרת התחביר \`[[slug]]\`.`;
    const effectiveTags = isStub
      ? Array.from(new Set([...(tagsRaw.split(",").map(t => t.trim()).filter(Boolean)), "קצרמר"]))
      : tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

    setSubmitting(true);
    const { error } = await supabase.from("entry_revisions").insert({
      entry_slug: slugForSave,
      title: title.trim(),
      category,
      summary: isStub ? stubSummary : summary.trim(),
      content: isStub ? stubContent : content.trim(),
      tags: effectiveTags,
      change_summary: isStub ? "יצירת קצרמר (ערך ריק להרחבה)" : changeSummary.trim(),
      is_new_entry: isNew,
      author_id: user.id,
    });
    setSubmitting(false);

    if (error) { toast.error("שגיאה בשליחה: " + error.message); return; }
    toast.success("ההגשה נשלחה לבדיקת עורך. תודה על תרומתך!");
    navigate(isNew ? "/" : `/entry/${slug}`);
  }

  const linkableEntries = useMemo(() => allEntries, []);

  if (authLoading) return <Layout><div className="container py-24 text-center text-muted-foreground">טוען…</div></Layout>;

  return (
    <Layout>
      <div className="container py-8 md:py-10 max-w-5xl">
        {/* breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-primary">ראשי</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          {!isNew && existing && (
            <>
              <Link to={`/entry/${slug}`} className="hover:text-primary">{existing.title}</Link>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-foreground/80">{isNew ? "ערך חדש" : "עריכה"}</span>
        </nav>

        {/* Header */}
        <header className="mb-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-gold" />
            <Badge variant="outline" className="border-gold/40 text-gold-deep bg-gold/5">
              {isNew ? "יצירת ערך חדש" : "עריכה"}
            </Badge>
          </div>
          <h1 className="heading-display text-3xl md:text-4xl text-primary leading-tight">
            {isNew ? "כתיבת ערך חדש" : `עריכה: ${existing?.title}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            כל הגשה עוברת בדיקה של עורך לפני פרסום. כתבו בעברית פשוטה ומכובדת, התאימו את התוכן לציבור החרדי, וצרו קישורים פנימיים בין ערכים בעזרת התחביר{" "}
            <code className="rtl:font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">[[שם-הערך]]</code>.
          </p>
        </header>

        {/* Tabs: Edit / Preview */}
        <div className="border-b border-border flex items-center gap-1 mb-6">
          {([
            { id: "edit", label: "עריכה", icon: BookOpen },
            { id: "preview", label: "תצוגה מקדימה", icon: Eye },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                mode === t.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-primary hover:bg-secondary/40"
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {mode === "edit" ? (
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-5 min-w-0">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="mb-1.5 block">כותרת הערך</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="לדוגמה: קרן השתלמות"
                  disabled={!isNew}
                  className="text-lg"
                />
                {!isNew && <p className="text-xs text-muted-foreground mt-1">שם הערך נעול לעריכה.</p>}
              </div>

              {/* Category + Tags */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="mb-1.5 block">קטגוריה</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="tags" className="mb-1.5 block">תגיות (מופרדות בפסיק)</Label>
                  <Input id="tags" value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="חיסכון, פנסיה, מתחילים" />
                </div>
              </div>

              {/* Summary */}
              <div>
                <Label htmlFor="summary" className="mb-1.5 block">תקציר (1–3 משפטים)</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  rows={3}
                  placeholder="הסבר קצר של הערך כפי שיופיע בכרטיס ובראש העמוד."
                />
              </div>

              {/* Content with toolbar */}
              <div>
                <Label htmlFor="content" className="mb-1.5 block">תוכן הערך</Label>
                <div className="rounded-md border border-input overflow-hidden bg-background">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/40 p-1.5">
                    <ToolbarBtn title="כותרת משנה" onClick={() => insertAtLineStart("## ")}><Heading2 className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="מודגש" onClick={() => wrapSelection("**")}><Bold className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="נטוי" onClick={() => wrapSelection("*")}><Italic className="h-4 w-4" /></ToolbarBtn>
                    <span className="w-px h-5 bg-border mx-1" />
                    <ToolbarBtn title="רשימה" onClick={() => insertAtLineStart("- ")}><List className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="רשימה ממוספרת" onClick={() => insertAtLineStart("1. ")}><ListOrdered className="h-4 w-4" /></ToolbarBtn>
                    <span className="w-px h-5 bg-border mx-1" />

                    {/* Wiki link picker */}
                    <Popover open={linkPickerOpen} onOpenChange={setLinkPickerOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          title="קישור פנימי לערך באתר"
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium hover:bg-background border border-transparent hover:border-border transition-colors"
                        >
                          <Link2 className="h-4 w-4" /> קישור לערך
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80 p-0">
                        <Command>
                          <CommandInput placeholder="חיפוש ערך לקישור..." />
                          <CommandList>
                            <CommandEmpty>לא נמצאו ערכים.</CommandEmpty>
                            <CommandGroup heading="ערכים באתר">
                              {linkableEntries.map(e => (
                                <CommandItem key={e.slug} value={`${e.title} ${e.slug}`} onSelect={() => insertWikiLink(e.slug, e.title)}>
                                  <span className="font-medium">{e.title}</span>
                                  <span className="text-xs text-muted-foreground mr-auto">{e.slug}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <span className="text-xs text-muted-foreground mr-auto px-2">
                      תחביר קישור: <code className="bg-background px-1 rounded">[[slug]]</code> או <code className="bg-background px-1 rounded">[[slug|תווית]]</code>
                    </span>
                  </div>
                  <Textarea
                    id="content"
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={20}
                    className="rounded-none border-0 focus-visible:ring-0 font-[Assistant] text-[15px] leading-[1.9] resize-y min-h-[400px]"
                    placeholder="כתבו את גוף הערך כאן. השתמשו בכפתורי הכלים מעל ובתחביר ויקי לקישורים פנימיים."
                  />
                </div>
              </div>

              {/* Change summary */}
              <div>
                <Label htmlFor="change-summary" className="mb-1.5 block">תקציר עריכה <span className="text-destructive">*</span></Label>
                <Input
                  id="change-summary"
                  value={changeSummary}
                  onChange={e => setChangeSummary(e.target.value)}
                  placeholder='לדוגמה: "תיקון נוסח בפסקת היתרונות והוספת קישור לקרן השתלמות"'
                />
                <p className="text-xs text-muted-foreground mt-1">תיאור קצר של השינוי, יוצג להיסטוריית הערך ולעורך הבודק.</p>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <Link to={isNew ? "/" : `/entry/${slug}`}>
                  <Button variant="ghost">ביטול</Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setMode("preview")}>
                    <Eye className="h-4 w-4" /> תצוגה מקדימה
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    <Save className="h-4 w-4" /> {submitting ? "שולח…" : "שליחה לבדיקה"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Help sidebar */}
            <aside className="space-y-4">
              <div className="rounded-xl bg-card border border-border p-5 shadow-card">
                <h3 className="font-display font-semibold text-primary mb-3 text-sm uppercase tracking-wider">עזרה לכתיבה</h3>
                <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed">
                  <li><b>כותרת משנה</b> — שורה שמתחילה ב־<code className="text-xs bg-secondary px-1 rounded">##</code></li>
                  <li><b>מודגש</b> — <code className="text-xs bg-secondary px-1 rounded">**טקסט**</code></li>
                  <li><b>נטוי</b> — <code className="text-xs bg-secondary px-1 rounded">*טקסט*</code></li>
                  <li><b>קישור פנימי</b> — <code className="text-xs bg-secondary px-1 rounded">[[slug]]</code></li>
                  <li><b>קישור עם תווית</b> — <code className="text-xs bg-secondary px-1 rounded">[[slug|טקסט]]</code></li>
                </ul>
              </div>
              <div className="rounded-xl bg-gold/10 border border-gold/30 p-4 text-sm leading-relaxed">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-gold-deep mt-0.5 shrink-0" />
                  <p className="text-foreground/85 m-0">
                    שמרו על שפה מכובדת ומותאמת לציבור החרדי. אין לפרסם תוכן שיווקי, פרטים אישיים, או המלצות השקעה ספציפיות.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Preview mode */
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">תצוגה מקדימה</span>
              <Button size="sm" variant="outline" onClick={() => setMode("edit")}>חזרה לעריכה</Button>
            </div>
            <h1 className="heading-display text-3xl md:text-4xl text-primary mb-3">{title || "ללא כותרת"}</h1>
            {summary && (
              <div className="rounded-xl bg-secondary/60 border-r-4 border-gold p-4 mb-5">
                <p className="text-base leading-[1.85] text-foreground/90 m-0">{summary}</p>
              </div>
            )}
            {content
              ? <WikiText text={content} className="text-foreground/90 leading-[1.95] text-[17px] whitespace-pre-wrap" />
              : <p className="text-muted-foreground italic">אין עדיין תוכן להצגה.</p>
            }
          </div>
        )}
      </div>
    </Layout>
  );
}

function ToolbarBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-primary hover:bg-background border border-transparent hover:border-border transition-colors"
    >
      {children}
    </button>
  );
}