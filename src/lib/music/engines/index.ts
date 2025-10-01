import type { Engine } from './types';
import { StochasticEngine } from './stochastic';
import { MarkovEngine } from './markov';
import { LSystemEngine } from './lSystem';
import { GenerativeGrammarEngine } from './generativeGrammar';
import { EuclideanRhythmsEngine } from './euclideanRhythms';
import { CellularAutomataEngine } from './cellularAutomata';
import { HelixEngine } from './helix';
import { EnhancedHelixEngine } from './enhanced-helix';

const registry = {
  stochastic: StochasticEngine,
  markov: MarkovEngine,
  l_system: LSystemEngine,
  generative_grammar: GenerativeGrammarEngine,
  euclidean: EuclideanRhythmsEngine,
  cellular_automata: CellularAutomataEngine,
  helix: HelixEngine,
  enhanced_helix: EnhancedHelixEngine,
} as const satisfies Record<string, Engine>;

export type AlgorithmName = keyof typeof registry;

export function getEngine(name: AlgorithmName): Engine {
  return registry[name];
}

export const engines: Record<AlgorithmName, Engine> = registry;
