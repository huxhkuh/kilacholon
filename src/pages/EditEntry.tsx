import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Bold, Italic, Link2, List, ListOrdered, Heading2, Heading3, Save, Eye, AlertTriangle, BookOpen, FileQuestion, Sparkles, CheckCircle2, Circle, Plus, Quote, Minus, Link as LinkIcon, HelpCircle, FileCode, Sigma } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const [linkQuery, setLinkQuery] = useState("");
  const [explLinkOpen, setExplLinkOpen] = useState(false);
  const [explLinkQuery, setExplLinkQuery] = useState("");
  const [creatingStub, setCreatingStub] = useState(false);

  // ---------- Stub expansion workflow ----------
  const [stubRevisionId, setStubRevisionId] = useState<string | null>(null);
  const [isStubEntry, setIsStubEntry] = useState(false);
  const [expandMode, setExpandMode] = useState(false);
  const [defField, setDefField] = useState("");
  const [explField, setExplField] = useState("");
  const [exField, setExField] = useState("");

  // Minimum chars for each required expansion field
  const MIN_DEF = 20;
  const MIN_EXPL = 80;
  const MIN_EX = 30;

  const defOk = defField.trim().length >= MIN_DEF;
  const explOk = explField.trim().length >= MIN_EXPL;
  const exOk = exField.trim().length >= MIN_EX;
  const completed = [defOk, explOk, exOk].filter(Boolean).length;
  const progressPct = Math.round((completed / 3) * 100);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const explTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    document.title = isNew ? `ערך חדש — פדיה פיננסית` : `עריכה: ${existing?.title} — פדיה פיננסית`;
  }, [isNew, existing]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Detect if the entry being edited is a stub (קצרמר) — fetch latest revision
  useEffect(() => {
    if (isNew || !slug) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("entry_revisions")
        .select("id, title, category, summary, content, tags")
        .eq("entry_slug", slug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      const tags = (data.tags as string[] | null) ?? [];
      const looksLikeStub = tags.includes("קצרמר") || /קצרמר/.test(data.summary || "") || /קצרמר/.test(data.content || "");
      if (looksLikeStub) {
        setIsStubEntry(true);
        setStubRevisionId(data.id);
        setExpandMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isNew, slug]);

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

  function insertWikiLinkExpl(linkSlug: string, label?: string) {
    const text = label ?? "";
    const snippet = text && text !== linkSlug ? `[[${linkSlug}|${text}]]` : `[[${linkSlug}]]`;
    const ta = explTextareaRef.current;
    if (!ta) {
      setExplField(v => (v ? v + " " : "") + snippet);
    } else {
      const s = ta.selectionStart, e = ta.selectionEnd;
      const next = explField.slice(0, s) + snippet + explField.slice(e);
      setExplField(next);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = s + snippet.length;
      });
    }
    setExplLinkOpen(false);
    setExplLinkQuery("");
  }

  function slugify(t: string) {
    return t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0590-\u05FF\-]/g, "");
  }

  // Create a new stub entry on the fly and return its slug
  async function createStubInline(rawTitle: string): Promise<{ slug: string; title: string } | null> {
    if (!user) { navigate("/auth"); return null; }
    const t = rawTitle.trim();
    if (!t) return null;
    const newSlug = slugify(t);
    if (!newSlug) { toast.error("שם הערך לא תקין"); return null; }
    // Avoid clashing with an existing static entry
    if (allEntries.some(e => e.slug === newSlug)) {
      toast.message("הערך כבר קיים — קישור הוספה");
      return { slug: newSlug, title: t };
    }
    setCreatingStub(true);
    const stubSummary = "ערך זה הוא קצרמר. אתם מוזמנים להרחיב אותו.";
    const stubContent = `## ${t}\n\nזהו ערך ריק (קצרמר) שעדיין לא נכתב.\n\nאתם מוזמנים [לערוך](/edit/${newSlug}) ולהוסיף תוכן.`;
    const { error } = await supabase.from("entry_revisions").insert({
      entry_slug: newSlug,
      title: t,
      category,
      summary: stubSummary,
      content: stubContent,
      tags: ["קצרמר"],
      change_summary: "יצירת קצרמר תוך כדי עריכת ערך אחר",
      is_new_entry: true,
      author_id: user.id,
    });
    setCreatingStub(false);
    if (error) { toast.error("שגיאה ביצירת הקצרמר: " + error.message); return null; }
    toast.success(`נוצר קצרמר חדש: "${t}" — ממתין לאישור עורך`);
    return { slug: newSlug, title: t };
  }

  // ---------- Submit ----------
  async function handleSubmit() {
    if (!user) { navigate("/auth"); return; }

    // Stub expansion submission
    if (expandMode) {
      if (!defOk || !explOk || !exOk) {
        toast.error("נא למלא את שלושת השדות (הגדרה, הסבר, דוגמה) באורך המינימלי");
        return;
      }
      if (!changeSummary.trim()) {
        toast.error("נא לכתוב תקציר עריכה (מה שונה ולמה)");
        return;
      }
      const slugForSave = slug;
      const compiledContent = `## הגדרה\n\n${defField.trim()}\n\n## הסבר\n\n${explField.trim()}\n\n## דוגמה\n\n${exField.trim()}`;
      const compiledSummary = defField.trim().slice(0, 280);
      const cleanedTags = Array.from(new Set(
        tagsRaw.split(",").map(t => t.trim()).filter(Boolean).filter(t => t !== "קצרמר")
      ));

      setSubmitting(true);
      const { error } = await supabase.from("entry_revisions").insert({
        entry_slug: slugForSave,
        title: title.trim() || existing?.title || slugForSave,
        category,
        summary: compiledSummary,
        content: compiledContent,
        tags: cleanedTags,
        change_summary: `הרחבת קצרמר: ${changeSummary.trim()}`,
        is_new_entry: false,
        author_id: user.id,
      });
      setSubmitting(false);
      if (error) { toast.error("שגיאה בשליחה: " + error.message); return; }
      toast.success("ההרחבה נשלחה לבדיקת עורך. תודה על תרומתך!");
      navigate(`/entry/${slugForSave}`);
      return;
    }

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
          <span className="text-foreground/80">{isNew ? "ערך חדש" : expandMode ? "הרחבת קצרמר" : "עריכה"}</span>
        </nav>

        {/* Header */}
        <header className="mb-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            {expandMode ? <Sparkles className="h-5 w-5 text-gold" /> : <BookOpen className="h-5 w-5 text-gold" />}
            <Badge variant="outline" className="border-gold/40 text-gold-deep bg-gold/5">
              {isNew ? "יצירת ערך חדש" : expandMode ? "הרחבת קצרמר" : "עריכה"}
            </Badge>
            {isStubEntry && !expandMode && (
              <Badge variant="outline" className="border-gold/40 text-gold-deep bg-gold/5">קצרמר</Badge>
            )}
          </div>
          <h1 className="heading-display text-3xl md:text-4xl text-primary leading-tight">
            {isNew ? "כתיבת ערך חדש" : expandMode ? `הרחבה: ${title || existing?.title || slug}` : `עריכה: ${existing?.title}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            כל הגשה עוברת בדיקה של עורך לפני פרסום. כתבו בעברית פשוטה ומכובדת, התאימו את התוכן לציבור החרדי, וצרו קישורים פנימיים בין ערכים בעזרת התחביר{" "}
            <code className="rtl:font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">[[שם-הערך]]</code>.
          </p>

          {/* Stub detected — offer expansion mode toggle */}
          {isStubEntry && (
            <div className="mt-4 rounded-xl bg-gold/10 border border-gold/40 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-gold-deep mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground/90 m-0">
                    ערך זה הוא קצרמר. עזרו להרחיב אותו במסלול מובנה.
                  </p>
                  <Button
                    size="sm"
                    variant={expandMode ? "outline" : "default"}
                    onClick={() => setExpandMode(m => !m)}
                  >
                    {expandMode ? "מעבר לעריכה חופשית" : "מצב הרחבה מובנה"}
                  </Button>
                </div>
                {expandMode && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-foreground/80 mb-1.5">
                      <span>התקדמות הרחבה</span>
                      <span className="font-medium">{completed}/3 שדות הושלמו</span>
                    </div>
                    <Progress value={progressPct} className="h-2 bg-background" />
                  </div>
                )}
              </div>
            </div>
          )}
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

        {mode === "edit" && expandMode ? (
          /* ===================== STUB EXPANSION MODE ===================== */
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-5 min-w-0">
              <ExpandField
                index={1}
                title="הגדרה"
                helper="משפט אחד או שניים שמסבירים בקצרה מהו הערך. כתבו כאילו אתם עונים למישהו ששואל 'מה זה?'"
                value={defField}
                onChange={setDefField}
                placeholder="לדוגמה: קרן השתלמות היא מכשיר חיסכון לטווח בינוני המוכר על ידי המעסיק והעובד..."
                minChars={MIN_DEF}
                ok={defOk}
                rows={3}
              />
              <ExpandField
                index={2}
                title="הסבר"
                helper="הרחיבו: איך זה עובד, מתי משתמשים בזה, מה חשוב לדעת. אפשר להוסיף קישורים פנימיים בתחביר [[slug]]."
                value={explField}
                onChange={setExplField}
                placeholder="הסבירו בצורה רחבה יותר את הערך, עקרונות הפעולה, מי משתמש בו ומתי..."
                minChars={MIN_EXPL}
                ok={explOk}
                rows={8}
                inputRef={explTextareaRef}
                headerExtra={
                  <Popover open={explLinkOpen} onOpenChange={setExplLinkOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium border border-border bg-background hover:bg-secondary transition-colors"
                        title="קישור פנימי או יצירת ערך חדש"
                      >
                        <Link2 className="h-3.5 w-3.5" /> קישור / ערך חדש
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-0">
                      <Command>
                        <CommandInput
                          placeholder="חיפוש ערך, או כתבו שם חדש ליצירה..."
                          value={explLinkQuery}
                          onValueChange={setExplLinkQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {explLinkQuery.trim() ? (
                              <button
                                type="button"
                                disabled={creatingStub}
                                onClick={async () => {
                                  const created = await createStubInline(explLinkQuery);
                                  if (created) insertWikiLinkExpl(created.slug, created.title);
                                }}
                                className="mx-auto inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60"
                              >
                                <Plus className="h-4 w-4" />
                                {creatingStub ? "יוצר…" : `יצירת קצרמר: "${explLinkQuery.trim()}"`}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">הקלידו שם ערך</span>
                            )}
                          </CommandEmpty>
                          <CommandGroup heading="ערכים באתר">
                            {linkableEntries.map(e => (
                              <CommandItem key={e.slug} value={`${e.title} ${e.slug}`} onSelect={() => insertWikiLinkExpl(e.slug, e.title)}>
                                <span className="font-medium">{e.title}</span>
                                <span className="text-xs text-muted-foreground mr-auto">{e.slug}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {explLinkQuery.trim() && (
                            <CommandGroup heading="חדש">
                              <CommandItem
                                value={`__create__ ${explLinkQuery}`}
                                onSelect={async () => {
                                  const created = await createStubInline(explLinkQuery);
                                  if (created) insertWikiLinkExpl(created.slug, created.title);
                                }}
                              >
                                <Plus className="h-4 w-4 ml-1" />
                                <span className="font-medium">יצירת קצרמר חדש: "{explLinkQuery.trim()}"</span>
                              </CommandItem>
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                }
              />
              <ExpandField
                index={3}
                title="דוגמה"
                helper="דוגמה מספרית או סיפורית מהחיים, שעוזרת להבין את הערך הלכה למעשה."
                value={exField}
                onChange={setExField}
                placeholder="לדוגמה: ראובן מפקיד 1,000 ש&quot;ח בחודש לקרן השתלמות..."
                minChars={MIN_EX}
                ok={exOk}
                rows={5}
              />

              {/* Change summary */}
              <div>
                <Label htmlFor="change-summary" className="mb-1.5 block">תקציר עריכה <span className="text-destructive">*</span></Label>
                <Input
                  id="change-summary"
                  value={changeSummary}
                  onChange={e => setChangeSummary(e.target.value)}
                  placeholder='לדוגמה: "הרחבה ראשונית של הקצרמר על בסיס מקורות..."'
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <Link to={`/entry/${slug}`}>
                  <Button variant="ghost">ביטול</Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { setExpandMode(false); }}>
                    מעבר לעריכה חופשית
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting || completed < 3}>
                    <Save className="h-4 w-4" /> {submitting ? "שולח…" : "שליחת הרחבה לבדיקה"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress sidebar */}
            <aside className="space-y-4">
              <div className="rounded-xl bg-card border border-border p-5 shadow-card sticky top-24">
                <h3 className="font-display font-semibold text-primary mb-3 text-sm uppercase tracking-wider">התקדמות הרחבה</h3>
                <Progress value={progressPct} className="h-2 mb-4" />
                <ul className="space-y-2.5 text-sm">
                  {[
                    { label: "הגדרה", ok: defOk, min: MIN_DEF, len: defField.trim().length },
                    { label: "הסבר", ok: explOk, min: MIN_EXPL, len: explField.trim().length },
                    { label: "דוגמה", ok: exOk, min: MIN_EX, len: exField.trim().length },
                  ].map(item => (
                    <li key={item.label} className="flex items-center gap-2">
                      {item.ok
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      }
                      <span className={cn("font-medium", item.ok ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                      <span className="text-xs text-muted-foreground mr-auto">
                        {item.len}/{item.min}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  לאחר השלמת שלושת השדות והגשה, התג <b>קצרמר</b> יוסר אוטומטית עם אישור העורך.
                </p>
              </div>
            </aside>
          </div>
        ) : mode === "edit" ? (
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-5 min-w-0">
              {/* Stub toggle - only for new entries */}
              {isNew && (
                <div className={cn(
                  "rounded-xl border p-4 flex items-start gap-3 transition-colors",
                  isStub ? "bg-gold/10 border-gold/40" : "bg-secondary/40 border-border"
                )}>
                  <FileQuestion className={cn("h-5 w-5 mt-0.5 shrink-0", isStub ? "text-gold-deep" : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isStub}
                        onChange={e => setIsStub(e.target.checked)}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                      />
                      <span className="font-medium text-sm">יצירת ערך ריק (קצרמר)</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      צרו שלד של ערך עם כותרת וקטגוריה בלבד. הערך יסומן כ"קצרמר" ויוכל להיות מורחב מאוחר יותר על ידי כותבים אחרים.
                    </p>
                  </div>
                </div>
              )}

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
              <div className={cn(isStub && "opacity-50 pointer-events-none")}>
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
              <div className={cn(isStub && "opacity-50 pointer-events-none")}>
                <Label htmlFor="content" className="mb-1.5 block">תוכן הערך</Label>
                <div className="rounded-md border border-input overflow-hidden bg-background">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/40 p-1.5">
                    <ToolbarBtn title="כותרת משנה" onClick={() => insertAtLineStart("## ")}><Heading2 className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="כותרת תת-פרק" onClick={() => insertAtLineStart("=== ")}><Heading3 className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="מודגש ('''טקסט''')" onClick={() => wrapSelection("'''")}><Bold className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="נטוי (''טקסט'')" onClick={() => wrapSelection("''")}><Italic className="h-4 w-4" /></ToolbarBtn>
                    <span className="w-px h-5 bg-border mx-1" />
                    <ToolbarBtn title="רשימת תבליטים" onClick={() => insertAtLineStart("* ")}><List className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="רשימה ממוספרת" onClick={() => insertAtLineStart("# ")}><ListOrdered className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="ציטוט" onClick={() => wrapSelection("<blockquote>", "</blockquote>")}><Quote className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="קו אופקי" onClick={() => insertAtLineStart("\n----\n")}><Minus className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="קוד מקור" onClick={() => wrapSelection("<pre>", "</pre>")}><FileCode className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="קישור חיצוני" onClick={() => wrapSelection("[https://", " טקסט]")}><LinkIcon className="h-4 w-4" /></ToolbarBtn>
                    <ToolbarBtn title="תבנית (ש, ערך מורחב, ציטוט…)" onClick={() => wrapSelection("{{", "}}")}><Sigma className="h-4 w-4" /></ToolbarBtn>
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
                          <CommandInput
                            placeholder="חיפוש ערך, או כתבו שם חדש ליצירה..."
                            value={linkQuery}
                            onValueChange={setLinkQuery}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {linkQuery.trim() ? (
                                <button
                                  type="button"
                                  disabled={creatingStub}
                                  onClick={async () => {
                                    const created = await createStubInline(linkQuery);
                                    if (created) insertWikiLink(created.slug, created.title);
                                    setLinkQuery("");
                                  }}
                                  className="mx-auto inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60"
                                >
                                  <Plus className="h-4 w-4" />
                                  {creatingStub ? "יוצר…" : `יצירת קצרמר: "${linkQuery.trim()}"`}
                                </button>
                              ) : (
                                <span className="text-muted-foreground">הקלידו שם ערך</span>
                              )}
                            </CommandEmpty>
                            <CommandGroup heading="ערכים באתר">
                              {linkableEntries.map(e => (
                                <CommandItem key={e.slug} value={`${e.title} ${e.slug}`} onSelect={() => insertWikiLink(e.slug, e.title)}>
                                  <span className="font-medium">{e.title}</span>
                                  <span className="text-xs text-muted-foreground mr-auto">{e.slug}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            {linkQuery.trim() && (
                              <CommandGroup heading="חדש">
                                <CommandItem
                                  value={`__create__ ${linkQuery}`}
                                  onSelect={async () => {
                                    const created = await createStubInline(linkQuery);
                                    if (created) insertWikiLink(created.slug, created.title);
                                    setLinkQuery("");
                                  }}
                                >
                                  <Plus className="h-4 w-4 ml-1" />
                                  <span className="font-medium">יצירת קצרמר חדש: "{linkQuery.trim()}"</span>
                                </CommandItem>
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Link to="/help/wiki-syntax" target="_blank" className="inline-flex items-center gap-1 mr-auto px-2 text-xs text-muted-foreground hover:text-primary">
                      <HelpCircle className="h-3.5 w-3.5" /> מדריך תחביר ויקי
                    </Link>
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
              <div className={cn(isStub && "hidden")}>
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
                  <Button variant="outline" onClick={() => setMode("preview")} disabled={isStub}>
                    <Eye className="h-4 w-4" /> תצוגה מקדימה
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    <Save className="h-4 w-4" /> {submitting ? "שולח…" : isStub ? "יצירת קצרמר" : "שליחה לבדיקה"}
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
            {expandMode ? (
              <>
                {defField && (
                  <div className="rounded-xl bg-secondary/60 border-r-4 border-gold p-4 mb-5">
                    <p className="text-base leading-[1.85] text-foreground/90 m-0">{defField}</p>
                  </div>
                )}
                <WikiText
                  text={`## הסבר\n\n${explField}\n\n## דוגמה\n\n${exField}`}
                  className="text-foreground/90 leading-[1.95] text-[17px] whitespace-pre-wrap"
                />
              </>
            ) : (<>{summary && (
              <div className="rounded-xl bg-secondary/60 border-r-4 border-gold p-4 mb-5">
                <p className="text-base leading-[1.85] text-foreground/90 m-0">{summary}</p>
              </div>
            )}
            {content
              ? <WikiText text={content} className="text-foreground/90 leading-[1.95] text-[17px] whitespace-pre-wrap" />
              : <p className="text-muted-foreground italic">אין עדיין תוכן להצגה.</p>
            }</>)}
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

function ExpandField({
  index, title, helper, value, onChange, placeholder, minChars, ok, rows, inputRef, headerExtra,
}: {
  index: number;
  title: string;
  helper: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minChars: number;
  ok: boolean;
  rows: number;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  headerExtra?: React.ReactNode;
}) {
  const len = value.trim().length;
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors",
      ok ? "border-emerald-600/40 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-border bg-card"
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn(
          "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold",
          ok ? "bg-emerald-600 text-white" : "bg-secondary text-foreground/70"
        )}>{ok ? "✓" : index}</span>
        <Label className="text-base font-semibold text-primary m-0">
          {title} <span className="text-destructive text-sm">*</span>
        </Label>
        <span className={cn("text-xs mr-auto", ok ? "text-emerald-700" : "text-muted-foreground")}>
          {len}/{minChars} תווים
        </span>
        {headerExtra}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{helper}</p>
      <Textarea
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="font-[Assistant] text-[15px] leading-[1.85] resize-y bg-background"
      />
    </div>
  );
}