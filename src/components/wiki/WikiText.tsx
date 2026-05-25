import React from "react";
import { Link } from "react-router-dom";
import { entries } from "@/data/content";

/**
 * MediaWiki-style + lightweight markdown renderer.
 *
 * Supports (block-level):
 *   ==Heading==, ===Heading===, ====Heading====  (and markdown ##/###)
 *   * bullet lists (and markdown -)
 *   # numbered lists (and markdown 1.)
 *   : indentation (one or more)
 *   ; term : definition  (definition list)
 *   ----  horizontal rule
 *   leading space -> <pre>
 *   <blockquote>...</blockquote>, <pre>...</pre>, <poem>...</poem>
 *   blank line -> paragraph break
 *
 * Supports (inline):
 *   '''bold''', ''italic''', '''''bold-italic'''''  (and **bold**, *italic*)
 *   [[slug]], [[slug|label]], [[X (Y)|]] cosmetic, [[w:he:X|Y]] external wiki
 *   [http://url label] external links, bare http(s) URLs
 *   <br>, <br/>, <u>, <strike>/<s>/<del>, <small>, <tt>, <code>,
 *   <b>, <i>, <sub>, <sup>, <center>, <span style="...">
 *   <nowiki>...</nowiki>  (escape wiki syntax)
 *   {{ש}}, {{כ}}, {{רווח קשיח|N}}, {{מימין לשמאל|t}}, {{משמאל לימין|t}},
 *   {{ערך מורחב|X}}, {{ציטוט|X}}, {{דרוש מקור}}, {{הערה|X}}, {{קצרמר}},
 *   {{תב|X}}, {{כתב מחוק|X}}, {{צבע רקע|X|color}}, {{מסגרת|X}}, {{אפור|X}}
 *
 * The renderer intentionally tolerates legacy markdown so existing entries
 * keep rendering correctly.
 */

type Props = { text: string; className?: string };

export default function WikiText({ text, className }: Props) {
  const blocks = parseBlocks(text || "");
  return <div className={className}>{blocks.map((b, i) => renderBlock(b, i))}</div>;
}

// ---------------- Block model ----------------
type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "hr" }
  | { kind: "pre"; text: string }
  | { kind: "blockquote"; text: string }
  | { kind: "poem"; text: string }
  | { kind: "list"; items: ListItem[] }
  | { kind: "dl"; items: { term?: string; def?: string }[] }
  | { kind: "indent"; level: number; text: string }
  | { kind: "raw"; html: string };

type ListItem = { marker: string; text: string; children: ListItem[] };

