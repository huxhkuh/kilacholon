import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, GraduationCap, Search, Shuffle, Users } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import EntryCard from "@/components/EntryCard";
import CategoryIcon from "@/components/CategoryIcon";
import { categories, featuredEntries, recentEntries } from "@/data/content";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { isStubEntry } from "@/lib/entry-search";

export default function Index() {
  const { entries } = usePublishedEntries();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const complete = useMemo(() => entries.filter(entry => !isStubEntry(entry)), [entries]);
  const spotlight = complete.find(entry => entry.slug === "ribit-deribit") ?? complete.find(entry => entry.title.includes("דריבית")) ?? complete[0];
  const featured = featuredEntries(complete).slice(0, 6);
  const recent = recentEntries(complete).filter(entry => !featured.some(item => item.slug === entry.slug)).slice(0, 3);
  const stubCount = entries.length - complete.length;
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach(entry => counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1));
    return counts;
  }, [entries]);

  const homepageCategoryOrder = ["beginners", "household", "microeconomics", "economy", "stocks", "banking", "business", "research", "labor-environment", "pension", "insurance", "people"];
  const homepageCategories = homepageCategoryOrder
    .map(slug => categories.find(category => category.slug === slug))
    .filter((category): category is typeof categories[number] => !!category && !!categoryCounts.get(category.slug));

  return (
    <Layout>
      <section className="container home-hero">
        <div>
          <h1 className="hero-title">עניינים של כסף.<br /><span>מילים שעושות סדר.</span></h1>
          <p className="hero-lead">להבין כלכלה, מושג אחד בכל פעם.</p>
          <p className="hero-description">אנציקלופדיה שיתופית לכלכלה, חיסכון ושוק ההון.<br className="hidden sm:block" /> הסברים ברורים, דוגמאות ומקורות — במקום אחד.</p>
          <form role="search" className="hero-search" onSubmit={event => { event.preventDefault(); navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`); }}>
            <Search className="size-5 shrink-0" aria-hidden="true" />
            <label htmlFor="home-search" className="sr-only">חיפוש באנציקלופדיה</label>
            <input id="home-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="חפשו מושג, שאלה או נושא..." />
            <Button type="submit">חיפוש</Button>
          </form>
          <div className="hero-suggestions" aria-label="מושגים להתחלה">
            {["אינפלציה", "ריבית דריבית", "קרן סל"].map(term => <Link key={term} to={`/search?q=${encodeURIComponent(term)}`}>{term}</Link>)}
          </div>
        </div>
        {spotlight && <aside className="hero-spotlight">
          <BookOpen className="size-10 text-primary" strokeWidth={1.4} aria-hidden="true" />
          <p className="spotlight-label">ערך להתחיל איתו</p>
          <h2 className="font-display text-4xl font-bold text-primary">{spotlight.title}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{spotlight.shortDescription}</p>
          <Link to={`/entry/${spotlight.slug}`} className="text-link mt-auto">לקריאת הערך <ArrowLeft className="size-4" /></Link>
        </aside>}
      </section>

      <div className="container">
        <div className="knowledge-strip">
          <div><BookOpen /><p><strong>אנציקלופדיה פתוחה</strong><span>{entries.length.toLocaleString("he-IL")} ערכים ב־{categories.length} תחומי ידע</span></p></div>
          <div><GraduationCap /><p><strong>לומדים בקצב שלכם</strong><span>הסברים, דוגמאות וקישורים להעמקה</span></p></div>
          <div><Users /><p><strong>נכתבת יחד</strong><span>אפשר להציע תיקונים ולהוסיף מקורות</span></p></div>
        </div>
      </div>

      <section className="container section-space">
        <div className="section-heading"><div><h2>מאיפה מתחילים?</h2><p>בחרו את התחום שמעניין אתכם.</p></div><Link to="/categories" className="text-link">כל תחומי הידע <ArrowLeft className="size-4" /></Link></div>
        <div className="category-index">
          {homepageCategories.map(category => <Link key={category.slug} to={`/category/${category.slug}`} className="category-index-item">
            <CategoryIcon name={category.icon} className="size-7" />
            <div><h3>{category.name}</h3><span>{categoryCounts.get(category.slug) ?? 0} ערכים</span></div>
            <ArrowLeft className="size-4 mr-auto" aria-hidden="true" />
          </Link>)}
        </div>
      </section>

      <section className="feature-band section-space">
        <div className="container">
          <div className="section-heading"><div><h2>מושגים שכדאי להכיר</h2><p>נקודות פתיחה טובות להבנת התמונה הרחבה.</p></div><Link to="/dictionary" className="text-link">למילון המושגים <ArrowLeft className="size-4" /></Link></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featured.map(entry => <EntryCard key={entry.slug} entry={entry} />)}</div>
        </div>
      </section>

      <section className="container section-space">
        <div className="section-heading"><div><h2>עוד משהו לגלות</h2><p>ערכים נוספים שפותחים כיווני מחשבה חדשים.</p></div>
          <Button variant="outline" disabled={!complete.length} onClick={() => { const entry = complete[Math.floor(Math.random() * complete.length)]; if (entry) navigate(`/entry/${entry.slug}`); }}><Shuffle />ערך בהפתעה</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{recent.map(entry => <EntryCard key={entry.slug} entry={entry} />)}</div>
      </section>

      <section className="container pb-16">
        <div className="contribute-panel">
          <div><h2 className="font-display text-3xl md:text-4xl font-bold">הידע הזה גדל בזכות כולנו.</h2><p className="mt-3 max-w-2xl text-lg leading-relaxed">נתקלתם בניסוח שאפשר לדייק? חסר מקור טוב? הציעו שיפור לערך קיים או כתבו ערך חדש. העריכות נבדקות לפני הפרסום.</p></div>
          <div className="flex flex-col gap-3 shrink-0"><Button asChild size="lg"><Link to="/edit?draft=1">כתיבת ערך חדש <ArrowLeft /></Link></Button><Link to="/search?type=stub" className="text-link justify-center">{stubCount} קצרמרים מחכים להרחבה</Link></div>
        </div>
      </section>
    </Layout>
  );
}
