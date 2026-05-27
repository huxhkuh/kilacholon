import { Link } from "react-router-dom";
import { Calendar, CheckCircle2 } from "lucide-react";
import type { Entry } from "@/data/content";
import { getCategory } from "@/data/content";
import { Badge } from "@/components/ui/badge";
import { useReadEntries } from "@/hooks/useReadEntries";

export default function EntryCard({ entry, compact = false }: { entry: Entry; compact?: boolean }) {
  const category = getCategory(entry.category);
  const { isRead } = useReadEntries();
  const hasRead = isRead(entry.slug);

  return (
    <Link
      to={`/entry/${entry.slug}`}
      className="group block rounded-xl border border-border/70 bg-card p-5 shadow-card hover:shadow-elegant hover:border-gold/40 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-2">
        {category && (
          <Badge variant="secondary" className="bg-accent/70 text-accent-foreground text-[11px] font-normal hover:bg-accent">
            {category.name}
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground">{entry.level}</span>
        {hasRead && (
          <span className="mr-auto inline-flex items-center gap-1 text-[11px] text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> נקרא
          </span>
        )}
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
        {entry.title}
      </h3>
      {!compact && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
          {entry.shortDescription}
        </p>
      )}
      <div className="flex items-center gap-4 text-xs text-muted-foreground/80 pt-2 border-t border-border/50">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          עודכן {new Date(entry.updatedAt).toLocaleDateString('he-IL')}
        </span>
      </div>
    </Link>
  );
}