function parseBlocks(src: string): Block[] {
  // Normalize and protect raw blocks first
  const blocks: Block[] = [];
  // Extract <pre>, <blockquote>, <poem>, <syntaxhighlight> blocks
  const placeholders: { marker: string; block: Block }[] = [];
  let i = 0;
  src = src.replace(/<(pre|blockquote|poem|syntaxhighlight)[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
    const marker = `\u0000RAW${i++}\u0000`;
    const t = String(tag).toLowerCase();
    const block: Block =
      t === "pre" || t === "syntaxhighlight"
        ? { kind: "pre", text: inner.replace(/^\n/, "") }
        : t === "poem"
        ? { kind: "poem", text: inner.replace(/^\n/, "") }
        : { kind: "blockquote", text: inner.trim() };
    placeholders.push({ marker, block });
    return `\n${marker}\n`;
  });

  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let buf: string[] = [];
  const flushPara = () => {
    if (buf.length) {
      const t = buf.join("\n").trim();
      if (t) blocks.push({ kind: "paragraph", text: t });
      buf = [];
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // raw placeholder
    const ph = placeholders.find(p => line.trim() === p.marker);
    if (ph) { flushPara(); blocks.push(ph.block); continue; }

    // blank line
    if (!line.trim()) { flushPara(); continue; }

    // hr (4+ dashes alone)
    if (/^-{4,}\s*$/.test(line)) { flushPara(); blocks.push({ kind: "hr" }); continue; }

    // wiki heading == ... == (allow trailing spaces)
    const wh = line.match(/^(={1,6})\s*(.+?)\s*\1\s*$/);
    if (wh) { flushPara(); blocks.push({ kind: "heading", level: wh[1].length, text: wh[2] }); continue; }

    // markdown heading ## ...
    const mh = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (mh && /^#+\s/.test(line) && !/^#\s*\S/.test(line)) {
      // Only treat ## or deeper as heading; single # is a list item in wiki
      if (mh[1].length >= 2) {
        flushPara(); blocks.push({ kind: "heading", level: mh[1].length, text: mh[2] }); continue;
      }
    }

    // leading space => pre
    if (/^ \S/.test(line)) {
      flushPara();
      const preLines: string[] = [line.slice(1)];
      while (idx + 1 < lines.length && /^ \S/.test(lines[idx + 1])) {
        preLines.push(lines[++idx].slice(1));
      }
      blocks.push({ kind: "pre", text: preLines.join("\n") });
      continue;
    }

    // definition list ; term : def OR ; term
    if (/^;/.test(line)) {
      flushPara();
      const items: { term?: string; def?: string }[] = [];
      const pushDl = (l: string) => {
        const m = l.match(/^;\s*(.+?)\s*(?::\s*(.+))?$/);
        if (m) items.push({ term: m[1], def: m[2] });
      };
      pushDl(line);
      while (idx + 1 < lines.length && /^[;:]/.test(lines[idx + 1])) {
        const nx = lines[++idx];
        if (/^;/.test(nx)) pushDl(nx);
        else {
          const m = nx.match(/^:+\s*(.+)$/);
          if (m) items.push({ def: m[1] });
        }
      }
      blocks.push({ kind: "dl", items });
      continue;
    }

    // indentation : ... (one or more colons)
    if (/^:+\s*\S/.test(line) && !/^::?\s*$/.test(line)) {
      flushPara();
      const m = line.match(/^(:+)\s*(.*)$/)!;
      blocks.push({ kind: "indent", level: m[1].length, text: m[2] });
      continue;
    }

    // list: * # markers (wiki) or - / 1. (markdown)
    if (/^[*#]+[ \t]?/.test(line) || /^-\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      flushPara();
      const listLines: string[] = [line];
      while (idx + 1 < lines.length && (/^[*#]+[ \t]?/.test(lines[idx + 1]) || /^-\s+/.test(lines[idx + 1]) || /^\d+\.\s+/.test(lines[idx + 1]))) {
        listLines.push(lines[++idx]);
      }
      blocks.push({ kind: "list", items: buildList(listLines) });
      continue;
    }

    buf.push(line);
  }
  flushPara();
  return blocks;
}

function buildList(lines: string[]): ListItem[] {
  // Convert markdown bullets to wiki for unified handling
  const norm = lines.map(l => {
    if (/^-\s+/.test(l)) return "*" + l.slice(1);
    if (/^\d+\.\s+/.test(l)) return "#" + l.replace(/^\d+\./, "");
    return l;
  });
  const root: ListItem[] = [];
  for (const line of norm) {
    const m = line.match(/^([*#]+)\s?(.*)$/);
    if (!m) continue;
    const marker = m[1];
    const text = m[2];
    let parent = root;
    let curItems = root;
    for (let lvl = 1; lvl <= marker.length; lvl++) {
      if (lvl === marker.length) {
        curItems.push({ marker, text, children: [] });
      } else {
        if (curItems.length === 0) curItems.push({ marker: marker.slice(0, lvl), text: "", children: [] });
        parent = curItems;
        curItems = curItems[curItems.length - 1].children;
      }
    }
    void parent;
  }
  return root;
}

// ---------------- Block renderers ----------------
function renderBlock(b: Block, key: React.Key): React.ReactNode {
  switch (b.kind) {
    case "hr":
      return <hr key={key} className="my-6 border-border" />;
    case "heading": {
      const lvl = Math.min(6, Math.max(2, b.level));
      const cls = lvl === 2
        ? "heading-display text-2xl md:text-3xl text-primary mt-8 mb-3 pb-2 border-b border-border"
        : lvl === 3
        ? "heading-display text-xl md:text-2xl text-primary mt-6 mb-2"
        : "font-semibold text-lg text-primary mt-5 mb-2";
      return React.createElement(`h${lvl}`, { key, className: cls }, renderInline(b.text));
    }
    case "paragraph":
      return <p key={key} className="my-3 leading-[1.95]">{renderInline(b.text)}</p>;
    case "pre":
      return <pre key={key} className="my-4 p-3 rounded-md bg-secondary/60 border border-border text-sm overflow-x-auto font-mono whitespace-pre">{b.text}</pre>;
    case "blockquote":
      return <blockquote key={key} className="my-4 border-r-4 border-gold pr-4 italic text-foreground/85">{renderInline(b.text)}</blockquote>;
    case "poem":
      return <div key={key} className="my-4 whitespace-pre-wrap leading-[1.9]">{renderInline(b.text)}</div>;
    case "indent":
      return <div key={key} className="my-1" style={{ paddingInlineStart: `${b.level * 1.5}rem` }}>{renderInline(b.text)}</div>;
    case "dl":
      return (
        <dl key={key} className="my-3">
          {b.items.map((it, i) => it.term
            ? <React.Fragment key={i}><dt className="font-semibold text-primary mt-2">{renderInline(it.term)}{it.def ? ":" : ""}</dt>{it.def && <dd className="mr-4 text-foreground/85">{renderInline(it.def)}</dd>}</React.Fragment>
            : <dd key={i} className="mr-4 text-foreground/85">{renderInline(it.def || "")}</dd>
          )}
        </dl>
      );
    case "list":
      return <RenderList key={key} items={b.items} />;
    case "raw":
      return <div key={key} dangerouslySetInnerHTML={{ __html: b.html }} />;
  }
}

function RenderList({ items }: { items: ListItem[] }) {
  if (!items.length) return null;
  const isOrdered = items[0].marker.endsWith("#");
  const Tag = (isOrdered ? "ol" : "ul") as "ol" | "ul";
  const cls = isOrdered ? "list-decimal pr-6 my-3 space-y-1" : "list-disc pr-6 my-3 space-y-1";
  return (
    <Tag className={cls}>
      {items.map((it, i) => (
        <li key={i} className="leading-[1.85]">
          {renderInline(it.text)}
          {it.children.length > 0 && <RenderList items={it.children} />}
        </li>
      ))}
    </Tag>
  );
}

// ---------------- Inline parser ----------------
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Protect <nowiki>...</nowiki>
  const nowikis: string[] = [];
  text = text.replace(/<nowiki>([\s\S]*?)<\/nowiki>/gi, (_, inner) => {
    nowikis.push(inner);
    return `\u0001NW${nowikis.length - 1}\u0001`;
  });

  // Expand templates {{...}} first (they may emit inline text/components)
  const tplTokens: { id: string; node: React.ReactNode }[] = [];
  text = expandTemplates(text, tplTokens);

  // Tokenize: split into segments around recognized inline constructs
  type Seg = { type: "text"; v: string } | { type: "node"; v: React.ReactNode };
  const segs: Seg[] = [{ type: "text", v: text }];

  const replace = (regex: RegExp, build: (m: RegExpExecArray) => React.ReactNode) => {
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (s.type !== "text") continue;
      const out: Seg[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      const r = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
      while ((m = r.exec(s.v))) {
        if (m.index > last) out.push({ type: "text", v: s.v.slice(last, m.index) });
        out.push({ type: "node", v: build(m) });
        last = r.lastIndex;
        if (m.index === r.lastIndex) r.lastIndex++;
      }
      if (last < s.v.length) out.push({ type: "text", v: s.v.slice(last) });
      if (out.length) { segs.splice(i, 1, ...out); i += out.length - 1; }
    }
  };

  // 1. Template tokens
  replace(/\u0002TPL(\d+)\u0002/g, m => tplTokens[+m[1]].node);

  // 2. Internal wiki links [[...]]
  replace(/\[\[([^\]\n|]+)(?:\|([^\]\n]*))?\]\]([\u0590-\u05FFa-zA-Z]*)/g, m => {
    const target = m[1].trim();
    let label = m[2];
    const suffix = m[3] || "";

    // External wiki (w:he:..., :he:...)
    if (/^w:|^:?[a-z]{2,3}:/i.test(target)) {
      const cleaned = target.replace(/^w:/i, "").replace(/^:/, "");
      const [, page] = cleaned.match(/^([a-z]{2,3}):(.+)$/i) || [, "he", cleaned];
      const lang = (cleaned.match(/^([a-z]{2,3}):/i) || [, "he"])[1];
      const href = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.replace(/\s/g, "_"))}`;
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">{label?.trim() || page}</a>;
    }

    // Cosmetic pipe trick: [[X (Y)|]]  or  [[Cat:X|]]
    let displaySlug = target;
    if (label === "" || label === undefined) {
      const m2 = target.match(/^(.+?)\s*\(.+?\)\s*$/);
      if (m2) label = m2[1];
      const m3 = target.match(/^[^:]+:(.+)$/);
      if (label === "" && m3) label = m3[1];
    }

    // Strip leading ":" (forced category link)
    if (displaySlug.startsWith(":")) displaySlug = displaySlug.slice(1);

    // Anchor link within page  [[#section]]
    if (displaySlug.startsWith("#")) {
      const anchor = displaySlug.slice(1);
      return <a href={`#${anchorize(anchor)}`} className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">{(label?.trim() || displaySlug) + suffix}</a>;
    }

    // [[slug#section]]
    let anchor = "";
    const hashIdx = displaySlug.indexOf("#");
    if (hashIdx >= 0) { anchor = displaySlug.slice(hashIdx + 1); displaySlug = displaySlug.slice(0, hashIdx); }

    const slug = displaySlug.trim().replace(/\s+/g, "-");
    const entry = entries.find(e => e.slug === slug || e.title === displaySlug.trim());
    const exists = !!entry;
    const finalLabel = (label?.trim() || entry?.title || displaySlug) + suffix;
    const to = `/entry/${entry?.slug || slug}${anchor ? `#${anchorize(anchor)}` : ""}`;

    return (
      <Link
        to={to}
        className={exists
          ? "text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary hover:bg-primary/5 rounded px-0.5 transition-all"
          : "text-destructive underline decoration-destructive/40 underline-offset-2 hover:decoration-destructive"
        }
        title={exists ? "" : "ערך זה עדיין לא קיים — לחצו כדי ליצור"}
      >
        {finalLabel}
      </Link>
    );
  });

  // 3. External bracketed links [http://... label]
  replace(/\[((?:https?|ftp|mailto):[^\s\]]+)(?:\s+([^\]]+))?\]/g, m => (
    <a href={m[1]} target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
      {m[2] || m[1]}
    </a>
  ));

  // 4. Bare URLs (very loose)
  replace(/\b(https?:\/\/[^\s<]+)/g, m => (
    <a href={m[1]} target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary break-all">
      {m[1]}
    </a>
  ));

  // 5. Bold/italic — wiki + markdown
  //   ''''' = bold-italic, ''' = bold, '' = italic
  replace(/'''''(.+?)'''''/g, m => <strong key={Math.random()}><em>{renderInlineSimple(m[1])}</em></strong>);
  replace(/'''(.+?)'''/g, m => <strong>{renderInlineSimple(m[1])}</strong>);
  replace(/''(.+?)''/g, m => <em>{renderInlineSimple(m[1])}</em>);
  replace(/\*\*(.+?)\*\*/g, m => <strong>{renderInlineSimple(m[1])}</strong>);
  replace(/(?<![*\w])\*([^*\n]+)\*(?!\*)/g, m => <em>{renderInlineSimple(m[1])}</em>);

  // 6. HTML-ish inline tags
  replace(/<br\s*\/?>/gi, () => <br />);
  replace(/<u>([\s\S]*?)<\/u>/gi, m => <u>{renderInlineSimple(m[1])}</u>);
  replace(/<(?:strike|s|del)>([\s\S]*?)<\/(?:strike|s|del)>/gi, m => <s className="line-through opacity-70">{renderInlineSimple(m[1])}</s>);
  replace(/<small>([\s\S]*?)<\/small>/gi, m => <small className="text-xs">{renderInlineSimple(m[1])}</small>);
  replace(/<(?:tt|code)>([\s\S]*?)<\/(?:tt|code)>/gi, m => <code className="font-mono text-sm bg-secondary px-1 rounded">{m[1]}</code>);
  replace(/<b>([\s\S]*?)<\/b>/gi, m => <strong>{renderInlineSimple(m[1])}</strong>);
  replace(/<i>([\s\S]*?)<\/i>/gi, m => <em>{renderInlineSimple(m[1])}</em>);
  replace(/<sub>([\s\S]*?)<\/sub>/gi, m => <sub>{renderInlineSimple(m[1])}</sub>);
  replace(/<sup>([\s\S]*?)<\/sup>/gi, m => <sup>{renderInlineSimple(m[1])}</sup>);
  replace(/<center>([\s\S]*?)<\/center>/gi, m => <span className="block text-center">{renderInlineSimple(m[1])}</span>);
  replace(/<span\s+style=["']([^"']+)["']>([\s\S]*?)<\/span>/gi, m => {
    const style: React.CSSProperties = {};
    m[1].split(";").forEach(decl => {
      const [k, v] = decl.split(":").map(s => s && s.trim());
      if (!k || !v) return;
      const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      // @ts-ignore
      style[camel] = v;
    });
    return <span style={style}>{renderInlineSimple(m[2])}</span>;
  });

  // 7. Restore <nowiki> escaped sections
  replace(/\u0001NW(\d+)\u0001/g, m => <>{nowikis[+m[1]]}</>);

  // 8. HTML entities — let the browser handle via dangerouslySetInnerHTML for text-only segs
  return segs.map((s, i) => s.type === "text"
    ? <React.Fragment key={i}>{decodeEntities(s.v)}</React.Fragment>
    : <React.Fragment key={i}>{s.v}</React.Fragment>
  );
}

