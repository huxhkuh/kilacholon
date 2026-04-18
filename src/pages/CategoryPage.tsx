import { Link, useParams } from "react-router-dom";
import * as Icons from "lucide-react";
import Layout from "@/components/Layout";
import EntryCard from "@/components/EntryCard";
import AdSlot from "@/components/AdSlot";
import { getCategory, getEntriesByCategory } from "@/data/content";
import { Button } from "@/components/ui/button";

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const category = getCategory(slug);
  const entries = getEntriesByCategory(slug);

  if (!category) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="heading-display text-3xl text-primary mb-4">קטגוריה לא נמצאה</h1>
          <Link to="/categories"><Button>חזרה לקטגוריות</Button></Link>
        </div>
      </Layout>
    );
  }

  const Icon = (Icons as any)[category.icon] || Icons.Folder;

  return (
    <Layout>
      {/* Hero קטגוריה */}
      <section className={`bg-gradient-to-br ${category.color} text-white`}>
        <div className="container py-14 md:py-20">
          <Link to="/categories" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-5">
            <Icons.ArrowRight className="h-4 w-4" /> כל הקטגוריות
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Icon className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="heading-display text-3xl md:text-5xl">{category.name}</h1>
              <p className="text-white/85 mt-1">{entries.length} ערכים בקטגוריה</p>
            </div>
          </div>
          <p className="text-white/90 max-w-2xl text-lg leading-relaxed mt-2">{category.description}</p>
        </div>
      </section>

      <div className="container py-12">
        {entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            עדיין אין ערכים בקטגוריה זו. בקרוב נוסיף תוכן!
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {entries.map(e => <EntryCard key={e.slug} entry={e} />)}
            </div>
            <div className="mt-12">
              <AdSlot variant="inline" />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
