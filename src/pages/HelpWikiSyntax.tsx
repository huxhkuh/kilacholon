import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import WikiText from "@/components/wiki/WikiText";
import { ArrowRight, BookOpen } from "lucide-react";

type Row = { wiki: string; note?: string };

const sections: { title: string; rows: Row[] }[] = [
  {
    title: "עיצוב טקסט",
    rows: [
      { wiki: "'''טקסט מודגש'''", note: "שלושה גרשים מכל צד" },
      { wiki: "''טקסט נטוי''", note: "שני גרשים מכל צד" },
      { wiki: "'''''מודגש ונטוי'''''", note: "חמישה גרשים" },
      { wiki: "<u>קו תחתי</u>" },
      { wiki: "<strike>קו חוצה</strike>" },
      { wiki: "<small>טקסט קטן</small>" },
      { wiki: "<tt>גופן מכונת כתיבה</tt>" },
      { wiki: 'x<sub>2</sub> · x<sup>2</sup>', note: "כתב תחתי/עילי" },
      { wiki: '<span style="color: red;">טקסט אדום</span>' },
    ],
  },
  {
    title: "כותרות",
    rows: [
      { wiki: "== כותרת ראש פרק ==" },
      { wiki: "=== כותרת תת-פרק ===" },
      { wiki: "==== כותרת משנה ====" },
    ],
  },
  {
    title: "רשימות ופסקאות",
    rows: [
      { wiki: "* פריט תבליטים\n* פריט שני\n** תת-פריט" },
      { wiki: "# פריט ממוספר\n# פריט שני\n## תת-פריט" },
      { wiki: "; מונח : הגדרה\n; מונח שני : הגדרה שנייה", note: "רשימת מונחים" },
      { wiki: ": שורה עם הזחה\n:: שורה עם שתי הזחות" },
      { wiki: "----", note: "קו אופקי" },
      { wiki: "שורה{{ש}}שורה חדשה", note: "תבנית {{ש}} שוברת שורה" },
    ],
  },
  {
    title: "קישורים",
    rows: [
      { wiki: "[[קרן-השתלמות]]", note: "קישור פנימי" },
      { wiki: "[[קרן-השתלמות|קרנות השתלמות]]", note: "קישור עם תווית" },
      { wiki: "[[ניו יורק (מדינה)|]]", note: "סוגריים מוסתרים אוטומטית" },
      { wiki: "[[#פסקה בעמוד הנוכחי]]", note: "קישור לעוגן בעמוד" },
      { wiki: "[[w:he:אלברט איינשטיין|איינשטיין]]", note: "קישור לוויקיפדיה" },
      { wiki: "[https://example.com אתר חיצוני]", note: "קישור חיצוני" },
      { wiki: "https://example.com", note: "קישור אוטומטי לכתובת" },
    ],
  },
  {
    title: "ציטוטים וקטעים מיוחדים",
    rows: [
      { wiki: "<blockquote>משפט ציטוט</blockquote>" },
      { wiki: "{{ציטוט|כאן בא הציטוט}}" },
      { wiki: "<pre>קוד\n שורה שנייה</pre>" },
      { wiki: "<center>טקסט במרכז</center>" },
    ],
  },
  {
    title: "תבניות שימושיות",
    rows: [
      { wiki: "{{ערך מורחב|קרן-השתלמות}}" },
      { wiki: "{{דרוש מקור}}" },
      { wiki: "{{הערה|זוהי הערה}}" },
      { wiki: "{{קצרמר}}" },
      { wiki: "{{כתב מחוק|הוסר}}" },
      { wiki: "{{רווח קשיח|5}}", note: "5 רווחים קשיחים" },
      { wiki: "{{משמאל לימין|English text}}" },
    ],
  },
  {
    title: "ביטול תחביר ויקי",
    rows: [
      { wiki: "<nowiki>'''ללא עיצוב''' [[ללא קישור]]</nowiki>" },
    ],
  },
];

export default function HelpWikiSyntax() {
  useEffect(() => {
    document.title = "תחביר ויקי — מדריך עריכה | פדיה פיננסית";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "מדריך מקיף לתחביר ויקי בעורך הפדיה הפיננסית: עיצוב טקסט, קישורים, רשימות, תבניות ועוד.");
  }, []);

  return (
    <Layout>
      <div className="container py-8 md:py-10 max-w-5xl">
        <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-primary">ראשי</Link>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="text-foreground/80">עזרה — תחביר ויקי</span>
        </nav>

        <header className="mb-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-gold" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">מדריך עריכה</span>
          </div>
          <h1 className="heading-display text-3xl md:text-4xl text-primary leading-tight">תחביר ויקי</h1>
          <p className="text-foreground/80 mt-2 leading-relaxed">
            מדריך מהיר לסימני העיצוב הנפוצים בעורך הערכים. בעמודה הימנית מה לכתוב, בשמאלית — איך זה נראה.
          </p>
        </header>

        <div className="space-y-10">
          {sections.map(sec => (
            <section key={sec.title}>
              <h2 className="heading-display text-2xl text-primary mb-3 pb-2 border-b border-border">{sec.title}</h2>
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="grid grid-cols-1 md:grid-cols-2 text-sm">
                  <div className="bg-secondary/40 px-4 py-2 font-semibold border-b border-border">מה לכתוב</div>
                  <div className="bg-secondary/40 px-4 py-2 font-semibold border-b border-border md:border-r">איך זה נראה</div>
                  {sec.rows.map((row, i) => (
                    <RowItem key={i} row={row} odd={i % 2 === 0} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function RowItem({ row, odd }: { row: Row; odd: boolean }) {
  const bg = odd ? "bg-background" : "bg-secondary/20";
  return (
    <>
      <div className={`px-4 py-3 border-b border-border ${bg}`}>
        <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground/90 m-0">{row.wiki}</pre>
        {row.note && <p className="text-xs text-muted-foreground mt-1.5 m-0">{row.note}</p>}
      </div>
      <div className={`px-4 py-3 border-b border-border md:border-r ${bg}`}>
        <WikiText text={row.wiki} className="text-[15px] leading-[1.85]" />
      </div>
    </>
  );
}