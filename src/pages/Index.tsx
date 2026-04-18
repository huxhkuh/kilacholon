import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, Layers, GitCompare, Sparkles, TrendingUp, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/CategoryCard";
import EntryCard from "@/components/EntryCard";
import AdSlot from "@/components/AdSlot";
import { categories, popularEntries, recentEntries, getEntriesByCategory, entries } from "@/data/content";

const Index = () => {
  const popular = popularEntries();
  const recent = recentEntries();

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
              <span>אנציקלופדיה דיגיטלית מקיפה</span>
            </div>
            <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-balance mb-6">
              שוק ההון בשפה ברורה
              <span className="block mt-2 text-gold-soft">לציבור החרדי</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 leading-relaxed text-balance max-w-2xl mx-auto mb-10">
              מדריכים, מושגים, השוואות והסברים פשוטים על השקעות, פנסיה וחיסכון — בשפה מכובדת ונגישה לכל אחד.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/category/beginners">
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold-soft shadow-gold h-12 px-7 text-base font-semibold">
                  להתחיל מהבסיס
                  <ArrowLeft className="h-4 w-4 mr-1" />
                </Button>
              </Link>
              <Link to="/dictionary">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-7 text-base">
                  <BookOpen className="h-4 w-4 ml-1" />
                  מילון מושגים
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-primary-foreground/70">
              <Link to="/categories" className="flex items-center gap-1.5 hover:text-gold-soft transition-colors">
                <Layers className="h-4 w-4" /> כל הקטגוריות
              </Link>
              <Link to="/search" className="flex items-center gap-1.5 hover:text-gold-soft transition-colors">
                <Search className="h-4 w-4" /> חיפוש מתקדם
              </Link>
              <Link to="/category/faq" className="flex items-center gap-1.5 hover:text-gold-soft transition-colors">
                <GitCompare className="h-4 w-4" /> השוואות
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* באנר פרסומת עליון עדין */}
      <section className="container pt-8">
        <AdSlot variant="banner" label="מקום פרסום — באנר עליון מכובד" />
      </section>

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
              count={getEntriesByCategory(cat.slug).length}
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
                    <span className="text-sm font-semibold uppercase tracking-wider">פופולריים השבוע</span>
                  </div>
                  <h2 className="heading-display text-2xl md:text-3xl text-foreground">הערכים הנקראים ביותר</h2>
                </div>
                <Link to="/search" className="text-sm text-primary hover:text-primary-soft hidden sm:flex items-center gap-1">
                  לכל הערכים <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {popular.map(e => <EntryCard key={e.slug} entry={e} />)}
              </div>
            </div>

            {/* sidebar */}
            <aside className="hidden lg:block space-y-6">
              <AdSlot variant="sidebar" label="מקום פרסום צדדי" />
              <div className="rounded-xl bg-card border border-border/70 p-5 shadow-card">
                <h4 className="font-display font-semibold text-primary mb-3">סטטיסטיקות</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">סה"כ ערכים</span><span className="font-semibold">{entries.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">קטגוריות</span><span className="font-semibold">{categories.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">צפיות החודש</span><span className="font-semibold">{entries.reduce((s, e) => s + e.views, 0).toLocaleString('he-IL')}</span></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* פרסומת בין מקטעים */}
      <section className="container py-8">
        <AdSlot variant="inline" label="מקום פרסום בין מקטעי תוכן" />
      </section>

      {/* ערכים חדשים */}
      <section className="container py-12 md:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-gold-deep mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">מתעדכן ביומיומיומיו</span>
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
            <h2 className="heading-display text-3xl md:text-4xl mb-4">הצטרפו לקהילת הכותבים</h2>
            <p className="text-primary-foreground/85 max-w-xl mx-auto mb-7">
              יודעים על נושא? רוצים לתרום מהידע שלכם? פתחו חשבון, הציעו ערך חדש או תיקון — וצוות העורכים יבחן בקפידה.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold-soft shadow-gold h-12 px-8 font-semibold">
                להרשמה חינם
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
