import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Category } from "@/data/content";
import CategoryIcon from "@/components/CategoryIcon";

export default function CategoryCard({ category, count }: { category: Category; count?: number }) {
  return (
    <Link to={`/category/${category.slug}`} className="category-card group">
      <div className="flex items-center justify-between gap-3">
        <CategoryIcon name={category.icon} className="size-7 text-primary" />
        {count !== undefined && <span className="text-sm text-muted-foreground">{count} ערכים</span>}
      </div>
      <h2 className="font-display text-2xl font-bold mt-5 mb-1">{category.name}</h2>
      <p className="text-muted-foreground leading-relaxed">{category.description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">לכל הערכים <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /></span>
    </Link>
  );
}
