import { useMemo } from "react";
import Layout from "@/components/Layout";
import CategoryCard from "@/components/CategoryCard";
import { categories } from "@/data/content";
import { usePublishedEntries } from "@/hooks/usePublishedEntries";

export default function Categories() {
  const { entries } = usePublishedEntries();
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    entries.forEach(entry => result.set(entry.category, (result.get(entry.category) ?? 0) + 1));
    return result;
  }, [entries]);
  return (
    <Layout><div className="container page-space">
      <div className="page-heading"><h1>כלכלה, מכל הכיוונים.</h1><p>מהמושגים הראשונים ועד הרעיונות הגדולים. בחרו תחום והתחילו לחקור.</p></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{categories.map(category => <CategoryCard key={category.slug} category={category} count={counts.get(category.slug) ?? 0} />)}</div>
    </div></Layout>
  );
}
