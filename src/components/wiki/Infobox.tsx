import { Link } from "react-router-dom";
import { Calendar, Tag as TagIcon, Layers } from "lucide-react";
import type { Entry, Category } from "@/data/content";

export default function Infobox({ entry, category }: { entry: Entry; category?: Category }) {
  return (
    <aside className="rounded-xl border-2 border-primary/15 bg-gradient-to-b from-secondary/40 to-card overflow-hidden shadow-card sticky top-24">
      <div className="bg-primary text-primary-foreground px-4 py-2.5">
        <h3 className="font-display font-bold text-base text-center">{entry.title}</h3>
      </div>
      <dl className="p-4 text-sm divide-y divide-border/60">
        {category && (
          <div className="py-2 flex justify-between gap-2">
            <dt className="text-muted-foreground flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />קטגוריה</dt>
            <dd><Link to={`/category/${category.slug}`} className="text-primary hover:underline font-medium">{category.name}</Link></dd>
          </div>
        )}
        <div className="py-2 flex justify-between gap-2">
          <dt className="text-muted-foreground">רמה</dt>
          <dd className="font-medium text-foreground">{entry.level}</dd>
        </div>
        <div className="py-2 flex justify-between gap-2">
          <dt className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />עודכן</dt>
          <dd className="font-medium text-foreground">{new Date(entry.updatedAt).toLocaleDateString("he-IL")}</dd>
        </div>
        <div className="py-2">
          <dt className="text-muted-foreground flex items-center gap-1.5 mb-2"><TagIcon className="h-3.5 w-3.5" />תגיות</dt>
          <dd className="flex flex-wrap gap-1">
            {entry.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
            ))}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
