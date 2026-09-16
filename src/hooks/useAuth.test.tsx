import { StrictMode } from 'react';
import { act, render, screen, waitFor, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';

const backend = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  resolveRoles: null as null | ((result: unknown) => void),
  getSession: vi.fn(),
  roles: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: {
    onAuthStateChange: (listener: typeof backend.listener) => { backend.listener = listener; return { data: { subscription: { unsubscribe() {} } } }; },
    getSession: backend.getSession, signOut: vi.fn(),
  },
  from: () => ({ select: () => ({ eq: backend.roles }) }),
} }));
function Probe() {
  const { loading, isEditor, user } = useAuth();
  return <div data-testid="auth">{loading ? 'loading' : isEditor ? 'editor' : user ? 'reader' : 'guest'}</div>;
}
describe('Authorization loading and stale requests', () => {
  beforeEach(() => {
    backend.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-a' } } } });
    backend.roles.mockImplementation(() => new Promise(resolve => { backend.resolveRoles = resolve; }));
  });
  afterEach(cleanup);
  it('keeps authorization pending until roles resolve, including StrictMode remount', async () => {
    render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>);
    await waitFor(() => expect(backend.resolveRoles).toBeTypeOf('function'));
    expect(screen.getByTestId('auth').textContent).toBe('loading');
    await act(async () => { backend.resolveRoles?.({ data: [{ role: 'editor' }], error: null }); });
    expect(screen.getByTestId('auth').textContent).toBe('editor');
  });
  it('never restores editor privileges from a response arriving after sign-out', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(backend.roles).toHaveBeenCalled());
    await act(async () => { backend.listener?.('SIGNED_OUT', null); });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('guest'));
    await act(async () => { backend.resolveRoles?.({ data: [{ role: 'editor' }], error: null }); });
    expect(screen.getByTestId('auth').textContent).toBe('guest');
  });
});
