import { describe, it, expect } from 'vitest';
import { loadCatalog } from './catalog';
import { categories, entries } from './content';

const catalog = await loadCatalog();
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const newEntries = catalog.filter(entry => !entries.some(seed => seed.slug === entry.slug));
describe('Expanded encyclopedia publication gate', () => {
  it('includes 500 new full articles plus 50 additional stubs', () => {
    expect(newEntries.filter(entry => entry.contentStatus === 'article')).toHaveLength(500);
    expect(newEntries.filter(entry => entry.contentStatus === 'stub')).toHaveLength(50);
    expect(catalog).toHaveLength(623);
  });
  it('has unique titles, safe routes and resolvable category and article links', () => {
    const slugs = new Set(catalog.map(entry => entry.slug));
    const categorySlugs = new Set(categories.map(category => category.slug));
    const normalize = (text: string) => text.normalize('NFKC').replace(/[\s׳״"'־–-]/g, '');
    expect(slugs.size).toBe(catalog.length);
    expect(new Set(catalog.map(entry => normalize(entry.title))).size).toBe(catalog.length);
    const errors: string[] = [];
    for (const entry of catalog) {
      if (!/^[a-z0-9\u0590-\u05ff-]+$/.test(entry.slug)) errors.push(`${entry.slug}: invalid route`);
      if (!categorySlugs.has(entry.category)) errors.push(`${entry.slug}: category ${entry.category}`);
      const links = [...entry.fullDescription.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(match => match[1]);
      for (const link of [...entry.related, ...links]) if (!slugs.has(link)) errors.push(`${entry.slug} -> ${link}`);
      if (!entry.sources?.length) errors.push(`${entry.slug}: missing reading sources`);
      for (const source of entry.sources ?? []) if (!/^https:\/\//.test(source.url)) errors.push(`${entry.slug}: unsafe source`);
    }
    expect(errors).toEqual([]);
  });
  it('requires substantial original explanations, worked examples and specific FAQs', () => {
    const errors: string[] = [];
    for (const entry of newEntries) {
      if (entry.contentStatus === 'stub') {
        if (!entry.tags.includes('קצרמר') || words(entry.fullDescription) < 50) errors.push(`${entry.slug}: incomplete stub`);
        continue;
      }
      const text = [entry.shortDescription, entry.fullDescription, entry.whyImportant, entry.example, ...entry.pros, ...entry.cons, ...entry.faq.map(item => `${item.q} ${item.a}`)].join(' ');
      if (words(entry.fullDescription) < 170 || words(text) < 250) errors.push(`${entry.slug}: insufficient explanation`);
      if ((entry.fullDescription.match(/^## /gm) ?? []).length < 3) errors.push(`${entry.slug}: missing sections`);
      if (entry.faq.length < 2 || words(entry.example) < 15) errors.push(`${entry.slug}: missing example/FAQ`);
      if (entry.tags.includes('קצרמר')) errors.push(`${entry.slug}: inconsistent status`);
    }
    expect(new Set(newEntries.map(entry => entry.fullDescription)).size).toBe(newEntries.length);
    expect(errors).toEqual([]);
  });
});
