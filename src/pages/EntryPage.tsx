import { Link, useParams } from "react-router-dom";
import { Eye, Calendar, Tag, ArrowRight, CheckCircle2, XCircle, Lightbulb, BookOpen, MessageCircle } from "lucide-react";
import Layout from "@/components/Layout";
import AdSlot from "@/components/AdSlot";
import EntryCard from "@/components/EntryCard";
import { getEntry, getCategory, entries as allEntries } from "@/data/content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useEffect } from "react";

export default function EntryPage() {
  const { slug = "" } = useParams();
  const entry = getEntry(slug);
  const category = entry ? getCategory(entry.category) : undefined;
  const related = entry ? entry.related.map(s => allEntries.find(e => e.slug === s)).filter(Boolean) : [];

  useEffect(() => {
    if (entry) {
      document.title = `${entry.title} — פדיה פיננסית`;
    }
  }, [entry]);

  if (!entry) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="heading-display text-3xl text-primary mb-4">הערך לא נמצא</h1>
          <Link to="/"><Button>חזרה לעמוד הבית</Button></Link>
        </div>
      </Layout>
    );
  }

  const sections = [
    { id: "summary", label: "תקציר" },
    { id: "full", label: "הסבר מלא" },
    { id: "why", label: "למה זה חשוב?" },
    { id: "example", label: "דוגמה" },
    { id: "pros-cons", label: "יתרונות וחסרונות" },
    { id: "faq", label: "שאלות נפוצות" },
    { id: "related", label: "ערכים קשורים" },
  ];

  return (
    <Layout>
      <article className="container py-10 md:py-14">
        {/* breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-primary">ראשי</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          {category && <>
            <Link to={`/category/${category.slug}`} className="hover:text-primary">{category.name}</Link>
            <ArrowRight className="h-3.5 w-3.5" />
          </>}
          <span className="text-foreground/80">{entry.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_260px] gap-10">
          {/* תוכן ראשי */}
          <div className="min-w-0">
            {/* כותרת */}
            <header className="mb-8 pb-6 border-b border-border/70">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {category && (
                  <Link to={`/category/${category.slug}`}>
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                      {category.name}
                    </Badge>
                  </Link>
                )}
                <Badge variant="outline" className="border-gold/40 text-gold-deep bg-gold/5">{entry.level}</Badge>
              </div>
              <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl text-primary leading-tight mb-4 text-balance">{entry.title}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{entry.views.toLocaleString('he-IL')} צפיות</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />עודכן ב-{new Date(entry.updatedAt).toLocaleDateString('he-IL')}</span>
                <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" />{entry.tags.join(", ")}</span>
              </div>
            </header>

            {/* תקציר מודגש */}
            <section id="summary" className="mb-10 scroll-mt-20">
              <div className="rounded-xl bg-secondary/60 border-r-4 border-gold p-5 md:p-6">
                <p className="text-base md:text-lg leading-[1.85] text-foreground/90 m-0">{entry.shortDescription}</p>
              </div>
            </section>

            {/* הסבר מלא */}
            <section id="full" className="mb-10 scroll-mt-20">
              <h2 className="heading-display text-2xl md:text-3xl text-primary mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-gold" /> הסבר מלא
              </h2>
              <div className="prose-rtl text-foreground/90">
                <p>{entry.fullDescription}</p>
              </div>
            </section>

            {/* פרסומת בין מקטעי תוכן */}
            <div className="my-10">
              <AdSlot variant="inline" />
            </div>

            {/* למה חשוב */}
            <section id="why" className="mb-10 scroll-mt-20">
              <h2 className="heading-display text-2xl md:text-3xl text-primary mb-4">למה זה חשוב?</h2>
              <div className="rounded-xl bg-gradient-to-l from-accent/60 to-secondary/40 p-6 border border-gold/20">
                <p className="text-base md:text-lg leading-[1.85] text-foreground/90 m-0">{entry.whyImportant}</p>
              </div>
            </section>

            {/* דוגמה */}
            <section id="example" className="mb-10 scroll-mt-20">
              <h2 className="heading-display text-2xl md:text-3xl text-primary mb-4 flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-gold" /> דוגמה פשוטה
              </h2>
              <div className="rounded-xl bg-card border border-border p-6 shadow-card">
                <p className="text-base leading-[1.85] text-foreground/90 m-0">{entry.example}</p>
              </div>
            </section>

            {/* יתרונות וחסרונות */}
            <section id="pros-cons" className="mb-10 scroll-mt-20">
              <h2 className="heading-display text-2xl md:text-3xl text-primary mb-4">יתרונות וחסרונות</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-5">
                  <h3 className="font-display font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> יתרונות
                  </h3>
                  <ul className="space-y-2">
                    {entry.pros.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-emerald-950/85">
                        <span className="text-emerald-700 mt-1">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-5">
                  <h3 className="font-display font-semibold text-rose-900 mb-3 flex items-center gap-2">
                    <XCircle className="h-5 w-5" /> חסרונות
                  </h3>
                  <ul className="space-y-2">
                    {entry.cons.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-rose-950/85">
                        <span className="text-rose-700 mt-1">•</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-10 scroll-mt-20">
              <h2 className="heading-display text-2xl md:text-3xl text-primary mb-4">שאלות נפוצות</h2>
              <Accordion type="single" collapsible className="rounded-xl border border-border bg-card overflow-hidden">
                {entry.faq.map((f, i) => (
                  <AccordionItem key={i} value={`q-${i}`} className="border-b border-border last:border-0 px-5">
                    <AccordionTrigger className="text-right hover:no-underline font-medium text-foreground py-4">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* ערכים קשורים */}
            {related.length > 0 && (
              <section id="related" className="mb-10 scroll-mt-20">
                <h2 className="heading-display text-2xl md:text-3xl text-primary mb-4">ערכים קשורים</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {related.map(e => e && <EntryCard key={e.slug} entry={e} compact />)}
                </div>
              </section>
            )}

            {/* תגובות placeholder */}
            <section className="mt-12 pt-8 border-t border-border/70">
              <h2 className="heading-display text-xl text-primary mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-gold" /> תגובות
              </h2>
              <div className="rounded-xl bg-secondary/40 border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
                מערכת התגובות תיפתח בקרוב — לאחר חיבור מערכת המשתמשים.
              </div>
            </section>
          </div>

          {/* תוכן עניינים + פרסומת */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <nav className="rounded-xl bg-card border border-border/70 p-5 shadow-card">
                <h4 className="font-display font-semibold text-primary mb-3 text-sm uppercase tracking-wider">תוכן הערך</h4>
                <ul className="space-y-1.5">
                  {sections.map(s => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="block text-sm text-muted-foreground hover:text-primary py-1 transition-colors">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <AdSlot variant="sidebar" />
            </div>
          </aside>
        </div>
      </article>
    </Layout>
  );
}
