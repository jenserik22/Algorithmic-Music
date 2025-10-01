import { describe, it, expect, vi } from 'vitest';
import { signUp, signIn, signOut, type SupabaseAuthClient } from '../lib/supabase/auth';

function makeAuthMock() {
  return {
    auth: {
      signUp: vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
      signInWithPassword: vi.fn(async () => ({ data: { session: { access_token: 't' } }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    }
  } as unknown as SupabaseAuthClient;
}

describe('supabase auth helpers', () => {
  it('signUp calls supabase.auth.signUp', async () => {
    const client = makeAuthMock();
    const res = await signUp(client, { email: 'a@b.com', password: 'secret' });
    expect(client.auth.signUp).toHaveBeenCalled();
    expect(res.error).toBeNull();
  });

  it('signIn calls supabase.auth.signInWithPassword', async () => {
    const client = makeAuthMock();
    const res = await signIn(client, { email: 'a@b.com', password: 'secret' });
    expect(client.auth.signInWithPassword).toHaveBeenCalled();
    expect(res.error).toBeNull();
  });

  it('signOut calls supabase.auth.signOut', async () => {
    const client = makeAuthMock();
    const res = await signOut(client);
    expect(client.auth.signOut).toHaveBeenCalled();
    expect(res.error).toBeNull();
  });
});
