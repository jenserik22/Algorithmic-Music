export async function signUp(client: any, { email, password }: { email: string; password: string }) {
  return client.auth.signUp({ email, password });
}

export async function signIn(client: any, { email, password }: { email: string; password: string }) {
  return client.auth.signInWithPassword({ email, password });
}

export async function signOut(client: any) {
  return client.auth.signOut();
}
