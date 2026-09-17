import { z } from 'zod';

const draftSchema = z.object({
  title: z.string().max(500), category: z.string().max(200),
  summary: z.string().max(5000), content: z.string().max(200000),
  tagsRaw: z.string().max(5000), changeSummary: z.string().max(5000),
  isStub: z.boolean(), defField: z.string().max(20000).default(''),
  explField: z.string().max(200000).default(''), exField: z.string().max(20000).default(''),
  expandMode: z.boolean().default(false),
});
export type EditDraft = z.infer<typeof draftSchema>;
export const draftKey = (slug: string) => slug ? `kilacholon:entry-draft:${slug}` : 'kilacholon:new-entry-draft';
export function readDraft(slug: string): EditDraft | null {
  try {
    const result = draftSchema.safeParse(JSON.parse(localStorage.getItem(draftKey(slug)) ?? 'null'));
    return result.success ? result.data : null;
  } catch { return null; }
}
export function writeDraft(slug: string, draft: EditDraft): boolean {
  try { localStorage.setItem(draftKey(slug), JSON.stringify(draft)); return true; } catch { return false; }
}
export function removeDraft(slug: string) {
  try { localStorage.removeItem(draftKey(slug)); } catch { /* Reading remains available when storage is blocked. */ }
}

/** Keep sign-in return paths inside the app. */
export function safeReturnPath(value: string | null, fallback = '/profile') {
  return value && /^\/(edit|entry)(\/|\?|$)/.test(value) && !/[\\\r\n]/.test(value) ? value : fallback;
}
