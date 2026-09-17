import { BarChart3, BookOpen, BriefcaseBusiness, Building2, ChartScatter, HelpCircle, House, Leaf, Landmark, Layers, LibraryBig, Receipt, Scale, ScrollText, Shield, Sprout, TrendingUp, Umbrella, UserRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  BarChart3, BriefcaseBusiness, Building2, ChartScatter, House, Leaf, Scale, Umbrella, HelpCircle, Landmark, Layers, LibraryBig, Receipt, ScrollText,
  Shield, Sprout, TrendingUp, UserRound, Wallet,
};

export default function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? BookOpen;
  return <Icon className={className} strokeWidth={1.6} aria-hidden="true" />;
}
