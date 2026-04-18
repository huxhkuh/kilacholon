import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { entries, getCategory } from "@/data/content";
import { Badge } from "@/components/ui/badge";

const HE_LETTERS = ["א","ב","ג","ד","ה","ו","ז","ח","ט","י","כ","ל","מ","נ","ס","ע","פ","צ","ק","ר","ש","ת"];

export default function Dictionary() {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = query.trim()
      ? entries.filter(e => e.title.includes(query.trim()) || e.shortDescription.includes(query.trim()))
      : entries;
    const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'he'));
    const map = new Map<string, typeof entries>();
    for (const e of sorted) {
      const letter = e.title.charAt(0);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(e);
    }
    return map;
  }, [query]);

  const availableLetters = Array.from(grouped.keys());

  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="gold-divider mb-4" />
          <h1 className="heading-display text-3xl md:text-5xl text-primary mb-3">מילון מושגים</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            כל המושגים באתר, מסודרים אלפביתית. לחצו על מושג להסבר מלא.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש מושג..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pr-10 h-12 text-base"
            />
          </div>
        </div>

        {/* טבלת אותיות */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-10 max-w-3xl mx-auto">
          {HE_LETTERS.map(l => {
            const has = availableLetters.includes(l);
            return (
              <a
                key={l}
                href={has ? `#letter-${l}` : undefined}
                className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-display font-semibold transition-colors ${
                  has
                    ? "bg-card border border-border text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary cursor-pointer"
                    : "bg-muted/40 text-muted-foreground/40 cursor-default"
                }`}
              >
                {l}
              </a>
            );
          })}
        </div>

        {/* רשימה */}
        <div className="max-w-4xl mx-auto space-y-10">
          {availableLetters.length === 0 && (
            <p className="text-center text-muted-foreground py-12">לא נמצאו מושגים תואמים.</p>
          )}
          {availableLetters.map(letter => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-20">
              <h2 className="heading-display text-3xl text-gold-deep mb-4 pb-2 border-b border-gold/30">
                {letter}
              </h2>
              <div className="space-y-3">
                {grouped.get(letter)!.map(entry => {
                  const cat = getCategory(entry.category);
                  return (
                    <Link
                      key={entry.slug}
                      to={`/entry/${entry.slug}`}
                      className="block rounded-lg border border-border/70 bg-card p-4 hover:border-gold/40 hover:shadow-card transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                          {entry.title}
                        </h3>
                        {cat && <Badge variant="secondary" className="bg-accent/60 text-accent-foreground text-[11px]">{cat.name}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{entry.shortDescription}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
}
