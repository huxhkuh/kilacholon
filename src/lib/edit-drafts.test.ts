import { beforeEach, describe, expect, it, vi } from 'vitest';
import { draftKey, readDraft, writeDraft, safeReturnPath, type EditDraft } from './edit-drafts';

const draft: EditDraft = { title: 'טיוטה', category: 'economy', summary: 'תקציר', content: 'תוכן שמור', tagsRaw: '', changeSummary: 'הרחבה', isStub: false, defField: '', explField: 'הרחבת קצרמר', exField: '', expandMode: true };
describe('Editing recovery', () => {
  beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
  it('keeps drafts separate and restores expansion text after navigation', () => {
    writeDraft('', draft); writeDraft('existing', { ...draft, title: 'עריכה קיימת' });
    expect(readDraft('')?.title).toBe('טיוטה');
    expect(readDraft('existing')).toEqual({ ...draft, title: 'עריכה קיימת' });
  });
  it('ignores corrupt browser storage and reports blocked persistence', () => {
    localStorage.setItem(draftKey(''), '{'); expect(readDraft('')).toBeNull();
    localStorage.setItem(draftKey(''), JSON.stringify({ title: 12 })); expect(readDraft('')).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(writeDraft('', draft)).toBe(false);
  });
  it('only returns from sign-in to internal article/editor routes', () => {
    expect(safeReturnPath('/edit/micro-opportunity-cost')).toBe('/edit/micro-opportunity-cost');
    for (const bad of ['//evil.example', 'https://evil.example', '/edit\\evil.example', '/admin']) expect(safeReturnPath(bad)).toBe('/profile');
  });
});
