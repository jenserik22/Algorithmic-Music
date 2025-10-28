import { useRef, useState, useEffect } from 'react';
import type { EngineOutput, GenerationParams } from '@/lib/music/engines/types';
import { getEngine, type AlgorithmName } from '@/lib/music/engines';
import type { WorkerRequest, WorkerResponse } from './generation.worker';
import { memoryManager, suggestGarbageCollection } from '@/lib/utils/memoryManager';

type Status = 'idle' | 'generating' | 'success' | 'error';

interface Controller {
  canceled: boolean;
  timer?: ReturnType<typeof setTimeout>;
  interval?: ReturnType<typeof setInterval>;
  workerId?: string;
}

// Feature detection for Web Workers
const supportsWorkers = typeof Worker !== 'undefined';

// Worker pool for parallel generation
class WorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private maxWorkers = 2; // Limit to 2 workers to avoid memory issues

  constructor() {
    if (!supportsWorkers) return;

    // Initialize worker pool
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        const worker = new Worker(
          new URL('./generation.worker.ts', import.meta.url),
          { type: 'module' }
        );
        this.workers.push(worker);
        this.available.push(worker);

        // Register for memory management
        memoryManager.register('worker', () => {
          worker.terminate();
        });
      } catch (error) {
        console.warn('[WorkerPool] Failed to create worker:', error);
        break;
      }
    }

    console.log(`[WorkerPool] Initialized with ${this.workers.length} workers`);
  }

  getWorker(): Worker | null {
    if (!supportsWorkers || this.workers.length === 0) return null;
    
    // Get available worker or use first one
    const worker = this.available.pop() || this.workers[0];
    return worker;
  }

  releaseWorker(worker: Worker): void {
    if (!this.available.includes(worker)) {
      this.available.push(worker);
    }
  }

  terminate(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.available = [];
  }
}

// Singleton worker pool
let workerPool: WorkerPool | null = null;

function getWorkerPool(): WorkerPool {
  if (!workerPool) {
    workerPool = new WorkerPool();
  }
  return workerPool;
}

