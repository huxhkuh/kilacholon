import { useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bookmark, RotateCcw, Search as SearchIcon, X } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EntryCard from "@/components/EntryCard";
import EntryFilter from "@/components/EntryFilters";
import { categories } from "@/data/content";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { isStubEntry, searchEntries } from "@/lib/entry-search";

const PAGE_SIZE = 24;
export default function SearchPage() {
  const { entries } = usePublishedEntries();
  const { isSaved } = useSavedEntries();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const deferredQuery = useDeferredValue(query);
  const category = params.get("category") ?? "";
  const level = params.get("level") ?? "";
  const type = params.get("type") ?? "";
  const sort = params.get("sort") ?? "";
  const saved = params.get("saved") === "1";
  const [visible, setVisible] = useState(PAGE_SIZE);
  const update = (key: string, value: string) => {
    setVisible(PAGE_SIZE);
    setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: true });
  };
  const results = useMemo(() => {
    let filtered = entries.filter(entry => (!category || entry.category === category)
      && (!level || entry.level === level)
      && (!saved || isSaved(entry.slug))
      && (type !== "stub" || isStubEntry(entry))
      && (type !== "full" || !isStubEntry(entry)));
    filtered = searchEntries(filtered, deferredQuery);
    if (sort === "az") filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title, "he"));
    if (sort === "recent") filtered = [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return filtered;
  }, [entries, category, level, saved, isSaved, type, deferredQuery, sort]);
  const hasFilters = !!(query || category || level || type || sort);

  return (
    <Layout>
      <div className="container page-space">
        <div className="page-heading"><h1>{saved ? "רשימת הקריאה שלי." : "כל הידע. חיפוש אחד."}</h1><p>{saved ? "הערכים ששמרתם מחכים כאן. הרשימה נשמרת בדפדפן הזה." : "חפשו מושג, גלו קשרים והעמיקו בנושאים שמעניינים אתכם."}</p></div>
        <div className="search-field mb-4">
          <SearchIcon aria-hidden="true" />
          <label className="sr-only" htmlFor="entry-search">חיפוש ערכים</label>
          <Input id="entry-search" type="search" placeholder="חפשו מושג, שאלה או נושא..." value={query} onChange={event => update("q", event.target.value)} />
          {query && <Button size="icon" variant="ghost" aria-label="ניקוי החיפוש" onClick={() => update("q", "")}><X /></Button>}
        </div>
        <div className="filter-bar">
          <EntryFilter label="תחום דעת" value={category} onChange={value => update("category", value)} options={[{ value: "all", label: "כל התחומים" }, ...categories.map(item => ({ value: item.slug, label: item.name }))]} />
          <EntryFilter label="רמת היכרות" value={level} onChange={value => update("level", value)} options={[{ value: "all", label: "כל הרמות" }, ...["מתחילים", "בינוני", "מתקדם"].map(value => ({ value, label: value }))]} />
          <EntryFilter label="סוג ערך" value={type} onChange={value => update("type", value)} options={[{ value: "all", label: "כל הערכים" }, { value: "full", label: "ערכים מלאים" }, { value: "stub", label: "קצרמרים להרחבה" }]} />
          <EntryFilter label="מיון" value={sort} onChange={value => update("sort", value)} options={[{ value: "all", label: "רלוונטיות" }, { value: "az", label: "לפי א׳–ב׳" }, { value: "recent", label: "עודכנו לאחרונה" }]} />
          <Button variant="ghost" disabled={!hasFilters} onClick={() => { setVisible(PAGE_SIZE); setParams(saved ? { saved: "1" } : {}, { replace: true }); }}><RotateCcw />איפוס</Button>
        </div>
        <div className="results-summary">
          <p role="status" aria-live="polite">{results.length.toLocaleString("he-IL")} ערכים {saved ? "ברשימת הקריאה" : "נמצאו"}</p>
          <span>{query ? `תוצאות עבור: ״${query}״` : "הסבר אחד יכול לפתוח עולם שלם."}</span>
        </div>
        {results.length ? <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy={query !== deferredQuery}>
            {results.slice(0, visible).map(entry => <EntryCard key={entry.slug} entry={entry} />)}
          </div>
          <div className="load-more">
            <p>מוצגים {Math.min(visible, results.length)} מתוך {results.length} ערכים</p>
            {visible < results.length && <Button variant="outline" size="lg" onClick={() => setVisible(count => count + PAGE_SIZE)}>טענו ערכים נוספים</Button>}
          </div>
        </> : <Alert className="my-8"><Bookmark /><AlertTitle>{saved && !hasFilters ? "כאן מתחילה רשימת הקריאה שלכם" : "לא נמצאו ערכים תואמים"}</AlertTitle><AlertDescription>
          <p className="mb-4">{saved && !hasFilters ? "לחצו על סמל הסימנייה ליד כל ערך כדי לשמור אותו לקריאה בהמשך." : "נסו מונח קצר יותר, כתיב אחר או הסירו חלק מהסינונים."}</p>
          <Button asChild variant="outline"><Link to={saved ? "/search" : "/dictionary"}>{saved ? "לגילוי ערכים" : "למילון המושגים"}</Link></Button>
        </AlertDescription></Alert>}
      </div>
    </Layout>
  );
}
