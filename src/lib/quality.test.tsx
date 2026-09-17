import { describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WikiText from '@/components/wiki/WikiText';
import { appUrl, isSafeExternalUrl } from './urls';
import { revisionDiff } from './revisionDiff';
import { mergeApprovedRevisions, entries } from '@/data/content';

describe('base-path URLs and editorial content', () => {
  it('keeps GitHub Pages prefix in canonical and sharing URLs', () => {
    expect(appUrl('/entry/mania', 'https://example.org', '/kilacholon/')).toBe('https://example.org/kilacholon/entry/mania/');
    expect(appUrl('/', 'https://example.org', '/kilacholon/')).toBe('https://example.org/kilacholon/');
    expect(appUrl('/entry/mania', 'https://example.org', '/')).toBe('https://example.org/entry/mania/');
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });
  it('renders headings and safe links without executing submitted markup', () => {
    const { container } = render(<MemoryRouter><WikiText text={'## הגדרה\n\n[מקור](https://example.org) [מסוכן](javascript:alert)\n\n<script>alert(1)</script>\n\n[[mania|מניה]]'} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'הגדרה', level: 2 }).getAttribute('id')).toBe('הגדרה');
    expect(screen.getByRole('link', { name: 'מקור' }).getAttribute('href')).toBe('https://example.org');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[href^="javascript:"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'מניה' }).getAttribute('href')).toBe('/entry/mania');
    cleanup();
  });
  it('keeps sources and correct stub status when a community expansion is approved', () => {
    const base = { ...entries[0], sources: [{ title: 'source', url: 'https://example.org' }], tags: ['קצרמר'], contentStatus: 'stub' as const };
    const [result] = mergeApprovedRevisions([base], [{ entry_slug: base.slug, title: base.title, category: base.category, summary: 'תקציר', content: 'ערך מורחב', tags: [], created_at: '2026-09-01', reviewed_at: '2026-09-02' }]);
    expect(result.contentStatus).toBe('article');
    expect(result.sources).toEqual(base.sources);
  });
  it('shows removed and added lines in the editorial comparison', () => {
    const result = revisionDiff('כותרת\nטעות\nסוף', 'כותרת\nתיקון\nסוף');
    expect(result).toContainEqual({ type: 'removed', text: 'טעות' });
    expect(result).toContainEqual({ type: 'added', text: 'תיקון' });
    expect(result.filter(line => line.type === 'same')).toHaveLength(2);
  });
  it('removes unsubstantiated Einstein attribution and simplistic global-index claim', () => {
    expect(entries.find(entry => entry.slug === 'ribit-deribit')?.fullDescription).not.toContain('איינשטיין');
    expect(entries.find(entry => entry.slug === 'mehu-madad')?.faq[0].a).toContain('מפותחים');
    expect(entries.filter(entry => !entry.tags.includes('קצרמר')).every(entry => entry.updatedAt === '2026-09-16')).toBe(true);
  });
});
