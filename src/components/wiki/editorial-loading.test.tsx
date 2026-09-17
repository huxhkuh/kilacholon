import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { entries, type Entry } from '@/data/content';
import { draftKey, readDraft, writeDraft } from '@/lib/edit-drafts';
import EditEntry from '@/pages/EditEntry';
import HistorySection from './HistorySection';
import TalkSection from './TalkSection';

type Response = { data: unknown[]; error: null };
const state = vi.hoisted(() => ({
  auth: { user: { id: 'editor-a' } as { id: string } | null, isEditor: true, loading: false },
  entries: [] as Entry[],
  communityLoading: false,
  requests: [] as { table: string; slug: string; resolve: (value: Response) => void }[],
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => state.auth }));
vi.mock('@/hooks/usePublishedEntries', () => ({ usePublishedEntries: () => ({
  entries: state.entries, isLoading: false, isCommunityLoading: state.communityLoading,
  catalogError: null, communityError: null,
}) }));
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/wiki/WikiText', () => ({ default: ({ text }: { text: string }) => <div>{text}</div> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let slug = '';
  const query = {
    select: () => query,
    eq: (_key: string, value: string) => { slug = value; return query; },
    order: () => query,
    in: () => Promise.resolve({ data: [], error: null }),
    limit: () => new Promise<Response>(resolve => state.requests.push({ table, slug, resolve })),
  };
  return query;
} } }));
const route = (child: ReactNode) => <MemoryRouter initialEntries={['/edit/mania']}><Routes><Route path="/edit/:slug" element={child} /></Routes></MemoryRouter>;
const revision = { id: 'revision-a', author_id: 'editor-a', title: 'טיוטה פרטית', summary: 'פרטים שטרם פורסמו', content: 'תוכן לעורכים', status: 'pending', created_at: '2026-01-01T00:00:00Z' };

beforeEach(() => {
  localStorage.clear();
  state.auth = { user: { id: 'editor-a' }, isEditor: true, loading: false };
  state.entries = [{ ...entries[0], slug: 'mania', title: 'כותרת הבסיס', fullDescription: 'תוכן הבסיס' }];
  state.communityLoading = false;
  state.requests = [];
});
afterEach(cleanup);

describe('Editorial loading regressions', () => {
  it('saves an unfinished guest draft without applying publication validation', () => {
    state.auth = { user: null, isEditor: false, loading: false };
    render(<MemoryRouter initialEntries={['/edit?draft=1']}><Routes><Route path="/edit" element={<EditEntry />} /></Routes></MemoryRouter>);
    fireEvent.change(document.querySelector('#title')!, { target: { value: 'רק כותרת בינתיים' } });
    localStorage.removeItem(draftKey(''));
    fireEvent.click(screen.getByRole('button', { name: 'שמירת טיוטה מקומית' }));
    expect(readDraft('')?.title).toBe('רק כותרת בינתיים');
    expect(readDraft('')?.content).toBe('');
  });

  it('initializes the editor from the approved revision after community loading finishes', async () => {
    state.communityLoading = true;
    const view = render(route(<EditEntry />));
    expect(screen.queryByDisplayValue('כותרת הבסיס')).toBeNull();
    state.entries = [{ ...state.entries[0], title: 'הכותרת המאושרת', fullDescription: 'התוכן המאושר העדכני' }];
    state.communityLoading = false;
    view.rerender(route(<EditEntry />));
    await waitFor(() => expect(screen.getByDisplayValue('הכותרת המאושרת')).not.toBeNull());
    expect(screen.getByDisplayValue('התוכן המאושר העדכני')).not.toBeNull();
  });

  it('keeps a local draft when the approved revision finishes loading', async () => {
    writeDraft('mania', { title: 'הטיוטה שלי', category: 'stocks', summary: 'תקציר הטיוטה', content: 'תוכן שנכתב מקומית', tagsRaw: '', changeSummary: '', isStub: false, defField: '', explField: '', exField: '', expandMode: false });
    state.communityLoading = true;
    const view = render(route(<EditEntry />));
    state.entries = [{ ...state.entries[0], title: 'כותרת חדשה מהקהילה' }];
    state.communityLoading = false;
    view.rerender(route(<EditEntry />));
    await waitFor(() => expect(screen.getByDisplayValue('הטיוטה שלי')).not.toBeNull());
    expect(screen.getByDisplayValue('תוכן שנכתב מקומית')).not.toBeNull();
  });

  it('immediately hides permission-sensitive history after sign-out and reloads it', async () => {
    const view = render(<HistorySection slug="mania" />);
    await act(async () => { state.requests[0].resolve({ data: [revision], error: null }); });
    expect(screen.getByText('טיוטה פרטית')).not.toBeNull();
    state.auth = { user: null, isEditor: false, loading: false };
    view.rerender(<HistorySection slug="mania" />);
    expect(screen.queryByText('טיוטה פרטית')).toBeNull();
    expect(state.requests).toHaveLength(2);
    await act(async () => { state.requests[1].resolve({ data: [], error: null }); });
    expect(screen.queryByText('פרטים שטרם פורסמו')).toBeNull();
  });

  it('ignores discussion responses from a previously displayed article', async () => {
    state.auth = { user: null, isEditor: false, loading: false };
    const view = render(<MemoryRouter><TalkSection slug="article-a" /></MemoryRouter>);
    view.rerender(<MemoryRouter><TalkSection slug="article-b" /></MemoryRouter>);
    const comment = { id: 'comment', author_id: 'reader', created_at: '2026-01-01T00:00:00Z' };
    await act(async () => { state.requests[1].resolve({ data: [{ ...comment, body: 'תגובה לערך השני' }], error: null }); });
    expect(screen.getByText('תגובה לערך השני')).not.toBeNull();
    await act(async () => { state.requests[0].resolve({ data: [{ ...comment, body: 'תגובה לערך הראשון' }], error: null }); });
    expect(screen.queryByText('תגובה לערך הראשון')).toBeNull();
    expect(screen.getByText('תגובה לערך השני')).not.toBeNull();
  });
});
