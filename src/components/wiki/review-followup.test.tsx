import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { entries } from '@/data/content';
import Index from '@/pages/Index';
import ReviewRevisions from '@/pages/ReviewRevisions';
import TalkSection from './TalkSection';

const state = vi.hoisted(() => ({
  comments: [] as Record<string, unknown>[],
  revisions: [] as Record<string, unknown>[],
  failNext: false,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'editor' }, isEditor: true, loading: false }) }));
vi.mock('@/hooks/usePublishedEntries', () => ({ usePublishedEntries: () => ({ entries }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let before = ''; let limit = Infinity; let update = false; let id = '';
  const query = {
    select: () => query,
    eq: (key: string, value: string) => { if (key === 'id') id = value; return query; },
    order: () => query,
    or: (filter: string) => { before = filter.split('id.lt.')[1].replace(')', ''); return query; },
    limit: (value: number) => { limit = value; return query; },
    in: () => query,
    update: () => { update = true; return query; },
    then: (resolve: (value: unknown) => void) => {
      if (state.failNext && !update) { state.failNext = false; return Promise.resolve(resolve({ data: null, error: { message: 'offline' } })); }
      if (update) { state.revisions = state.revisions.filter(row => row.id !== id); return Promise.resolve(resolve({ data: [{ id }], error: null })); }
      const rows = table === 'entry_talk' ? state.comments.filter(row => !before || String(row.id) < before) : table === 'entry_revisions' ? state.revisions : [];
      return Promise.resolve(resolve({ data: rows.slice(0, limit), error: null }));
    },
  };
  return query;
} } }));
const mount = (child: ReactNode) => render(<MemoryRouter>{child}</MemoryRouter>);
beforeEach(() => { state.comments = []; state.revisions = []; state.failNext = false; });
afterEach(cleanup);

it('renders three discovery cards with no featured duplicates for the bundled catalog', () => {
  mount(<Index />);
  const discovery = screen.getByRole('heading', { name: 'עוד משהו לגלות' }).closest('section')!;
  const featured = screen.getByRole('heading', { name: 'מושגים שכדאי להכיר' }).closest('section')!;
  const links = within(discovery).getAllByRole('link').map(link => link.getAttribute('href'));
  expect(links).toHaveLength(3);
  expect(new Set(links).size).toBe(3);
  const featuredLinks = within(featured).getAllByRole('link').map(link => link.getAttribute('href'));
  expect(links.every(link => !featuredLinks.includes(link))).toBe(true);
});

it('reaches comment 101 despite equal timestamps and deletion of the previous page boundary', async () => {
  state.comments = Array.from({ length: 101 }, (_, i) => ({ id: String(101 - i).padStart(3, '0'), body: `comment ${101 - i}`, author_id: 'reader', created_at: '2026-09-17T00:00:00Z' }));
  mount(<TalkSection slug="mania" />);
  await screen.findByText('comment 101');
  expect(screen.queryByText('comment 1')).toBeNull();
  state.comments = state.comments.filter(row => row.id !== '002');
  state.failNext = true;
  fireEvent.click(screen.getByRole('button', { name: 'תגובות קודמות' }));
  await screen.findByRole('alert');
  expect(screen.getByText('comment 101')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'ניסיון נוסף לטעינת תגובות' }));
  await screen.findByText('comment 1');
  expect(screen.queryByRole('button', { name: 'תגובות קודמות' })).toBeNull();
});

it('refills the 100-row review queue from the database after a decision', async () => {
  state.revisions = Array.from({ length: 101 }, (_, i) => ({ id: `r${i}`, title: `revision ${i}`, entry_slug: 'mania', status: 'pending', category: 'stocks', created_at: '2026-09-17T00:00:00Z', content: '', summary: '' }));
  mount(<ReviewRevisions />);
  await screen.findByText('revision 0');
  expect(screen.queryByText('revision 100')).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'דחייה' })[0]);
  await screen.findByText('revision 100');
  expect(screen.queryByText('revision 0')).toBeNull();
  expect(screen.queryByText('אין עריכות שממתינות לבדיקה.')).toBeNull();
});

it('does not report an empty queue when the post-review reload fails', async () => {
  state.revisions = [{ id: 'last', title: 'last revision', entry_slug: 'mania', created_at: '2026-09-17', content: '', summary: '' }];
  mount(<ReviewRevisions />);
  await screen.findByText('last revision');
  state.failNext = true;
  fireEvent.click(screen.getByRole('button', { name: 'דחייה' }));
  await screen.findByText('לא ניתן לטעון את תור העריכות.');
  expect(screen.queryByText('אין עריכות שממתינות לבדיקה.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'ניסיון נוסף' }));
  await waitFor(() => expect(screen.getByText('אין עריכות שממתינות לבדיקה.')).not.toBeNull());
});