// A lighter inline renderer for nested content (used inside bold/italic/etc.)
function renderInlineSimple(text: string): React.ReactNode {
  // Avoid infinite recursion by skipping templates; just handle entities.
  return decodeEntities(text);
}

function decodeEntities(s: string): string {
  if (!s.includes("&")) return s;
  const map: Record<string, string> = {
    nbsp: "\u00a0", lt: "<", gt: ">", amp: "&", quot: '"', apos: "'",
    laquo: "«", raquo: "»", sect: "§", para: "¶", bull: "•", mdash: "—", ndash: "–",
    copy: "©", reg: "®", trade: "™", cent: "¢", euro: "€", yen: "¥", pound: "£",
    times: "×", divide: "÷", minus: "−", plusmn: "±", deg: "°",
    le: "≤", ge: "≥", ne: "≠", asymp: "≈", equiv: "≡", infin: "∞",
    rarr: "→", larr: "←", harr: "↔", uarr: "↑", darr: "↓",
    sum: "∑", prod: "∏", int: "∫", radic: "√", part: "∂", nabla: "∇",
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ",
    eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν",
    xi: "ξ", omicron: "ο", pi: "π", rho: "ρ", sigma: "σ", sigmaf: "ς",
    tau: "τ", upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
    Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
    Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
    iquest: "¿", iexcl: "¡", dagger: "†", Dagger: "‡",
  };
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => map[n] ?? m);
}

