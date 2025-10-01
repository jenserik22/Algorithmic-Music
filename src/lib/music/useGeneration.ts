import { useRef, useState } from 'react';
import type { EngineOutput, GenerationParams } from '@/lib/music/engines/types';
import { getEngine, type AlgorithmName } from '@/lib/music/engines';

type Status = 'idle' | 'generating' | 'success' | 'error';

interface Controller {
  canceled: boolean;
  timer?: ReturnType<typeof setTimeout>;
  interval?: ReturnType<typeof setInterval>;
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
            const out = engine.generate(params);
            setProgress(100);
            setStatus('success');
            setOutput(out);
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
