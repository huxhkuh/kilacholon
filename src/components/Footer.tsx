import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="border-b border-border/60">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">אנציקלופדיה שנכתבת יחד</h3>
            <p className="text-muted-foreground mb-6">קראו ערך, הוסיפו מקור או התחילו ערך חסר. כל תרומה משפרת את המילון לכולם.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="h-11 px-6 bg-primary hover:bg-primary-soft">
                <Link to="/dictionary">למילון המושגים</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link to="/edit?draft=1">כתיבת ערך</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* תוכן תחתון */}
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-hero">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-primary">מיכלכלה</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              אנציקלופדיה שיתופית לכלכלה ושוק ההון — קוראים, מקשרים, מתקנים וכותבים יחד.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-3 text-sm">תוכן</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/categories" className="hover:text-primary transition-colors">קטגוריות</Link></li>
              <li><Link to="/dictionary" className="hover:text-primary transition-colors">מילון מושגים</Link></li>
              <li><Link to="/search" className="hover:text-primary transition-colors">חיפוש מתקדם</Link></li>
              <li><Link to="/category/beginners" className="hover:text-primary transition-colors">למתחילים</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-3 text-sm">קהילה</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-primary transition-colors">הרשמה</Link></li>
              <li><Link to="/edit" className="hover:text-primary transition-colors">הצעת ערך חדש</Link></li>
              <li><Link to="/help/wiki-syntax" className="hover:text-primary transition-colors">מדריך כתיבה</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-3 text-sm">מידע</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>התוכן נועד למידע וללימוד בלבד.</li>
              <li>אין בו המלצה לביצוע השקעה.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} מיכלכלה. כל הזכויות שמורות.</p>
          <p className="text-center">
            <span className="text-gold-deep font-medium">⚠ הצהרה:</span> התוכן באתר נועד למידע בלבד ואינו מהווה ייעוץ השקעות.
          </p>
        </div>
      </div>
    </footer>
  );
}
