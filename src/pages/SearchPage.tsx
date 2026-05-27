import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EntryCard from "@/components/EntryCard";
import { categories } from "@/data/content";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";

const LEVELS = ['מתחילים', 'בינוני', 'מתקדם'] as const;

export default function SearchPage() {
  const { entries } = usePublishedEntries();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  const results = useMemo(() => {
    let r = entries;
    if (activeCat) r = r.filter(e => e.category === activeCat);
    if (activeLevel) r = r.filter(e => e.level === activeLevel);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      r = r.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.shortDescription.toLowerCase().includes(q) ||
        e.fullDescription.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return r;
  }, [entries, query, activeCat, activeLevel]);

  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <span className="gold-divider mb-4" />
          <h1 className="heading-display text-3xl md:text-5xl text-primary mb-3">חיפוש מתקדם</h1>
          <p className="text-muted-foreground text-lg">חפשו ערכים לפי מילת מפתח, קטגוריה או רמת קושי.</p>
        </div>

        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative mb-5">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="הקלידו מושג, מילת מפתח או נושא..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pr-11 h-14 text-base"
            />
          </div>

          {/* פילטרים */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">קטגוריה</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeCat === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCat(null)}
                  className={activeCat === null ? "bg-primary" : ""}
                >הכל</Button>
                {categories.map(c => (
                  <Button
                    key={c.slug}
                    variant={activeCat === c.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCat(c.slug)}
                    className={activeCat === c.slug ? "bg-primary" : ""}
                  >{c.name}</Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">רמה</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeLevel === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLevel(null)}
                  className={activeLevel === null ? "bg-primary" : ""}
                >הכל</Button>
                {LEVELS.map(l => (
                  <Button
                    key={l}
                    variant={activeLevel === l ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLevel(l)}
                    className={activeLevel === l ? "bg-primary" : ""}
                  >{l}</Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* תוצאות */}
        <div>
          <p className="text-sm text-muted-foreground mb-5">{results.length} תוצאות</p>
          {results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">לא נמצאו תוצאות. נסו לחפש מונח אחר.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map(e => <EntryCard key={e.slug} entry={e} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
