import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserCog } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, ROLE_COLORS } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Role = "viewer" | "new_writer" | "veteran_writer" | "editor" | "admin";
type Row = { id: string; display_name: string; bio: string; avatar_url: string | null; contributions_count: number; roles: Role[] };

const ALL_ROLES: Role[] = ["viewer", "new_writer", "veteran_writer", "editor", "admin"];

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    document.title = "ניהול משתמשים — מיכלכלה";
    if (!loading && !isAdmin) navigate("/", { replace: true });
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function load() {
    const [{ data: profiles }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (!profiles) return;
    const map = new Map<string, Role[]>();
    (roleRows ?? []).forEach(r => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role); map.set(r.user_id, arr);
    });
    setRows(profiles.map(p => ({ ...p, roles: map.get(p.id) ?? [] })));
  }

  async function toggleRole(userId: string, role: Role, has: boolean) {
    if (userId === user?.id && role === "admin" && has) {
      toast.error("לא ניתן להסיר את עצמך מתפקיד מנהל");
      return;
    }
    setBusy(userId + role);
    if (has) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role, granted_by: user!.id });
    }
    setBusy(null);
    load();
  }

  if (loading || !isAdmin) return <Layout><div className="container py-20 text-center text-muted-foreground">טוען...</div></Layout>;

  return (
    <Layout>
      <div className="container max-w-5xl py-10">
        <header className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserCog className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="heading-display text-2xl text-primary">ניהול משתמשים</h1>
            <p className="text-sm text-muted-foreground">הוספה והסרה של דרגות לעורכים ומנהלים</p>
          </div>
        </header>

        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-4 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={r.avatar_url ?? undefined} />
                  <AvatarFallback>{r.display_name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{r.display_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.bio || "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.contributions_count} תרומות מאושרות</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ROLES.map(role => {
                  const has = r.roles.includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => toggleRole(r.id, role, has)}
                      disabled={busy === r.id + role}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                        has ? ROLE_COLORS[role] : "bg-background text-muted-foreground border border-dashed border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {has ? "✓ " : "+ "}{ROLE_LABELS[role]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground flex gap-2">
          <ShieldCheck className="h-4 w-4 text-gold mt-0.5 shrink-0" />
          דרגות "כותב חדש" ו"כותב ותיק" מוענקות אוטומטית לפי מספר התרומות המאושרות. דרגות "עורך" ו"מנהל" ניתנות ידנית בלבד.
        </div>
      </div>
    </Layout>
  );
}
