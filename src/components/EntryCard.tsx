import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import type { Entry } from "@/data/content";
import { getCategory } from "@/data/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReadEntries } from "@/hooks/useReadEntries";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { isStubEntry, readingMinutes } from "@/lib/entry-search";
import { cn } from "@/lib/utils";

export default function EntryCard({ entry, compact = false }: { entry: Entry; compact?: boolean }) {
  const category = getCategory(entry.category);
  const { isRead } = useReadEntries();
  const { isSaved, toggleSaved } = useSavedEntries();
  const saved = isSaved(entry.slug);
  return (
    <article className={cn("entry-card", compact && "entry-card-compact")}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-gold-deep">{category?.name ?? "כלכלה"}</span>
        <div className="flex items-center gap-1">
          {isStubEntry(entry) && <Badge variant="secondary">קצרמר</Badge>}
          <Button size="icon" variant="ghost" aria-label={`${saved ? "הסרת" : "שמירת"} ${entry.title} ${saved ? "מהרשימה" : "לקריאה"}`} aria-pressed={saved} onClick={() => toggleSaved(entry.slug)}>
            {saved ? <BookmarkCheck /> : <Bookmark />}
          </Button>
        </div>
      </div>
      <Link to={`/entry/${entry.slug}`} className="entry-card-link group flex flex-1 flex-col">
        <h3 className="font-display text-2xl font-bold leading-tight group-hover:text-primary transition-colors mb-3">{entry.title}</h3>
        {!compact && <p className="text-muted-foreground leading-relaxed line-clamp-3 mb-5">{entry.shortDescription}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-auto pt-3 text-xs text-muted-foreground">
          <span>{readingMinutes(entry)} דקות קריאה</span><span>·</span><span>{entry.level}</span>
          {isRead(entry.slug) && <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5" /> נקרא</span>}
          <ArrowLeft className="size-4 mr-auto text-primary transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        </div>
      </Link>
    </article>
  );
}
