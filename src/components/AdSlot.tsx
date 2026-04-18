import { cn } from "@/lib/utils";

type Variant = "banner" | "inline" | "sidebar" | "sponsored";

interface AdSlotProps {
  variant?: Variant;
  label?: string;
  className?: string;
}

export default function AdSlot({ variant = "inline", label, className }: AdSlotProps) {
  const styles: Record<Variant, string> = {
    banner: "h-20 md:h-24",
    inline: "h-28 md:h-32",
    sidebar: "h-72",
    sponsored: "h-32",
  };

  const text: Record<Variant, string> = {
    banner: "מקום פרסום — באנר עליון",
    inline: "מקום פרסום",
    sidebar: "מקום פרסום צדדי",
    sponsored: "תוכן ממומן",
  };

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center text-center px-4",
        styles[variant],
        className
      )}
      aria-label="מודעה"
    >
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-1">פרסומת</span>
      <span className="text-sm text-muted-foreground">{label || text[variant]}</span>
    </div>
  );
}
