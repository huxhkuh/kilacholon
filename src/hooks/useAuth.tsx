import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "viewer" | "new_writer" | "veteran_writer" | "editor" | "admin";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;
    async function applySession(sess: Session | null) {
      const request = ++requestId.current;
      setSession(sess);
      setUser(sess?.user ?? null);
      setRoles([]);
      setLoading(true);
      try {
        if (sess?.user) {
          const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', sess.user.id);
          if (active && request === requestId.current) setRoles(error ? [] : data?.map(r => r.role as Role) ?? []);
        }
      } catch {
        if (active && request === requestId.current) setRoles([]);
      } finally {
        if (active && request === requestId.current) setLoading(false);
      }
    }
    // 1. set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      receivedAuthEvent = true;
      // Supabase callbacks hold an auth lock; fetch roles outside the callback.
      setTimeout(() => { if (active) void applySession(sess); }, 0);
    });

    // 2. then check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (active && !receivedAuthEvent) void applySession(sess);
    }).catch(() => { if (active) setLoading(false); });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const isEditor = roles.includes("editor") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, isEditor, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<Role, string> = {
  viewer: "גולש",
  new_writer: "כותב חדש",
  veteran_writer: "כותב ותיק",
  editor: "עורך",
  admin: "מנהל",
};

export const ROLE_COLORS: Record<Role, string> = {
  viewer: "bg-muted text-muted-foreground",
  new_writer: "bg-sky-100 text-sky-900 border border-sky-200",
  veteran_writer: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  editor: "bg-gold/20 text-gold-deep border border-gold/40",
  admin: "bg-primary text-primary-foreground",
};
