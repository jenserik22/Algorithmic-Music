import { describe, it, expect } from 'vitest';
import { FakeAudioContext } from '../test/mocks/webAudio';
import { createSupabaseClientMock } from '../test/mocks/supabase';

describe('shared mocks', () => {
  it('FakeAudioContext records scheduled notes in time order', () => {
    const ctx = new FakeAudioContext();
    ctx.schedule({ time: 0.5, pitch: 67, duration: 0.25, velocity: 0.8 });
    ctx.schedule({ time: 0.0, pitch: 60, duration: 0.5, velocity: 0.7 });
    const out = ctx.flush();
    expect(out[0].time).toBe(0);
    expect(out[1].time).toBe(0.5);
  });

  it('Supabase client mock supports basic insert/select/delete', async () => {
    const supa = createSupabaseClientMock();
    await supa.from('generations').insert({ id: '1', foo: 'bar' });
    const sel = await supa.from('generations').select();
    expect(sel.data?.length).toBe(1);
    await supa.from('generations').delete();
    const after = await supa.from('generations').select();
    expect(after.data?.length).toBe(0);
  });
});
