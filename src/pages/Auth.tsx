import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AlertCircle, BookOpen, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
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

const magicLinkSchema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה").max(255),
  displayName: z.string().trim().max(60),
}).refine(data => !data.displayName || data.displayName.length >= 2, {
  message: "שם תצוגה חייב להיות לפחות 2 תווים",
  path: ["displayName"],
});

type AuthNotice = {
  kind: "success" | "error";
  text: string;
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const resumeDraft = searchParams.get("draft") === "1";

  // signup state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // signin state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // passwordless state
  const [magicEmail, setMagicEmail] = useState("");
  const [magicDisplayName, setMagicDisplayName] = useState("");

  function appRedirectUrl(path = "") {
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
    return new URL(path.replace(/^\//, ""), baseUrl).toString();
  }

  function explainAuthError(error: { code?: string; message: string }, action: "signup" | "signin" | "email") {
    const message = error.message.toLowerCase();

    if (error.code === "email_not_confirmed" || message.includes("email not confirmed")) {
      return "החשבון נוצר, אבל האימייל עדיין לא אושר. פתחו את הודעת האישור או שלחו אותה שוב כאן.";
    }
    if (error.code === "invalid_credentials" || message.includes("invalid login credentials")) {
      return "האימייל או הסיסמה שגויים. אם רק נרשמתם, יש לאשר קודם את האימייל.";
    }
    if (error.code === "user_already_exists" || message.includes("already registered") || message.includes("already been registered")) {
      return "האימייל כבר רשום. עברו לכניסה, או שלחו שוב אישור אם עדיין לא אימתתם אותו.";
    }
    if (error.code === "weak_password" || message.includes("password")) {
      return "הסיסמה נדחתה. השתמשו בלפחות 8 תווים, כולל אות ומספר.";
    }
    if (error.code === "over_email_send_rate_limit" || message.includes("rate limit")) {
      return "נשלחו יותר מדי הודעות בזמן קצר. המתינו מעט ונסו לשלוח שוב.";
    }
    if (error.code === "signup_disabled") {
      return "הרשמה חדשה חסומה כעת בהגדרות האתר.";
    }
    if (message.includes("email") && (message.includes("invalid") || message.includes("valid"))) {
      return "כתובת האימייל נדחתה. הזינו כתובת אמיתית שאליה ניתן לקבל קישור אישור.";
    }
    if (action === "email") {
      return "לא הצלחנו לשלוח הודעת אישור כרגע. נסו שוב בעוד רגע.";
    }
    if (action === "signin") {
      return "הכניסה נכשלה. בדקו את הפרטים ואת אישור האימייל.";
    }
    return "ההרשמה לא הושלמה. בדקו את האימייל והסיסמה ונסו שוב.";
  }

  useEffect(() => {
    document.title = "כניסה / הרשמה — מיכלכלה";
    if (!loading && user) navigate(resumeDraft ? "/edit" : "/profile", { replace: true });
  }, [user, loading, navigate, resumeDraft]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const parsed = signUpSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: appRedirectUrl(),
        data: { display_name: parsed.data.displayName },
      },
    });
    setBusy(false);
    if (error) {
      const text = explainAuthError(error, "signup");
      setNotice({ kind: "error", text });
      toast.error(text);
    } else if (data.session) {
      const text = "נרשמתם והתחברתם בהצלחה.";
      setNotice({ kind: "success", text });
      toast.success(text);
    } else {
      const text = "ההרשמה התקבלה. שלחנו מייל אישור; רק לאחר לחיצה על הקישור תוכלו להתחבר ולשלוח עריכות.";
      setSigninEmail(parsed.data.email);
      setMagicEmail(parsed.data.email);
      setNotice({ kind: "success", text });
      toast.success(text);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
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
      const text = explainAuthError(error, "signin");
      setNotice({ kind: "error", text });
      toast.error(text);
    } else {
      setNotice({ kind: "success", text: "התחברתם בהצלחה." });
      toast.success("התחברת בהצלחה");
    }
  }

  async function resendConfirmation() {
    const confirmationEmail = signinEmail || email;
    const parsed = z.string().trim().email("נא להזין אימייל תקין קודם").safeParse(confirmationEmail);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setBusy(true);
    setNotice(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: { emailRedirectTo: appRedirectUrl("profile") },
    });
    setBusy(false);

    if (error) {
      const text = explainAuthError(error, "email");
      setNotice({ kind: "error", text });
      toast.error(text);
      return;
    }

    const text = "מייל אישור חדש נשלח. בדקו גם את תיקיית הספאם ולחצו על הקישור לפני כניסה עם סיסמה.";
    setNotice({ kind: "success", text });
    toast.success(text);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const parsed = magicLinkSchema.safeParse({ email: magicEmail, displayName: magicDisplayName });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setBusy(true);
    const redirectPath = resumeDraft ? "auth?draft=1" : "profile";
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: appRedirectUrl(redirectPath),
        data: parsed.data.displayName ? { display_name: parsed.data.displayName } : undefined,
      },
    });
    setBusy(false);

    if (error) {
      const text = explainAuthError(error, "email");
      setNotice({ kind: "error", text });
      toast.error(text);
      return;
    }

    const text = "שלחנו קישור כניסה מאובטח לאימייל. לחצו עליו כדי להתחיל לתרום.";
    setNotice({ kind: "success", text });
    toast.success(text);
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

        {notice && (
          <div
            role="alert"
            className={`mb-5 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${
              notice.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-destructive/25 bg-destructive/5 text-foreground"
            }`}
          >
            {notice.kind === "success"
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
              : <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />}
            <p>{notice.text}</p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-card p-6 md:p-8">
          <Tabs defaultValue="magic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="magic">קישור כניסה</TabsTrigger>
              <TabsTrigger value="signin">סיסמה</TabsTrigger>
              <TabsTrigger value="signup">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="magic">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm text-foreground/80">
                  ללא סיסמה וללא אישור מנהל: קישור חד-פעמי יישלח לאימייל ויאמת שזה החשבון שלכם.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ml-email">אימייל</Label>
                  <Input id="ml-email" type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ml-name">שם תצוגה <span className="text-muted-foreground">(למשתמש חדש)</span></Label>
                  <Input id="ml-name" value={magicDisplayName} onChange={e => setMagicDisplayName(e.target.value)} maxLength={60} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  <Mail className="h-4 w-4" />
                  {busy ? "שולח..." : "שלחו לי קישור כניסה"}
                </Button>
              </form>
            </TabsContent>

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
                <Button type="button" variant="ghost" className="w-full" onClick={resendConfirmation} disabled={busy}>
                  שליחה מחדש של אישור אימייל
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  נרשמתם עכשיו? יש ללחוץ על הקישור באימייל לפני כניסה עם סיסמה.
                </p>
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

        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            איך הופכים לכותבים במיכלכלה?
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            כל משתמש מאומת יכול להציע ערכים ותיקונים. אחרי תרומה מאושרת אחת מתקבלת דרגת כותב,
            ואחרי עשר תרומות מאושרות דרגת כותב ותיק. פרסום ואישור עריכות נשארים בידי עורכים מורשים.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-secondary/35 p-4 text-center">
          <p className="text-sm text-foreground/85 mb-3">
            רוצים קודם לראות את כלי הכתיבה? אפשר לכתוב טיוטה ולצפות בה בלי הרשמה.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/edit?draft=1">כניסה לעורך כאורח</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            הטיוטה נשמרת במכשיר הזה. התחברות נדרשת רק לשליחה לבדיקה.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary">← חזרה לעמוד הבית</Link>
        </p>
      </div>
    </Layout>
  );
}
