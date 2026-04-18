import { Link, NavLink } from "react-router-dom";
import { Search, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "ראשי" },
  { to: "/categories", label: "קטגוריות" },
  { to: "/dictionary", label: "מילון מושגים" },
  { to: "/search", label: "חיפוש" },
  { to: "/about", label: "אודות" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* לוגו */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-hero shadow-card">
            <BookOpen className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold text-primary tracking-tight">פדיה פיננסית</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">שוק ההון בשפה ברורה</span>
          </div>
        </Link>

        {/* ניווט דסקטופ */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3.5 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary bg-accent/60"
                    : "text-foreground/75 hover:text-primary hover:bg-accent/40"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* פעולות */}
        <div className="flex items-center gap-2">
          <Link to="/search" className="hidden sm:flex">
            <Button variant="ghost" size="icon" aria-label="חיפוש">
              <Search className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <Link to="/auth" className="hidden md:block">
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
              כניסה
            </Button>
          </Link>
          <button
            className="md:hidden rounded-md p-2 hover:bg-accent/60"
            onClick={() => setOpen(o => !o)}
            aria-label="תפריט"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* תפריט מובייל */}
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {nav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2.5 rounded-md text-sm font-medium",
                    isActive ? "text-primary bg-accent/60" : "text-foreground/80 hover:bg-accent/40"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="mt-2">
              <Button className="w-full" variant="outline">כניסה / הרשמה</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
