import { Link } from "react-router-dom";
import { entries } from "@/data/content";

/**
 * Render text with [[wiki-style]] internal links.
 * [[slug]] → links to /entry/slug using the entry's title
 * [[slug|text]] → links to /entry/slug with custom text
 */
export default function WikiText({ text, className }: { text: string; className?: string }) {
  const parts: (string | { slug: string; label: string })[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    const slug = m[1].trim();
    const entry = entries.find(e => e.slug === slug);
    parts.push({ slug, label: m[2]?.trim() ?? entry?.title ?? slug });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return (
    <p className={className}>
      {parts.map((p, i) =>
        typeof p === "string" ? <span key={i}>{p}</span> : (
          <Link key={i} to={`/entry/${p.slug}`} className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary hover:bg-primary/5 rounded px-0.5 transition-all">
            {p.label}
          </Link>
        )
      )}
    </p>
  );
}
