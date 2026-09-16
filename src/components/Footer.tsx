import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr] py-12">
        <div>
          <Link to="/" className="brand mb-3"><BookOpen className="size-8 text-primary" strokeWidth={1.6} aria-hidden="true" /><span>מיכלכלה</span></Link>
          <p className="text-muted-foreground leading-relaxed max-w-xs">אנציקלופדיה שיתופית לכלכלה ושוק ההון. מבינים, מקשרים וכותבים יחד.</p>
        </div>
        <nav aria-label="תוכן האתר" className="footer-column">
          <h2>מגלים ולומדים</h2>
          <Link to="/categories">תחומי הידע</Link><Link to="/dictionary">מילון מושגים</Link><Link to="/search">חיפוש ערכים</Link><Link to="/search?saved=1">רשימת הקריאה שלי</Link>
        </nav>
        <nav aria-label="השתתפות בקהילה" className="footer-column">
          <h2>כותבים יחד</h2>
          <Link to="/edit?draft=1">הצעת ערך חדש</Link><Link to="/search?type=stub">קצרמרים להרחבה</Link><Link to="/help/wiki-syntax">מדריך לכותבים</Link><Link to="/auth">כניסה / הרשמה</Link>
        </nav>
        <div className="footer-column">
          <h2>ידע לקבלת החלטות</h2>
          <p className="leading-relaxed text-muted-foreground">התוכן נועד ללימוד ולהעשרה, ואינו ייעוץ השקעות, מס או ייעוץ פנסיוני אישי.</p>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} מיכלכלה</span>
        </div>
      </div>
    </footer>
  );
}
