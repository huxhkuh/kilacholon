import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category } from "@/data/content";
import { cn } from "@/lib/utils";

export default function CategoryCard({ category, count }: { category: Category; count?: number }) {
  const Icon = (Icons[category.icon as keyof typeof Icons] as LucideIcon | undefined) || Icons.Folder;

  return (
    <Link
      to={`/category/${category.slug}`}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/70 bg-card p-6",
        "shadow-card hover:shadow-elegant transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-gold/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br shadow-card",
          category.color
        )}>
          <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
        </div>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full">
            {count} ערכים
          </span>
        )}
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
        {category.name}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>לעיון</span>
        <Icons.ArrowLeft className="h-4 w-4" />
      </div>
    </Link>
  );
}
