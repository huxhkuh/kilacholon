import { describe, expect, it } from "vitest";
import type { Entry } from "@/data/content";
import { normalizeSearch, searchEntries } from "./entry-search";

const entry = (slug: string, title: string, body = "", tags: string[] = []): Entry => ({
  slug, title, category: "economy", fullDescription: body, tags, shortDescription: "",
  level: "מתחילים", whyImportant: "", example: "", pros: [], cons: [], faq: [],
  related: [], views: 0, updatedAt: "2026-09-01",
});

describe("encyclopedia search", () => {
  it("finds Hebrew abbreviations regardless of quote style and vowel marks", () => {
    expect(normalizeSearch('אִינְפְלַצְיָה')).toBe("אינפלציה");
    expect(searchEntries([entry("bonds", 'אג״ח ממשלתיות')], 'אגח')).toHaveLength(1);
    expect(searchEntries([entry("bonds", 'אג״ח ממשלתיות')], 'אג"ח')).toHaveLength(1);
  });
  it("ranks exact and partial titles above mentions in the article body", () => {
    const input = [entry("body", "תוצר", "אינפלציה"), entry("partial", "אינפלציה צפויה"), entry("exact", "אינפלציה")];
    expect(searchEntries(input, "אינפלציה").map(item => item.slug)).toEqual(["exact", "partial", "body"]);
    expect(input[0].slug).toBe("body");
  });
  it("requires every search word and searches tags as well", () => {
    const input = [entry("found", "ריבית", "", ["ריאלית"]), entry("missing", "ריבית נומינלית")];
    expect(searchEntries(input, "ריבית ריאלית").map(item => item.slug)).toEqual(["found"]);
  });
});
