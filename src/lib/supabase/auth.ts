export type SupabaseAuthClient = {
  auth: {
    signUp: (args: { email: string; password: string }) => Promise<unknown>;
    signInWithPassword: (args: { email: string; password: string }) => Promise<unknown>;
    signOut: () => Promise<unknown>;
  };
};

export async function signUp(client: SupabaseAuthClient, { email, password }: { email: string; password: string }): Promise<{ data: unknown; error: unknown }> {
  return client.auth.signUp({ email, password }) as unknown as { data: unknown; error: unknown };
}

export async function signIn(client: SupabaseAuthClient, { email, password }: { email: string; password: string }): Promise<{ data: unknown; error: unknown }> {
  return client.auth.signInWithPassword({ email, password }) as unknown as { data: unknown; error: unknown };
}

export async function signOut(client: SupabaseAuthClient): Promise<{ data: unknown; error: unknown }> {
  return client.auth.signOut() as unknown as { data: unknown; error: unknown };
}
