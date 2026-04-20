import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { BookOpen } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const signUpSchema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה").max(255),
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים").max(72),
  displayName: z.string().trim().min(2, "שם תצוגה חייב להיות לפחות 2 תווים").max(60),
});

const signInSchema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "נא להזין סיסמה"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  // signup state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // signin state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  useEffect(() => {
    document.title = "כניסה / הרשמה — פדיה פיננסית";
    if (!loading && user) navigate("/profile", { replace: true });
  }, [user, loading, navigate]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: parsed.data.displayName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("registered") ? "כתובת זו כבר רשומה" : error.message);
    } else {
      toast.success("נרשמת בהצלחה! בדקו את האימייל לאישור.");
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email: signinEmail, password: signinPassword });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("Invalid") ? "אימייל או סיסמה שגויים" : error.message);
    } else {
      toast.success("התחברת בהצלחה");
    }
  }

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-hero shadow-card mb-4">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="heading-display text-3xl text-primary mb-2">ברוכים הבאים</h1>
          <p className="text-muted-foreground">הצטרפו לקהילת הכותבים והקוראים</p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-6 md:p-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">התחברות</TabsTrigger>
              <TabsTrigger value="signup">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">אימייל</Label>
                  <Input id="si-email" type="email" value={signinEmail} onChange={e => setSigninEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pw">סיסמה</Label>
                  <Input id="si-pw" type="password" value={signinPassword} onChange={e => setSigninPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "מתחבר..." : "כניסה"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">שם תצוגה</Label>
                  <Input id="su-name" value={displayName} onChange={e => setDisplayName(e.target.value)} required maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">אימייל</Label>
                  <Input id="su-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pw">סיסמה (6+ תווים)</Label>
                  <Input id="su-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "נרשם..." : "הרשמה לאתר"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  בהרשמה אתם מסכימים לתרום לקהילה בכבוד ובאמינות.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary">← חזרה לעמוד הבית</Link>
        </p>
      </div>
    </Layout>
  );
}
