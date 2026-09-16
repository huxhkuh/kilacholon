import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Menu, Search, User, LogOut, FileCheck2, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/", label: "ראשי" },
  { to: "/categories", label: "קטגוריות" },
  { to: "/dictionary", label: "מילון מושגים" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, isEditor, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const savedActive = location.pathname === "/search" && new URLSearchParams(location.search).get("saved") === "1";
  useEffect(() => setOpen(false), [location.pathname, location.search]);

  const navigation = <>
    {nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}>{item.label}</NavLink>)}
    <Link to="/search?saved=1" className={cn("nav-link", savedActive && "nav-link-active")} aria-current={savedActive ? "page" : undefined}>שמורים</Link>
  </>;

  return (
    <header className="site-header">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link to="/" className="brand" aria-label="מיכלכלה — לדף הבית">
          <BookOpen className="size-8 text-primary" strokeWidth={1.6} aria-hidden="true" />
          <span>מיכלכלה</span>
        </Link>
        <nav aria-label="ניווט ראשי" className="hidden md:flex items-center gap-5 lg:gap-8">{navigation}</nav>
        <div className="flex items-center gap-2 lg:gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="חיפוש ערכים" className="md:hidden"><Link to="/search"><Search /></Link></Button>
          {user ? (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <button className="rounded-full" aria-label="פתיחת תפריט חשבון">
                  <Avatar className="size-9">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                    <AvatarFallback>{user.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel><div className="truncate">{user.email}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/profile")}><User />הפרופיל שלי</DropdownMenuItem>
                  {isEditor && <DropdownMenuItem onClick={() => navigate("/admin/revisions")}><FileCheck2 />בדיקת עריכות</DropdownMenuItem>}
                  {isAdmin && <DropdownMenuItem onClick={() => navigate("/admin/users")}><UserCog />ניהול משתמשים</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => navigate("/edit?draft=1")}><BookOpen />כתיבת ערך חדש</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup><DropdownMenuItem onClick={signOut}><LogOut />התנתקות</DropdownMenuItem></DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : <Button asChild variant="ghost" className="hidden md:inline-flex"><Link to="/auth">כניסה</Link></Button>}
          <Button asChild className="hidden lg:inline-flex"><Link to="/edit?draft=1">כתיבת ערך</Link></Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button size="icon" variant="ghost" className="md:hidden" aria-label="פתיחת תפריט ניווט"><Menu /></Button></SheetTrigger>
            <SheetContent side="right" className="mobile-navigation" dir="rtl">
              <SheetTitle>מיכלכלה</SheetTitle>
              <SheetDescription>ידע כלכלי, במקום אחד.</SheetDescription>
              <nav aria-label="ניווט במכשיר נייד" className="flex flex-col gap-2 mt-8">{navigation}<Link className="nav-link" to="/search">חיפוש ערכים</Link></nav>
              <div className="flex flex-col gap-3 mt-8">
                <Button asChild><Link to="/edit?draft=1">כתיבת ערך חדש</Link></Button>
                {!user && <Button asChild variant="outline"><Link to="/auth">כניסה / הרשמה</Link></Button>}
                <Button asChild variant="ghost"><Link to="/help/wiki-syntax">מדריך לכותבים</Link></Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
