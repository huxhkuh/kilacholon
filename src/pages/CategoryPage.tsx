import { useDeferredValue, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import Layout from "@/components/Layout";
import EntryCard from "@/components/EntryCard";
import EntryFilter from "@/components/EntryFilters";
import CategoryIcon from "@/components/CategoryIcon";
import { getCategory, getEntriesByCategory } from "@/data/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { isStubEntry, searchEntries } from "@/lib/entry-search";

function CategoryContents({ slug }: { slug: string }) {
  const { entries: publishedEntries } = usePublishedEntries();
  const category = getCategory(slug);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [level, setLevel] = useState("");
  const [type, setType] = useState("");
  const [visible, setVisible] = useState(24);
  const entries = useMemo(() => getEntriesByCategory(slug, publishedEntries), [slug, publishedEntries]);
  const results = useMemo(() => searchEntries(entries.filter(entry => (!level || level === entry.level) && (type !== "stub" || isStubEntry(entry)) && (type !== "full" || !isStubEntry(entry))), deferredQuery), [entries, level, type, deferredQuery]);
  if (!category) return <Layout><div className="container page-space"><div className="page-heading"><h1>הקטגוריה לא נמצאה</h1><p>אפשר להמשיך דרך רשימת תחומי הידע.</p></div><Button asChild><Link to="/categories">לכל הקטגוריות</Link></Button></div></Layout>;
  return <Layout><div className="container page-space">
    <Link to="/categories" className="text-link mb-7"><ArrowRight className="size-4" /> כל תחומי הידע</Link>
    <div className="page-heading category-page-heading"><CategoryIcon name={category.icon} className="size-10 text-primary" /><div><h1>{category.name}</h1><p>{category.description}. {entries.length} ערכים להרחבת הידע.</p></div></div>
    <div className="category-filters">
      <div className="search-field"><Search aria-hidden="true" /><label htmlFor="category-search" className="sr-only">חיפוש בקטגוריה</label><Input id="category-search" type="search" placeholder="חיפוש בתוך הקטגוריה..." value={query} onChange={event => { setQuery(event.target.value); setVisible(24); }} /></div>
      <EntryFilter label="רמת היכרות" value={level} onChange={value => { setLevel(value); setVisible(24); }} options={[{ value: "all", label: "כל הרמות" }, ...["מתחילים", "בינוני", "מתקדם"].map(value => ({ value, label: value }))]} />
      <EntryFilter label="סוג ערך" value={type} onChange={value => { setType(value); setVisible(24); }} options={[{ value: "all", label: "כל הערכים" }, { value: "full", label: "ערכים מלאים" }, { value: "stub", label: "קצרמרים" }]} />
    </div>
    <div className="results-summary"><p role="status">{results.length} ערכים נמצאו</p><Link to={`/search?category=${slug}`} className="text-link">חיפוש מתקדם</Link></div>
    {results.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{results.slice(0, visible).map(entry => <EntryCard key={entry.slug} entry={entry} />)}</div> : <div className="empty-state"><h2>לא נמצאו ערכים בסינון הזה</h2><p>נסו חיפוש אחר או הסירו את הסינונים.</p><Button variant="outline" onClick={() => { setQuery(""); setLevel(""); setType(""); }}>איפוס החיפוש</Button></div>}
    {results.length > visible && <div className="load-more"><p>מוצגים {visible} מתוך {results.length}</p><Button variant="outline" size="lg" onClick={() => setVisible(count => count + 24)}>טענו ערכים נוספים</Button></div>}
  </div></Layout>;
}
export default function CategoryPage() {
  const { slug = "" } = useParams();
  return <CategoryContents key={slug} slug={slug} />;
}
