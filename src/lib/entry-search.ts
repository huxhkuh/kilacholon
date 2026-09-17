import type { Entry } from "@/data/content";

/** Ignore Hebrew vowel marks and punctuation while preserving meaningful words. */
export const normalizeSearch = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0591-\u05c7]/g, "")
  .toLocaleLowerCase("he")
  .replace(/["׳״]/g, "")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

export const isStubEntry = (entry: Entry) => entry.tags.includes("קצרמר");
export const readingMinutes = (entry: Entry) => entry.readingTime ?? Math.max(1, Math.ceil(
  [entry.fullDescription, entry.whyImportant, entry.example, ...entry.pros, ...entry.cons,
    ...entry.faq.map(item => `${item.q} ${item.a}`)].join(" ").split(/\s+/).length / 180,
));

export function searchEntries(entries: Entry[], query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return entries;
  const words = normalized.split(/\s+/);
  return entries.map(entry => {
    const title = normalizeSearch(entry.title);
    const tags = normalizeSearch([...entry.tags, ...(entry.aliases ?? [])].join(" "));
    const summary = normalizeSearch(entry.shortDescription);
    const body = entry.searchText ?? normalizeSearch(`${entry.fullDescription} ${entry.whyImportant} ${entry.example}`);
    const all = `${title} ${tags} ${summary} ${body}`;
    if (!words.every(word => all.includes(word))) return { entry, score: 0 };
    const score = (title === normalized ? 100 : title.includes(normalized) ? 50 : 0)
      + words.reduce((sum, word) => sum + (title.includes(word) ? 20 : 0)
        + (tags.includes(word) ? 10 : 0) + (summary.includes(word) ? 5 : 0) + 1, 0);
    return { entry, score };
  }).filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "he"))
    .map(result => result.entry);
}
