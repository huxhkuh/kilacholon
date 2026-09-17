import { z } from 'zod';
import { entries as seedEntries, type Entry } from './content';
import index from './generated/reference-index.json';
import { appUrl } from '@/lib/urls';

export const referenceEntries: Entry[] = [...seedEntries, ...index as Entry[]];
export const referenceBySlug = new Map(referenceEntries.map(entry => [entry.slug, entry]));

const articleSchema = z.object({
  slug: z.string(), title: z.string(), category: z.string(), tags: z.array(z.string()),
  level: z.enum(['מתחילים', 'בינוני', 'מתקדם']), shortDescription: z.string(),
  fullDescription: z.string().min(1), whyImportant: z.string(), example: z.string(),
  pros: z.array(z.string()), cons: z.array(z.string()), faq: z.array(z.object({ q: z.string(), a: z.string() })),
  related: z.array(z.string()), views: z.number(), updatedAt: z.string(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
  contentStatus: z.enum(['article', 'stub']).optional(), aliases: z.array(z.string()).optional(),
});

export function parseArticle(value: unknown, slug: string): Entry {
  const entry = articleSchema.parse(value) as Entry;
  if (entry.slug !== slug) throw new Error('Article response did not match the requested entry');
  return entry;
}

/** Static article pages carry their own initial body, independently of requests. */
export function embeddedArticle(metadata?: Entry): Entry | undefined {
  if (!metadata?.contentFile || typeof document === 'undefined') return undefined;
  try {
    const text = document.getElementById('entry-data')?.textContent;
    if (!text) return undefined;
    const payload = JSON.parse(text);
    if (payload.contentFile !== metadata.contentFile) return undefined;
    return parseArticle(payload.entry, metadata.slug);
  } catch { return undefined; }
}

export async function fetchArticle(metadata: Entry, signal?: AbortSignal): Promise<Entry> {
  if (!metadata.contentFile) return metadata;
  const response = await fetch(appUrl(`reference/${metadata.contentFile}`), { signal });
  if (!response.ok) throw new Error(`Article request failed (${response.status})`);
  return parseArticle(await response.json(), metadata.slug);
}
