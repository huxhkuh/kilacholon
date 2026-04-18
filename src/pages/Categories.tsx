import Layout from "@/components/Layout";
import CategoryCard from "@/components/CategoryCard";
import { categories, getEntriesByCategory } from "@/data/content";

export default function Categories() {
  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="max-w-2xl mb-12">
          <span className="gold-divider mb-4" />
          <h1 className="heading-display text-3xl md:text-5xl text-primary mb-3">כל הקטגוריות</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            דפדפו בכל תחומי הידע באתר. כל קטגוריה מכילה ערכים מסודרים בעברית פשוטה ומדויקת.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(cat => (
            <CategoryCard
              key={cat.slug}
              category={cat}
              count={getEntriesByCategory(cat.slug).length}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
