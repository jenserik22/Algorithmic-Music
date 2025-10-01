import { DEFAULT_CAP, GenerationRecord, HistoryAdapter } from './types';

function genId(prefix = 'rec'): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rnd}`;
}

export class MemoryHistoryAdapter implements HistoryAdapter {
  private records: GenerationRecord[] = [];
  constructor(private cap = DEFAULT_CAP) {}

  async add(r: Omit<GenerationRecord, 'id' | 'createdAt'> & Partial<Pick<GenerationRecord, 'createdAt'>>): Promise<GenerationRecord> {
    const rec: GenerationRecord = {
      id: genId(),
      createdAt: r.createdAt ?? Date.now(),
      algorithm: r.algorithm,
      params: r.params,
    };
    this.records.push(rec);
    this.enforceCap();
    return rec;
  }

  private enforceCap() {
    // Keep newest-first ordering and trim to cap
    this.records.sort((a, b) => b.createdAt - a.createdAt);
    if (this.records.length > this.cap) this.records = this.records.slice(0, this.cap);
  }

  async list(): Promise<GenerationRecord[]> {
    return [...this.records].sort((a, b) => b.createdAt - a.createdAt);
  }

  async get(id: string): Promise<GenerationRecord | undefined> {
    return this.records.find(r => r.id === id);
  }

  async remove(id: string): Promise<void> {
    this.records = this.records.filter(r => r.id !== id);
  }

  async clear(): Promise<void> {
    this.records = [];
  }

  async count(): Promise<{ count: number; saturated: boolean }> {
    return { count: this.records.length, saturated: this.records.length >= this.cap };
  }
}
