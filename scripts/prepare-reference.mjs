import fs from 'node:fs/promises';
import { entries } from '../src/data/content.ts';
import { normalizeSearch, readingMinutes } from '../src/lib/entry-search.ts';
import { sourceCatalog, entryFile } from './reference-catalog.mjs';

const catalog = await sourceCatalog();
const seedSlugs = new Set(entries.map(entry => entry.slug));
await fs.mkdir('src/data/generated', { recursive: true });
// This directory contains generated public reference data only.
await fs.rm('public/reference', { recursive: true, force: true });
await fs.mkdir('public/reference', { recursive: true });
const index = [];
for (const entry of catalog) {
  if (!/^[a-z0-9\u0590-\u05ff-]+$/.test(entry.slug)) throw new Error('Unsafe article slug');
  const contentFile = entryFile(entry);
  await fs.writeFile(`public/reference/${contentFile}`, JSON.stringify(entry));
  if (seedSlugs.has(entry.slug)) continue;
  // All titles, summaries, links, counts and full-text search remain available
  // without downloading any article body. Search matches words independently.
  const searchText = [...new Set(normalizeSearch(`${entry.fullDescription} ${entry.whyImportant} ${entry.example}`).split(' '))].join(' ');
  index.push({
    ...entry, fullDescription: '', whyImportant: '', example: '', pros: [], cons: [], faq: [], sources: [],
    contentFile, searchText, readingTime: readingMinutes(entry),
  });
}
await fs.writeFile('src/data/generated/reference-index.json', JSON.stringify(index));
console.log(`Prepared ${catalog.length} independent articles and a complete searchable index.`);
