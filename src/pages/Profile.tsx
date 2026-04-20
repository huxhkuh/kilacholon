import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, LogOut, Shield } from "lucide-react";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, ROLE_COLORS } from "@/hooks/useAuth";
import { toast } from "sonner";

const schema = z.object({
  display_name: z.string().trim().min(2).max(60),
  bio: z.string().max(280).optional(),
});

export default function Profile() {
  const navigate = useNavigate();
  const { user, roles, loading, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [contributions, setContributions] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    document.title = "הפרופיל שלי — פדיה פיננסית";
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name);
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url);
        setContributions(data.contributions_count);
      }
    });
  }, [user]);

  async function save() {
    if (!user) return;
    const parsed = schema.safeParse({ display_name: displayName, bio });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: parsed.data.display_name,
      bio: parsed.data.bio ?? "",
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("הפרופיל נשמר");
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { toast.error("קובץ גדול מ-2MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setAvatarUrl(url);
    setUploading(false);
    toast.success("התמונה עודכנה");
  }

  if (loading || !user) return <Layout><div className="container py-20 text-center text-muted-foreground">טוען...</div></Layout>;

  return (
    <Layout>
      <div className="container max-w-3xl py-12">
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="bg-gradient-hero h-32" />
          <div className="px-6 md:px-10 pb-10 -mt-16">
            <div className="flex items-end gap-5 mb-8">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-card shadow-md">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="text-2xl bg-secondary text-primary">{displayName.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <label className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 shadow-md">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
                </label>
              </div>
              <div className="pb-2 flex-1">
                <h1 className="heading-display text-2xl text-primary mb-1">{displayName || "פרופיל"}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Roles */}
            <div className="mb-6">
              <Label className="mb-2 block flex items-center gap-1.5"><Shield className="h-4 w-4 text-gold" /> דרגות</Label>
              <div className="flex flex-wrap gap-1.5">
                {roles.length === 0 && <span className="text-sm text-muted-foreground">טוען...</span>}
                {roles.map(r => (
                  <span key={r} className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[r]}`}>{ROLE_LABELS[r]}</span>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-lg bg-secondary/50 p-4 text-center">
                <div className="text-2xl font-bold text-primary">{contributions}</div>
                <div className="text-xs text-muted-foreground mt-1">תרומות מאושרות</div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="dn">שם תצוגה</Label>
                <Input id="dn" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={60} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">ביו קצר</Label>
                <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={280} rows={3} placeholder="כמה מילים על עצמכם..." />
                <div className="text-xs text-muted-foreground text-left">{bio.length}/280</div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /> התנתקות</Button>
                <Button onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? "שומר..." : "שמירה"}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
