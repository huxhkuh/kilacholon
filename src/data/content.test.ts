import { describe, expect, it } from "vitest";
import { categories, entries, mergeApprovedRevisions, type Entry, type ApprovedRevision } from "./content";

const seed: Entry = {
  slug: "seed",
  title: "מקור",
  category: "beginners",
  tags: ["בסיס"],
  level: "מתחילים",
  shortDescription: "תקציר מקור",
  fullDescription: "תוכן מקור",
  whyImportant: "למה",
  example: "דוגמה",
  pros: ["יתרון"],
  cons: ["חיסרון"],
  faq: [],
  related: [],
  views: 7,
  updatedAt: "2025-01-01",
};

const revision = (overrides: Partial<ApprovedRevision> = {}): ApprovedRevision => ({
  entry_slug: "seed",
  title: "גרסה מאושרת",
  category: "beginners",
  summary: "תקציר מאושר",
  content: "תוכן מאושר",
  tags: ["מאושר"],
  created_at: "2026-01-01T00:00:00Z",
  reviewed_at: "2026-01-02T00:00:00Z",
  ...overrides,
});

describe("mergeApprovedRevisions", () => {
  it("uses the most recent approved revision while preserving structured seed fields", () => {
    const result = mergeApprovedRevisions([seed], [
      revision({ title: "ישן", created_at: "2025-12-01T00:00:00Z" }),
      revision(),
    ]);

    expect(result[0]).toMatchObject({
      title: "גרסה מאושרת",
      fullDescription: "תוכן מאושר",
      whyImportant: "למה",
      updatedAt: "2026-01-02T00:00:00Z",
    });
  });

  it("adds approved entries which do not exist in the seed catalog", () => {
    const result = mergeApprovedRevisions([seed], [
      revision({ entry_slug: "new-entry", title: "חדש" }),
    ]);

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      slug: "new-entry",
      title: "חדש",
      views: 0,
      pros: [],
    });
  });
});

describe("seed content catalog", () => {
  it("keeps categories, related entries, and wiki links internally consistent", () => {
    const categorySlugs = new Set(categories.map(category => category.slug));
    const entrySlugs = new Set(entries.map(entry => entry.slug));

    expect(entrySlugs.size).toBe(entries.length);
    expect(entries.length).toBeGreaterThanOrEqual(70);

    const missingCategories = entries
      .filter(entry => !categorySlugs.has(entry.category))
      .map(entry => `${entry.slug}:${entry.category}`);
    expect(missingCategories).toEqual([]);

    const missingRelated = entries.flatMap(entry =>
      entry.related
        .filter(slug => !entrySlugs.has(slug))
        .map(slug => `${entry.slug}->${slug}`),
    );
    expect(missingRelated).toEqual([]);

    const missingWikiLinks = entries.flatMap(entry => {
      const links = [...entry.fullDescription.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)]
        .map(match => match[1]);
      return links
        .filter(slug => !entrySlugs.has(slug))
        .map(slug => `${entry.slug}->${slug}`);
    });
    expect(missingWikiLinks).toEqual([]);
  });
});
