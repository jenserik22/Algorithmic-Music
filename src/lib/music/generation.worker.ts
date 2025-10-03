/**
 * Web Worker for Music Generation
 * 
 * Offloads CPU-intensive music generation to a separate thread
 * to keep the UI responsive and avoid blocking the main thread.
 */

import { engines, type AlgorithmName } from './engines';
import type { GenerationParams, EngineOutput } from './engines/types';

export interface WorkerRequest {
  id: string;
  type: 'generate';
  algorithm: AlgorithmName;
  params: GenerationParams;
}

export interface WorkerResponse {
  id: string;
  type: 'success' | 'error' | 'progress';
  data?: EngineOutput;
  error?: string;
  progress?: number;
}

/**
 * Handle incoming messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, algorithm, params } = event.data;

  if (type !== 'generate') {
    postResponse(id, 'error', undefined, 'Unknown request type');
    return;
  }

  try {
    // Send initial progress
    postProgress(id, 0);

    // Get the engine
    const engine = engines[algorithm];
    if (!engine) {
      throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    // Send progress update
    postProgress(id, 25);

    // Generate music (CPU-intensive operation)
    const output = engine.generate(params);

    // Validate output
    if (!output || !output.events || !Array.isArray(output.events)) {
      throw new Error('Invalid engine output');
    }

    // Send progress update
    postProgress(id, 75);

    // Send success response
    postResponse(id, 'success', output);

    // Final progress
    postProgress(id, 100);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    postResponse(id, 'error', undefined, errorMessage);
  }
};

/**
 * Send a response back to the main thread
 */
function postResponse(
  id: string,
  type: 'success' | 'error',
  data?: EngineOutput,
  error?: string
): void {
  const response: WorkerResponse = {
    id,
    type,
    ...(data && { data }),
    ...(error && { error }),
  };
  self.postMessage(response);
}

/**
 * Send progress update to main thread
 */
function postProgress(id: string, progress: number): void {
  const response: WorkerResponse = {
    id,
    type: 'progress',
    progress,
  };
  self.postMessage(response);
}

// Log worker initialization
console.log('[Worker] Music generation worker initialized');
