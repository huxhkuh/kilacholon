import { Link, useParams, useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, CheckCircle2, XCircle, Lightbulb, BookOpen, MessageCircle, FileText, History, Pencil } from "lucide-react";
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
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { cn } from "@/lib/utils";
import { useReadEntries } from "@/hooks/useReadEntries";

type Tab = "article" | "talk" | "history";

export default function EntryPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, isLoading } = usePublishedEntries();
  const { markRead } = useReadEntries();
  const entry = getEntry(slug, entries);
  const category = entry ? getCategory(entry.category) : undefined;
  const related = entry ? entry.related.map(s => entries.find(e => e.slug === s)).filter(Boolean) : [];

  const params = new URLSearchParams(window.location.search);
  const tab = (params.get("tab") as Tab) || "article";

  useEffect(() => {
    if (!entry) return;

    const description = entry.shortDescription.slice(0, 155);
    const canonical = new URL(`/entry/${entry.slug}`, window.location.origin).href;
    document.title = `${entry.title} — מיכלכלה`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
    markRead(entry.slug);
  }, [entry, markRead]);

  if (!entry && isLoading) {
    return <Layout><div className="container py-24 text-center text-muted-foreground">טוען ערך...</div></Layout>;
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
    ...(entry.pros.length || entry.cons.length ? [{ id: "pros-cons", label: "יתרונות וחסרונות" }] : []),
    ...(entry.faq.length ? [{ id: "faq", label: "שאלות נפוצות" }] : []),
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
    if (!user) navigate("/auth");
    else navigate(`/edit/${slug}`);
  }

  return (
    <Layout>
      <article className="container py-8 md:py-10">
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
                    <Badge variant="outline" className="border-gold/40 text-gold-deep bg-gold/5">{entry.level}</Badge>
                  </div>
                  <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl text-primary leading-tight mb-3 text-balance">{entry.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />עודכן ב-{new Date(entry.updatedAt).toLocaleDateString("he-IL")}</span>
                  </div>
                </header>

                <div className="mb-7 rounded-xl border border-border bg-accent/25 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm text-foreground/85 leading-relaxed m-0">
                    זהו ערך באנציקלופדיה שיתופית. מצאתם ניסוח חסר, מקור מועיל או קישור לערך אחר?
                  </p>
                  <Button size="sm" variant="outline" onClick={handleEdit} className="shrink-0">
                    <Pencil className="h-3.5 w-3.5" /> שפרו את הערך
                  </Button>
                </div>

                {/* תקציר */}
                <section id="summary" className="mb-8 scroll-mt-20">
                  <div className="rounded-xl bg-secondary/60 border-r-4 border-gold p-5 md:p-6">
                    <p className="text-base md:text-lg leading-[1.85] text-foreground/90 m-0">{entry.shortDescription}</p>
                  </div>
                </section>

                {/* הסבר מלא */}
                <section id="full" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gold" /> הסבר מלא
                  </h2>
                  <WikiText text={entry.fullDescription} knownEntries={entries} className="text-foreground/90 leading-[1.95] text-[17px]" />
                </section>

                {/* למה חשוב */}
                {entry.whyImportant && <section id="why" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border">למה זה חשוב?</h2>
                  <div className="rounded-xl bg-gradient-to-l from-accent/60 to-secondary/40 p-6 border border-gold/20">
                    <p className="text-base md:text-lg leading-[1.85] text-foreground/90 m-0">{entry.whyImportant}</p>
                  </div>
                </section>}

                {/* דוגמה */}
                {entry.example && <section id="example" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-gold" /> דוגמה פשוטה
                  </h2>
                  <div className="rounded-xl bg-card border border-border p-6 shadow-card">
                    <p className="text-base leading-[1.85] text-foreground/90 m-0">{entry.example}</p>
                  </div>
                </section>}

                {/* יתרונות וחסרונות */}
                {(entry.pros.length > 0 || entry.cons.length > 0) && <section id="pros-cons" className="mb-8 scroll-mt-20">
                  <h2 className="heading-display text-2xl md:text-3xl text-primary mb-3 pb-1.5 border-b border-border">יתרונות וחסרונות</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-5">
                      <h3 className="font-display font-semibold text-emerald-900 mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> יתרונות</h3>
                      <ul className="space-y-2">
                        {entry.pros.map((p, i) => (<li key={i} className="flex gap-2 text-sm leading-relaxed text-emerald-950/85"><span className="text-emerald-700 mt-1">•</span>{p}</li>))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-5">
                      <h3 className="font-display font-semibold text-rose-900 mb-3 flex items-center gap-2"><XCircle className="h-5 w-5" /> חסרונות</h3>
                      <ul className="space-y-2">
                        {entry.cons.map((c, i) => (<li key={i} className="flex gap-2 text-sm leading-relaxed text-rose-950/85"><span className="text-rose-700 mt-1">•</span>{c}</li>))}
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
                        <AccordionTrigger className="text-right hover:no-underline font-medium text-foreground py-4">{f.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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

          {/* Sidebar: infobox + TOC + ad */}
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