function anchorize(s: string) {
  return s.trim().replace(/\s+/g, "_");
}

// ---------------- Template expansion ----------------
// Walk and replace {{NAME|p1|p2|...}} with either pre-rendered React nodes
// (stored in `tokens`) or with raw text.
function expandTemplates(src: string, tokens: { id: string; node: React.ReactNode }[]): string {
  // Iteratively find innermost templates (no nesting in our wiki) until none remain.
  const re = /\{\{([^{}]+)\}\}/g;
  let prev = "";
  let out = src;
  let guard = 0;
  while (out !== prev && guard++ < 8) {
    prev = out;
    out = out.replace(re, (full, body: string) => {
      const parts = body.split("|").map(s => s.trim());
      const name = parts[0];
      const args = parts.slice(1);
      const node = renderTemplate(name, args);
      if (node === undefined) return full; // unknown -> leave as-is
      if (typeof node === "string") return node;
      const id = `\u0002TPL${tokens.length}\u0002`;
      tokens.push({ id, node });
      return id;
    });
  }
  return out;
}

function renderTemplate(name: string, args: string[]): React.ReactNode | string | undefined {
  switch (name) {
    case "ש":
      return "\n";
    case "כ":
      return "\u200E"; // left-to-right mark to fix punctuation flow
    case "רווח קשיח":
      return "\u00a0".repeat(Math.max(1, parseInt(args[0] || "1", 10)));
    case "רווח קל":
      return "\u2009";
    case "מימין לשמאל":
      return <span dir="rtl">{args[0] || ""}</span>;
    case "משמאל לימין":
    case "ltr":
      return <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{args[0] || ""}</span>;
    case "ערך מורחב":
      return (
        <div className="my-3 px-3 py-2 rounded-md bg-secondary/60 border-r-4 border-primary text-sm">
          <span className="text-xs font-semibold text-primary ml-2">ערך מורחב –</span>
          <span>{args.map((a, i) => <React.Fragment key={i}>{i > 0 && ", "}{renderInlineLink(a)}</React.Fragment>)}</span>
        </div>
      );
    case "ציטוט":
    case "ציטוטון":
      return <blockquote className="my-3 border-r-4 border-gold pr-4 italic text-foreground/85">{args[0] || ""}</blockquote>;
    case "דרוש מקור":
      return <sup className="text-xs text-destructive">[דרוש מקור]</sup>;
    case "דרושה הבהרה":
      return <sup className="text-xs text-destructive">[דרושה הבהרה]</sup>;
    case "הערה":
      return <sup className="text-xs text-primary">[{args[0] || "הערה"}]</sup>;
    case "קצרמר":
      return (
        <div className="my-3 p-3 rounded-md bg-gold/10 border border-gold/40 text-sm text-foreground/85">
          <strong className="text-gold-deep">קצרמר:</strong> ערך זה הוא קצרמר. אתם מוזמנים להרחיב אותו.
        </div>
      );
    case "תב":
      return <code className="font-mono text-xs bg-secondary px-1 rounded">{`{{${args[0] || ""}}}`}</code>;
    case "כתב מחוק":
      return <s className="line-through opacity-70">{args[0] || ""}</s>;
    case "צבע רקע":
      return <span style={{ backgroundColor: args[1] || "#fff3a3" }}>{args[0] || ""}</span>;
    case "מסגרת":
    case "חלונית":
      return <span className="inline-block border border-border rounded px-1.5 py-0.5">{args[0] || ""}</span>;
    case "אפור":
      return <span className="text-muted-foreground">{args[0] || ""}</span>;
    case "-":
    case "---":
      return "—";
    case "פירוש נוסף":
    case "פירושונים":
    case "אין לבלבל עם":
      return (
        <div className="my-3 px-3 py-2 text-sm italic text-muted-foreground border-b border-border">
          {name}: {args.join(" · ")}
        </div>
      );
    default:
      return undefined;
  }
}

function renderInlineLink(target: string): React.ReactNode {
  const slug = target.trim().replace(/\s+/g, "-");
  const entry = entries.find(e => e.slug === slug || e.title === target.trim());
  return (
    <Link to={`/entry/${entry?.slug || slug}`} className="text-primary underline decoration-primary/30 hover:decoration-primary">
      {entry?.title || target}
    </Link>
  );
}