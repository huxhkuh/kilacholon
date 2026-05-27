import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Search, Layers, GitCompare, Sparkles, TrendingUp, Clock, Shuffle, Pencil, Users } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/CategoryCard";
import EntryCard from "@/components/EntryCard";
import { categories, featuredEntries, recentEntries, getEntriesByCategory } from "@/data/content";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { useReadEntries } from "@/hooks/useReadEntries";

const browsingGates = [
  { slug: "keren-herum", title: "חיסכון משפחתי", text: "נזילות, חירום ופיקדונות." },
  { slug: "ribit-bank-israel", title: "המשק הרחב", text: "ריבית, אינפלציה ותוצר." },
  { slug: "machpil-revach", title: "ניתוח מניות", text: "דיבידנד ותמחור חברות." },
  { slug: "tshua-lapidyon", title: "אג\"ח מתקדם", text: "תשואה לפדיון ומח\"מ." },
];

const Index = () => {
  const { entries } = usePublishedEntries();
  const { readCount } = useReadEntries();
  const [randomPosition, setRandomPosition] = useState(() => Math.floor(Math.random() * 1000000));
  const featured = featuredEntries(entries);
  const recent = recentEntries(entries);
  const randomEntry = entries.length ? entries[randomPosition % entries.length] : undefined;

  useEffect(() => {
    document.title = "מיכלכלה — לומדים כלכלה ושוק ההון בשפה ברורה";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "מיכלכלה: אנציקלופדיה שיתופית לכלכלה, שוק ההון, חיסכון ופנסיה.");
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", "מיכלכלה — לומדים כלכלה ושוק ההון");
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", "אנציקלופדיה שיתופית למושגים בכלכלה, חיסכון והשקעות בשפה ברורה.");
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", window.location.origin);
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        {/* קישוט */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px, 90px 90px',
        }} />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />

        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold-soft text-sm mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <Users className="h-3.5 w-3.5" />
              <span>מיכלכלה · אנציקלופדיה שיתופית לכלכלה</span>
            </div>
            <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-balance mb-6">
              מילון כלכלה שכותבים
              <span className="block mt-2 text-gold-soft">יחד</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 leading-relaxed text-balance max-w-2xl mx-auto mb-10">
              אנציקלופדיה פתוחה למושגים בכלכלה, השקעות, פנסיה וחיסכון. קוראים ערכים, מתקנים, מוסיפים מקורות וכותבים ערכים חדשים.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold-soft shadow-gold h-12 px-7 text-base font-semibold">
                <Link to="/dictionary">
                  לפתיחת המילון
                  <ArrowLeft className="h-4 w-4 mr-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-7 text-base">
                <Link to="/edit?draft=1">
                  <Pencil className="h-4 w-4 ml-1" />
                  כתיבת ערך
                </Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-primary-foreground/70">
              <Link to="/categories" className="flex items-center gap-1.5 hover:text-gold-soft transition-colors">
                <Layers className="h-4 w-4" /> כל הקטגוריות
              </Link>
              <Link to="/search" className="flex items-center gap-1.5 hover:text-gold-soft transition-colors">
                <Search className="h-4 w-4" /> חיפוש מתקדם
              </Link>
              <Link to="/help/wiki-syntax" className="flex items-center gap-1.5 hover:text-gold-soft transition-colors">
                <GitCompare className="h-4 w-4" /> מדריך לכותבים
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container pt-12 md:pt-16">
        <div className="rounded-2xl border border-border bg-card shadow-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
            <div>
              <div className="text-sm font-semibold text-gold-deep mb-2">שערים במילון</div>
              <h2 className="heading-display text-2xl md:text-3xl text-primary">בחרו נושא והמשיכו דרך הקישורים</h2>
            </div>
            <Link to="/dictionary" className="text-sm text-primary hover:text-primary-soft flex items-center gap-1">
              לכל הערכים <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {browsingGates.map(item => (
              <Link key={item.slug} to={`/entry/${item.slug}`} className="rounded-xl border border-border/70 p-4 hover:border-gold/40 hover:bg-secondary/35 transition-colors">
                <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {randomEntry && (
        <section className="container pt-10">
          <div className="rounded-2xl border border-gold/30 bg-accent/25 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-gold-deep text-sm font-semibold mb-2">
                <Shuffle className="h-4 w-4" /> ערך אקראי
              </div>
              <h2 className="heading-display text-2xl text-primary mb-2">{randomEntry.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{randomEntry.shortDescription}</p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <Button asChild>
                <Link to={`/entry/${randomEntry.slug}`}>לקריאת הערך</Link>
              </Button>
              <Button variant="outline" onClick={() => setRandomPosition(Math.floor(Math.random() * 1000000))}>
                <Shuffle className="h-4 w-4" /> ערך אחר
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* קטגוריות ראשיות */}
      <section className="container py-16 md:py-20">
        <div className="text-center mb-12">
          <span className="gold-divider mb-4" />
          <h2 className="heading-display text-3xl md:text-4xl text-foreground mb-3">קטגוריות ראשיות</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">בחרו תחום שמעניין אתכם — כל קטגוריה מכילה ערכים מסודרים לפי רמת הקושי.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map(cat => (
            <CategoryCard
              key={cat.slug}
              category={cat}
              count={getEntriesByCategory(cat.slug, entries).length}
            />
          ))}
        </div>
      </section>

      {/* תוכן מרכזי + צד */}
      <section className="container py-12 md:py-16 bg-secondary/30 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent">
        <div className="md:bg-secondary/30 md:rounded-2xl md:p-8 lg:p-12">
          <div className="grid lg:grid-cols-[1fr_300px] gap-10">
            {/* תוכן */}
            <div>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-gold-deep mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">ערכים נבחרים</span>
                  </div>
                  <h2 className="heading-display text-2xl md:text-3xl text-foreground">מושגים שכדאי להכיר</h2>
                </div>
                <Link to="/search" className="text-sm text-primary hover:text-primary-soft hidden sm:flex items-center gap-1">
                  לכל הערכים <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {featured.map(e => <EntryCard key={e.slug} entry={e} />)}
              </div>
            </div>

            {/* sidebar */}
            <aside className="hidden lg:block space-y-6">
              <div className="rounded-xl bg-card border border-border/70 p-5 shadow-card">
                <h4 className="font-display font-semibold text-primary mb-3">סטטיסטיקות</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">סה"כ ערכים</span><span className="font-semibold">{entries.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">קטגוריות</span><span className="font-semibold">{categories.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">נקראו אצלכם</span><span className="font-semibold">{readCount}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ייעוד</span><span className="font-semibold">ידע שיתופי</span></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ערכים חדשים */}
      <section className="container py-12 md:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-gold-deep mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">נוסף לאחרונה</span>
            </div>
            <h2 className="heading-display text-2xl md:text-3xl text-foreground">ערכים חדשים</h2>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recent.slice(0, 6).map(e => <EntryCard key={e.slug} entry={e} />)}
        </div>
      </section>

      {/* CTA קהילה */}
      <section className="container py-16">
        <div className="rounded-2xl bg-gradient-hero text-primary-foreground p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative">
            <span className="gold-divider mb-5" />
            <h2 className="heading-display text-3xl md:text-4xl mb-4">זו אנציקלופדיה שיתופית</h2>
            <p className="text-primary-foreground/85 max-w-xl mx-auto mb-7">
              כל אחד יכול להציע ערך חדש, להוסיף מקור, ליצור קישור בין מושגים או לשפר ניסוח. עריכות נבדקות לפני שהן מתפרסמות לציבור.
            </p>
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold-soft shadow-gold h-12 px-8 font-semibold">
              <Link to="/edit?draft=1">
                כתיבת ערך חדש
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
