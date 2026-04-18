import { Link } from "react-router-dom";
import { BookOpen, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("נא להזין כתובת מייל תקינה");
      return;
    }
    toast.success("נרשמת בהצלחה לניוזלטר!", { description: "תקבל עדכונים על ערכים חדשים ומדריכים." });
    setEmail("");
  };

  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      {/* ניוזלטר */}
      <div className="border-b border-border/60">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-gold mb-4 shadow-gold">
              <Mail className="h-5 w-5 text-gold-foreground" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">הצטרפו לניוזלטר השבועי</h3>
            <p className="text-muted-foreground mb-6">קבלו אחת לשבוע את הערכים החדשים, המדריכים והעדכונים החשובים — ישירות למייל.</p>
            <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="כתובת המייל שלכם"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-background border-border/80 h-11"
                required
              />
              <Button type="submit" className="h-11 px-6 bg-primary hover:bg-primary-soft">הרשמה</Button>
            </form>
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
              <span className="font-display font-bold text-primary">פדיה פיננסית</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              אנציקלופדיה דיגיטלית לשוק ההון, השקעות וחיסכון — לציבור החרדי, בשפה ברורה ומכובדת.
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
              <li><Link to="/submit" className="hover:text-primary transition-colors">הצעת ערך חדש</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">אודותינו</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">יצירת קשר</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-3 text-sm">מידע</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">פרטיות</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">תנאי שימוש</Link></li>
              <li><Link to="/disclaimer" className="hover:text-primary transition-colors">הצהרה משפטית</Link></li>
              <li><Link to="/ads" className="hover:text-primary transition-colors">פרסום באתר</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} פדיה פיננסית. כל הזכויות שמורות.</p>
          <p className="text-center">
            <span className="text-gold-deep font-medium">⚠ הצהרה:</span> התוכן באתר נועד למידע בלבד ואינו מהווה ייעוץ השקעות.
          </p>
        </div>
      </div>
    </footer>
  );
}
