import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, BookOpen, Menu, X, User, LogOut, FileCheck2, UserCog, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/", label: "ראשי" },
  { to: "/categories", label: "קטגוריות" },
  { to: "/dictionary", label: "מילון מושגים" },
  { to: "/search", label: "חיפוש" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, isEditor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-hero shadow-card">
            <BookOpen className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold text-primary tracking-tight">מיכלכלה</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">לומדים כלכלה ושוק ההון</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn("px-3.5 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "text-primary bg-accent/60" : "text-foreground/75 hover:text-primary hover:bg-accent/40")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="חיפוש">
            <Link to="/search"><Search className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex text-primary">
            <Link to="/edit?draft=1">
              <Pencil className="h-4 w-4" /> כתיבת ערך
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4" /> הפרופיל שלי
                </DropdownMenuItem>
                {isEditor && (
                  <DropdownMenuItem onClick={() => navigate("/admin/revisions")}>
                    <FileCheck2 className="h-4 w-4" /> בדיקת עריכות
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                    <UserCog className="h-4 w-4" /> ניהול משתמשים
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> התנתקות
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
              <Link to="/auth">
                כניסה
              </Link>
            </Button>
          )}

          <button
            className="md:hidden rounded-md p-2 hover:bg-accent/60"
            onClick={() => setOpen(o => !o)}
            aria-label="תפריט"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

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
                  cn("px-3 py-2.5 rounded-md text-sm font-medium",
                    isActive ? "text-primary bg-accent/60" : "text-foreground/80 hover:bg-accent/40")
                }
              >
                {item.label}
              </NavLink>
            ))}
            {!user && (
              <>
                <Button asChild className="w-full mt-2">
                  <Link to="/edit?draft=1" onClick={() => setOpen(false)}>כתיבת ערך חדש</Link>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/auth" onClick={() => setOpen(false)}>כניסה / הרשמה</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
