import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getCategory, type Entry } from "@/data/content";
import { Badge } from "@/components/ui/badge";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";
import { useReadEntries } from "@/hooks/useReadEntries";
import { isStubEntry, normalizeSearch, searchEntries } from "@/lib/entry-search";
import { appUrl } from '@/lib/urls';

const LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת"];
const finalLetters: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
function firstLetter(title: string) { const letter = normalizeSearch(title)[0] ?? ""; return LETTERS.includes(letter) ? letter : finalLetters[letter] ?? "#"; }

export default function Dictionary() {
  const { entries } = usePublishedEntries();
  const { isRead, readCount } = useReadEntries();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [letter, setLetter] = useState("all");
  const [type, setType] = useState("all");
  const [visible, setVisible] = useState(60);
  const matching = useMemo(() => searchEntries(entries, deferredQuery)
    .filter(entry => type === "all" || (type === "stub" ? isStubEntry(entry) : !isStubEntry(entry)))
    .sort((a, b) => a.title.localeCompare(b.title, "he")), [entries, deferredQuery, type]);
  const available = new Set(matching.map(entry => firstLetter(entry.title)));
  const filtered = matching.filter(entry => letter === "all" || firstLetter(entry.title) === letter);
  const grouped = new Map<string, Entry[]>();
  filtered.slice(0, visible).forEach(entry => { const key = firstLetter(entry.title); grouped.set(key, [...(grouped.get(key) ?? []), entry]); });

  return <Layout><div className="container page-space">
    <div className="page-heading"><h1>מילים קטנות. הבנה גדולה.</h1><p>מילון המושגים של מיכלכלה, מסודר מא׳ ועד ת׳.</p></div>
    <div className="dictionary-toolbar">
      <div className="search-field"><Search aria-hidden="true" /><label htmlFor="dictionary-search" className="sr-only">חיפוש במילון המושגים</label><Input id="dictionary-search" type="search" placeholder="איזה מושג מסקרן אתכם?" value={query} onChange={event => { setQuery(event.target.value); setLetter("all"); setVisible(60); }} /></div>
      <ToggleGroup type="single" variant="outline" value={type} onValueChange={value => { if (value) { setType(value); setVisible(60); } }} aria-label="סוג ערך" dir="rtl">
        <ToggleGroupItem value="all">הכול</ToggleGroupItem><ToggleGroupItem value="full">מלאים</ToggleGroupItem><ToggleGroupItem value="stub">קצרמרים</ToggleGroupItem>
      </ToggleGroup>
    </div>
    <nav className="alphabet-nav" aria-label="סינון לפי אות ראשונה">
      <button type="button" className={letter === "all" ? "selected" : undefined} aria-pressed={letter === "all"} onClick={() => { setLetter("all"); setVisible(60); }}>הכול</button>
      {[...LETTERS, ...(available.has("#") ? ["#"] : [])].map(item => <button key={item} type="button" disabled={!available.has(item)} aria-label={item === "#" ? "אותיות לועזיות ומספרים" : `ערכים באות ${item}`} aria-pressed={letter === item} className={letter === item ? "selected" : undefined} onClick={() => { setLetter(item); setVisible(60); }}>{item}</button>)}
    </nav>
    <div className="results-summary"><p role="status">{filtered.length} ערכים{letter !== "all" ? ` באות ${letter}` : " במילון"}</p>{readCount > 0 && <span>קראתם {readCount} ערכים בדפדפן הזה</span>}</div>
    <div className="dictionary-list">
      {[...grouped].map(([initial, list]) => <section key={initial} className="dictionary-group" aria-labelledby={`letter-${initial}`}>
        <h2 id={`letter-${initial}`} className="dictionary-letter">{initial}</h2>
        <div className="min-w-0">{list.map(entry => <Link key={entry.slug} to={`/entry/${entry.slug}`} className="dictionary-entry group">
          <div className="min-w-0"><div className="flex flex-wrap gap-2 items-center"><h3 className="font-display text-2xl font-bold group-hover:text-primary">{entry.title}</h3>{isStubEntry(entry) && <Badge variant="secondary">קצרמר</Badge>}{isRead(entry.slug) && <CheckCircle2 className="size-4 text-muted-foreground" aria-label="נקרא" />}</div><p className="text-muted-foreground leading-relaxed mt-1 line-clamp-2">{entry.shortDescription}</p></div>
          <span className="dictionary-category">{getCategory(entry.category)?.name}</span><ArrowLeft className="size-4 shrink-0 text-primary" aria-hidden="true" />
        </Link>)}</div>
      </section>)}
    </div>
    {!filtered.length && <div className="empty-state"><h2>המושג שחיפשתם עדיין לא נמצא</h2><p>נסו לכתוב אחרת או הציעו ערך חדש למילון.</p><Button asChild variant="outline"><Link to="/edit?draft=1">הצעת ערך חדש</Link></Button></div>}
    <div className="load-more"><p>מוצגים {Math.min(visible, filtered.length)} מתוך {filtered.length} ערכים</p>{visible < filtered.length && <div className="flex flex-wrap justify-center gap-3">
      <Button size="lg" variant="outline" onClick={() => setVisible(count => count + 60)}>הצגת ערכים נוספים</Button>
      <Button size="lg" onClick={() => setVisible(filtered.length)}>הצגת כל {filtered.length} הערכים</Button>
    </div>}<a className="text-link" href={`${appUrl('/dictionary/')}?view=static`}>גרסת קריאה פשוטה</a></div>
  </div></Layout>;
}
