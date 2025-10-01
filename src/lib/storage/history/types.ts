import type { GenerationParams } from '@/lib/music/engines/types';

export type AlgorithmName =
  | 'stochastic'
  | 'markov'
  | 'cellular_automata'
  | 'l_system'
  | 'generative_grammar'
  | 'euclidean';

export interface GenerationRecord {
  id: string;
  createdAt: number; // epoch ms
  algorithm: AlgorithmName;
  params: GenerationParams;
}

export interface HistoryAdapter {
  add(r: Omit<GenerationRecord, 'id' | 'createdAt'> & Partial<Pick<GenerationRecord, 'createdAt'>>): Promise<GenerationRecord>;
  list(): Promise<GenerationRecord[]>; // newest-first
  get(id: string): Promise<GenerationRecord | undefined>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  count(): Promise<{ count: number; saturated: boolean }>;
}

export const DEFAULT_CAP = 20;
