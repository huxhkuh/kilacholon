import { Link, useParams, useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, CheckCircle2, XCircle, Lightbulb, BookOpen, MessageCircle, FileText, History, Pencil, Bookmark, BookmarkCheck, Printer, Share2, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Layout from "@/components/Layout";
import EntryCard from "@/components/EntryCard";
import Infobox from "@/components/wiki/Infobox";
import WikiText from "@/components/wiki/WikiText";
import TalkSection from "@/components/wiki/TalkSection";
import HistorySection from "@/components/wiki/HistorySection";
import { getEntry, getCategory } from "@/data/content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { appUrl, isSafeExternalUrl } from "@/lib/urls";
import { toast } from "sonner";
import "@/article.css";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { cn } from "@/lib/utils";
import { useReadEntries } from "@/hooks/useReadEntries";
import { readingMinutes } from '@/lib/entry-search';

type Tab = "article" | "talk" | "history";

export default function EntryPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { entries, isLoading, isCommunityLoading, catalogError, communityError, retry } = usePublishedEntries(slug);
  const { markRead } = useReadEntries();
  const { isSaved, toggleSaved } = useSavedEntries();
  const [fontSize, setFontSize] = useState(18);
  const entry = getEntry(slug, entries);
  const category = entry ? getCategory(entry.category) : undefined;
  const related = entry ? entry.related.map(s => entries.find(e => e.slug === s)).filter(Boolean) : [];

  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get("tab");
  const tab: Tab = requestedTab === "talk" || requestedTab === "history" ? requestedTab : "article";

  useEffect(() => {
    if (!entry) return;

    const description = entry.shortDescription.slice(0, 155);
    const canonical = appUrl(`/entry/${entry.slug}`);
    document.title = `${entry.title} — מיכלכלה`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
    if (tab === "article" && !entry.contentFile) markRead(entry.slug);
  }, [entry, markRead, tab]);

  if (entry?.contentFile || (!entry && (isLoading || isCommunityLoading || communityError))) {
    return <Layout><div className="container py-16 max-w-3xl">
      <h1 className="heading-display text-3xl text-primary mb-4">{entry?.title ?? 'טעינת ערך'}</h1>
      {entry && <p className="mb-5 text-muted-foreground">{entry.shortDescription}</p>}
      {catalogError || (!entry && communityError) ? <div role="alert"><p>תוכן הערך לא נטען כרגע. זו בעיית טעינה, ולא הודעה שהערך אינו קיים.</p>
        <div className="flex flex-wrap gap-3 mt-5"><Button onClick={retry}>ניסיון נוסף</Button>
          {entry?.contentFile && <Button variant="outline" asChild><a href={`${appUrl(`/entry/${entry.slug}`)}?view=static`}>פתיחת דף הקריאה</a></Button>}
          <Button variant="outline" asChild><Link to="/dictionary">לכל הערכים</Link></Button></div>
      </div> : <p role="status">טוען את תוכן הערך…</p>}
    </div></Layout>;
  }

  if (!entry) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="heading-display text-3xl text-primary mb-4">הערך לא נמצא</h1>
          <Button asChild><Link to="/">חזרה לעמוד הבית</Link></Button>
        </div>
      </Layout>
    );
  }

  const sections = [
    { id: "summary", label: "תקציר" },
    { id: "full", label: "הסבר מלא" },
    ...(entry.whyImportant ? [{ id: "why", label: "למה זה חשוב?" }] : []),
    ...(entry.example ? [{ id: "example", label: "דוגמה" }] : []),
    ...(entry.pros.length || entry.cons.length ? [{ id: "pros-cons", label: "שימושים ומגבלות" }] : []),
    ...(entry.faq.length ? [{ id: "faq", label: "שאלות נפוצות" }] : []),
    ...(entry.sources?.length ? [{ id: "sources", label: "מקורות והרחבה" }] : []),
    ...(related.length ? [{ id: "related", label: "ערכים קשורים" }] : []),
  ];

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "article", label: "ערך", icon: FileText },
    { id: "talk", label: "דיון", icon: MessageCircle },
    { id: "history", label: "היסטוריה", icon: History },
  ];

  function setTab(t: Tab) {
    const url = t === "article" ? `/entry/${slug}` : `/entry/${slug}?tab=${t}`;
    navigate(url);
  }

  function handleEdit() {
    navigate(`/edit/${slug}`);
  }

  return (
    <Layout>
      <article className="container py-8 md:py-10 encyclopedia-article">
        {/* breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-primary">ראשי</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          {category && <>
            <Link to={`/category/${category.slug}`} className="hover:text-primary">{category.name}</Link>
            <ArrowRight className="h-3.5 w-3.5" />
          </>}
          <span className="text-foreground/80">{entry.title}</span>
        </nav>

        {/* Wiki tabs bar */}
        <div className="border-b border-border flex items-end justify-between gap-3 mb-6 flex-wrap">
          <div className="flex">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-primary hover:bg-secondary/40"
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={handleEdit} className="mb-1">
            <Pencil className="h-3.5 w-3.5" /> הצעת עריכה
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          <div className="min-w-0">
            {tab === "article" && (
              <>
                {/* כותרת */}
                <header className="mb-6 pb-5 border-b border-border/70">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {category && (
                      <Link to={`/category/${category.slug}`}>
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">{category.name}</Badge>
                      </Link>
                    )}
                    {category?.name !== entry.level && <Badge variant="outline" className="border-gold/40 text-gold-deep bg-gold/5">{entry.level}</Badge>}
                  </div>
                  <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl text-primary leading-tight mb-3 text-balance">{entry.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{readingMinutes(entry)} דקות קריאה</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />עודכן ב-{new Date(entry.updatedAt).toLocaleDateString("he-IL")}</span>
                  </div>
                </header>

                <div className="article-tools flex flex-wrap items-center gap-2 mb-6" aria-label="כלי קריאה">
                  <Button variant="outline" size="sm" onClick={() => toggleSaved(entry.slug)} aria-pressed={isSaved(entry.slug)}>
                    {isSaved(entry.slug) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}{isSaved(entry.slug) ? 'נשמר לקריאה' : 'שמירה לקריאה'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />הדפסה</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    try { await navigator.clipboard.writeText(appUrl(`/entry/${entry.slug}`)); toast.success('הקישור הועתק'); }
                    catch { toast.error('לא ניתן להעתיק אוטומטית. אפשר להעתיק את כתובת העמוד.'); }
                  }}><Share2 className="h-4 w-4" />העתקת קישור</Button>
                  <div className="flex items-center gap-2 border border-border rounded-md px-2 h-9">
                    <button aria-label="הקטנת טקסט" disabled={fontSize <= 16} onClick={() => setFontSize(size => Math.max(16, size - 1))} className="px-2 disabled:opacity-30">א−</button>
                    <span className="text-xs text-muted-foreground">גודל טקסט</span>
                    <button aria-label="הגדלת טקסט" disabled={fontSize >= 24} onClick={() => setFontSize(size => Math.min(24, size + 1))} className="px-2 disabled:opacity-30">א+</button>
                  </div>
                </div>
                {entry.tags.includes('קצרמר') && <div className="mb-6 border-r-4 border-gold bg-secondary p-4"><strong>ערך בתחילת הדרך.</strong> יש כאן נקודת פתיחה ללימוד ולכתיבה; הערך עדיין דורש הרחבה ומקורות נוספים.</div>}
                <details className="lg:hidden mb-6 rounded-md border border-border p-4"><summary className="font-semibold cursor-pointer">תוכן הערך</summary><ul className="pt-3 space-y-2">{sections.map(section => <li key={section.id}><a href={`#${section.id}`} className="text-primary underline underline-offset-4">{section.label}</a></li>)}</ul></details>

                {/* תקציר */}
                <section id="summary" className="mb-8 scroll-mt-20">
                  <div className="rounded-xl bg-secondary/60 border-r-4 border-gold p-5 md:p-6">
                    <p style={{ fontSize }} className="text-base md:text-lg leading-[1.85] text-foreground/90 m-0">{entry.shortDescription}</p>
                  </div>
                </section>

                {/* הסבר מלא */}
                <section id="full" className="mb-8 scroll-mt-20" style={{ fontSize }}>
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gold" /> הסבר מלא
                  </h2>
                  <WikiText text={entry.fullDescription} knownEntries={entries} className="article-content text-foreground/90" />
                </section>

                {/* למה חשוב */}
                {entry.whyImportant && <section id="why" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border">למה זה חשוב?</h2>
                  <div className="rounded-xl bg-gradient-to-l from-accent/60 to-secondary/40 p-6 border border-gold/20">
                    <p style={{ fontSize }} className="text-base md:text-lg leading-[1.85] text-foreground/90 m-0">{entry.whyImportant}</p>
                  </div>
                </section>}

                {/* דוגמה */}
                {entry.example && <section id="example" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-gold" /> דוגמה פשוטה
                  </h2>
                  <div className="rounded-xl bg-card border border-border p-6 shadow-card">
                    <p style={{ fontSize }} className="text-base leading-[1.85] text-foreground/90 m-0">{entry.example}</p>
                  </div>
                </section>}

                {/* שימושים ומגבלות */}
                {(entry.pros.length > 0 || entry.cons.length > 0) && <section id="pros-cons" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border">שימושים ומגבלות</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-5">
                      <h3 className="font-display font-semibold text-emerald-900 mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> מה אפשר ללמוד</h3>
                      <ul className="space-y-2">
                        {entry.pros.map((p, i) => (<li key={i} style={{ fontSize }} className="flex gap-2 text-sm leading-relaxed text-emerald-950/85"><span className="text-emerald-700 mt-1">•</span>{p}</li>))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-5">
                      <h3 className="font-display font-semibold text-rose-900 mb-3 flex items-center gap-2"><XCircle className="h-5 w-5" /> מגבלות וטעויות נפוצות</h3>
                      <ul className="space-y-2">
                        {entry.cons.map((c, i) => (<li key={i} style={{ fontSize }} className="flex gap-2 text-sm leading-relaxed text-rose-950/85"><span className="text-rose-700 mt-1">•</span>{c}</li>))}
                      </ul>
                    </div>
                  </div>
                </section>}

                {/* FAQ */}
                {entry.faq.length > 0 && <section id="faq" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border">שאלות נפוצות</h2>
                  <Accordion type="single" collapsible className="rounded-xl border border-border bg-card overflow-hidden">
                    {entry.faq.map((f, i) => (
                      <AccordionItem key={i} value={`q-${i}`} className="border-b border-border last:border-0 px-5">
                        <AccordionTrigger style={{ fontSize }} className="text-right hover:no-underline font-medium text-foreground py-4">{f.q}</AccordionTrigger>
                        <AccordionContent style={{ fontSize }} className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>}

                {!!entry.sources?.length && <section id="sources" className="mb-8 scroll-mt-24">
                  <h2 className="heading-display text-2xl text-primary mb-4">מקורות והרחבה</h2>
                  <ul className="space-y-3">{entry.sources.filter(source => isSafeExternalUrl(source.url)).map(source => <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 break-words">{source.title}</a>
                  </li>)}</ul>
                  <p className="mt-4 text-sm text-muted-foreground">הדוגמאות המספריות נועדו להמחשה, אלא אם צוין אחרת. התנאים בפועל תלויים במוצר, במדינה ובמועד הבדיקה.</p>
                </section>}

                {related.length > 0 && (
                  <section id="related" className="mb-8 scroll-mt-20">
                    <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border">ערכים קשורים</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {related.map(e => e && <EntryCard key={e.slug} entry={e} compact />)}
                    </div>
                  </section>
                )}
              </>
            )}

            {tab === "talk" && (
              <div>
                <header className="mb-6 pb-4 border-b border-border">
                  <h1 className="heading-display text-2xl md:text-3xl text-primary mb-1">דיון: {entry.title}</h1>
                  <p className="text-sm text-muted-foreground">דיון, שאלות, והצעות לתיקון הערך.</p>
                </header>
                <TalkSection slug={slug} />
              </div>
            )}

            {tab === "history" && (
              <div>
                <header className="mb-6 pb-4 border-b border-border">
                  <h1 className="heading-display text-2xl md:text-3xl text-primary mb-1">היסטוריית עריכות: {entry.title}</h1>
                  <p className="text-sm text-muted-foreground">כל גרסאות הערך מוצגות לפי סדר כרונולוגי הפוך.</p>
                </header>
                <HistorySection slug={slug} />
              </div>
            )}
          </div>

          {/* Article details and table of contents */}
          <aside className="space-y-5">
            <Infobox entry={entry} category={category} />
            {tab === "article" && (
              <nav className="rounded-xl bg-card border border-border/70 p-5 shadow-card hidden lg:block sticky top-24">
                <h4 className="font-display font-semibold text-primary mb-3 text-sm uppercase tracking-wider">תוכן הערך</h4>
                <ul className="space-y-1.5">
                  {sections.map(s => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="block text-sm text-muted-foreground hover:text-primary py-1 transition-colors">{s.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </article>
    </Layout>
  );
}
