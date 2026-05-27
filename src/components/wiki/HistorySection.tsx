import { useEffect, useState } from "react";
import { History, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Rev = {
  id: string;
  change_summary: string;
  status: "pending" | "approved" | "rejected";
  is_new_entry: boolean;
  created_at: string;
  profiles?: { display_name: string };
};

const STATUS = {
  approved: { icon: CheckCircle2, label: "מאושר", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  pending: { icon: Clock, label: "ממתין", color: "text-amber-800 bg-amber-50 border-amber-200" },
  rejected: { icon: XCircle, label: "נדחה", color: "text-rose-700 bg-rose-50 border-rose-200" },
};

export default function HistorySection({ slug }: { slug: string }) {
  const [revisions, setRevisions] = useState<Rev[]>([]);

  useEffect(() => {
    supabase
      .from("entry_revisions")
      .select("id, change_summary, status, is_new_entry, created_at, profiles:author_id(display_name)")
      .eq("entry_slug", slug)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRevisions((data ?? []) as unknown as Rev[]));
  }, [slug]);

  if (revisions.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-10">
        <History className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        אין עדיין היסטוריית עריכות לערך זה.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-muted-foreground text-xs">
          <tr>
            <th className="text-right px-4 py-2.5 font-medium">תאריך</th>
            <th className="text-right px-4 py-2.5 font-medium">מחבר</th>
            <th className="text-right px-4 py-2.5 font-medium">תיאור השינוי</th>
            <th className="text-right px-4 py-2.5 font-medium">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {revisions.map(r => {
            const S = STATUS[r.status];
            return (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">{new Date(r.created_at).toLocaleString("he-IL")}</td>
                <td className="px-4 py-3 font-medium text-foreground">{r.profiles?.display_name ?? "—"}</td>
                <td className="px-4 py-3 text-foreground/80">
                  {r.is_new_entry && <span className="text-xs text-gold-deep ml-1.5">[ערך חדש]</span>}
                  {r.change_summary || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${S.color}`}>
                    <S.icon className="h-3 w-3" />{S.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
