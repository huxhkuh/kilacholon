import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  useEffect(() => {
    document.title = 'העמוד לא נמצא — מיכלכלה';
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex,follow');
  }, []);
  return <Layout><div className="container py-24 text-center">
    <p className="text-primary font-semibold mb-3">404</p>
    <h1 className="heading-display text-4xl mb-4">העמוד הזה לא נמצא.</h1>
    <p className="text-muted-foreground mb-8">ייתכן שהכתובת השתנתה. אפשר לחפש את המושג במילון או לחזור לדף הבית.</p>
    <div className="flex justify-center flex-wrap gap-3"><Button asChild><Link to="/search">חיפוש ערכים</Link></Button><Button variant="outline" asChild><Link to="/">לדף הבית</Link></Button></div>
  </div></Layout>;
}