export function useGeneration() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [output, setOutput] = useState<EngineOutput | undefined>();
  const ctrlRef = useRef<Controller | null>(null);

  const cancel = () => {
    const c = ctrlRef.current;
    if (c) {
      c.canceled = true;
      if (c.timer) clearTimeout(c.timer);
      if (c.interval) clearInterval(c.interval);
    }
    setStatus('idle');
    setProgress(0);
    setError(undefined);
  };

  const generate = async (
    algorithm: AlgorithmName,
    params: GenerationParams
  ): Promise<EngineOutput> => {
    // reset
    cancel();
    setStatus('generating');
    setProgress(0);
    setOutput(undefined);
    setError(undefined);

    // Try to use Web Worker for generation
    const pool = getWorkerPool();
    const worker = pool.getWorker();

    if (worker) {
      // Use Web Worker (non-blocking)
      return new Promise<EngineOutput>((resolve, reject) => {
        const requestId = `gen_${Date.now()}_${Math.random()}`;
        const c: Controller = { canceled: false, workerId: requestId };
        ctrlRef.current = c;

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          const response = event.data;
          
          // Only handle messages for this request
          if (response.id !== requestId) return;

          if (c.canceled) {
            worker.removeEventListener('message', handleMessage);
            pool.releaseWorker(worker);
            return reject(new Error('cancelled'));
          }

          switch (response.type) {
            case 'progress':
              if (response.progress !== undefined) {
                setProgress(Math.floor(response.progress));
              }
              break;

            case 'success':
              worker.removeEventListener('message', handleMessage);
              pool.releaseWorker(worker);
              
              if (response.data) {
                setProgress(100);
                setStatus('success');
                setOutput(response.data);
                
                // Suggest GC after generation
                suggestGarbageCollection();
                
                resolve(response.data);
              } else {
                const err = new Error('No data in worker response');
                setStatus('error');
                setError(err.message);
                reject(err);
              }
              break;

            case 'error':
              worker.removeEventListener('message', handleMessage);
              pool.releaseWorker(worker);
              
              const error = new Error(response.error || 'Worker generation failed');
              setStatus('error');
              setError(error.message);
              reject(error);
              break;
          }
        };

        worker.addEventListener('message', handleMessage);

        // Send generation request to worker
        const request: WorkerRequest = {
          id: requestId,
          type: 'generate',
          algorithm,
          params,
        };
        worker.postMessage(request);
      });
    }

    // Fallback to main thread (blocking but works everywhere)
    console.warn('[Generation] Web Workers not available, falling back to main thread');
    
    const tryOnce = () =>
      new Promise<EngineOutput>((resolve, reject) => {
        const engine = getEngine(algorithm);
        const durationMs = Math.max(
          200,
          Math.min(2000, Math.floor(params.durationSecs * 300))
        );
        const steps = 5;
        const stepMs = Math.max(10, Math.floor(durationMs / steps));
        const c: Controller = { canceled: false };
        ctrlRef.current = c;

        let tick = 0;
        c.interval = setInterval(() => {
          if (c.canceled) return;
          tick += 1;
          setProgress(Math.min(99, Math.floor((tick / steps) * 100)));
          if (tick >= steps) {
            clearInterval(c.interval);
          }
        }, stepMs);

        c.timer = setTimeout(() => {
          if (c.canceled) return reject(new Error('cancelled'));
          try {
            console.log('[DEBUG] useGeneration.generate() calling engine with params:', {
              durationSecs: params.durationSecs,
              bpm: params.bpm,
              key: params.key,
              style: params.style
            });
            const out = engine.generate(params);
            console.log('[DEBUG] useGeneration.generate() got output:', {
              eventCount: out.events.length,
              maxTime: out.events.length > 0 ? Math.max(...out.events.map(e => e.time + e.duration)) : 0
            });
            setProgress(100);
            setStatus('success');
            setOutput(out);
            
            // Suggest GC after generation
            suggestGarbageCollection();
            
            resolve(out);
          } catch (e) {
            reject(e as Error);
          }
        }, durationMs);
      });

    try {
      return await tryOnce();
    } catch (e) {
      if (ctrlRef.current?.canceled) throw e;
      try {
        return await tryOnce();
      } catch (e2) {
        setStatus('error');
        setError((e2 as Error).message);
        throw e2;
      }
    }
  };

  const generateProgressive = async (
    algorithm: AlgorithmName,
    params: GenerationParams,
    opts?: { segmentSecs?: number; onPartial?: (slice: EngineOutput) => void }
  ): Promise<EngineOutput> => {
    cancel();
    setStatus('generating');
    setProgress(0);
    setOutput(undefined);
    setError(undefined);

    return await new Promise<EngineOutput>((resolve, reject) => {
      const engine = getEngine(algorithm);
      const total = Math.max(0.25, params.durationSecs);
      const seg = Math.max(0.25, Math.min(total, opts?.segmentSecs ?? 1));
      const c: Controller = { canceled: false };
      ctrlRef.current = c;

      let i = 0;
      const step = () => {
        if (c.canceled) return reject(new Error('cancelled'));
        const sliceStart = i * seg;
        const sliceEnd = Math.min((i + 1) * seg, total);
        try {
          const out = engine.generate({ ...params, durationSecs: sliceEnd });
          const newEvents = out.events.filter(e => e.time >= sliceStart && e.time < sliceEnd);
          if (opts?.onPartial && newEvents.length > 0) opts.onPartial({ events: newEvents, meta: out.meta });
          setProgress(Math.min(99, Math.floor((sliceEnd / total) * 100)));
          if (sliceEnd >= total) {
            setProgress(100);
            setStatus('success');
            setOutput(out);
            resolve(out);
            return;
          }
          i += 1;
          c.timer = setTimeout(step, 10);
        } catch (e) {
          reject(e as Error);
        }
      };
      step();
    });
  };

  return { status, progress, error, output, generate, generateProgressive, cancel };
}
