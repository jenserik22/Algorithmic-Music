import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { AnalysisBus } from '@/lib/audio/analysisBus';

interface SpectrumAnalyzerProps {
  isPlaying?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

type VisualizationMode = 'bars' | 'waveform' | 'circular';
type ColorTheme = 'auto' | 'neon' | 'fire' | 'ocean';

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  isPlaying = false,
  width = 400,
  height = 200,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fftAnalyzerRef = useRef<Tone.Analyser | null>(null);
  const waveformAnalyzerRef = useRef<Tone.Analyser | null>(null);
  const nativeAnalyzersRef = useRef<{ ctx: AudioContext; fft: AnalyserNode; waveform: AnalyserNode } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [mode, setMode] = useState<VisualizationMode>('bars');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('auto');
  const [sensitivity, setSensitivity] = useState(1.0);
  const [smoothing, setSmoothing] = useState(0.8);
  
  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Initialize analyzers ONLY when playing starts
  useEffect(() => {
    if (!isPlaying) return;
    
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const initializeAnalyzers = async () => {
      try {
        // Prefer native analyzers if a non-Tone engine registered
        const native = AnalysisBus.getNative();
        nativeAnalyzersRef.current = native;
        if (!native) {
          // Ensure Tone context is running first
          if (Tone.getContext().state !== 'running') {
            await Tone.start();
          }
          // Clean up existing analyzers
          if (fftAnalyzerRef.current) {
            fftAnalyzerRef.current.dispose();
          }
          if (waveformAnalyzerRef.current) {
            waveformAnalyzerRef.current.dispose();
          }
          // Create FFT analyzer for bars and circular modes
          fftAnalyzerRef.current = new Tone.Analyser('fft', 512);
          fftAnalyzerRef.current.smoothing = smoothing;
          // Create waveform analyzer for waveform mode
          waveformAnalyzerRef.current = new Tone.Analyser('waveform', 512);
          waveformAnalyzerRef.current.smoothing = 0.2; // Some smoothing for cleaner waveform
          // Better connection method - connect TO the analyzers FROM master
          Tone.getDestination().connect(fftAnalyzerRef.current);
          Tone.getDestination().connect(waveformAnalyzerRef.current);
        }
        
        console.log('[SpectrumAnalyzer] Analyzers initialized (native:', !!nativeAnalyzersRef.current, ')');
      } catch (error) {
        console.warn('[SpectrumAnalyzer] Failed to initialize:', error);
      }
    };

    // Initialize when playback starts
    initializeAnalyzers();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Don't dispose analyzers on every re-render, only when component unmounts
    };
  }, [isPlaying, smoothing]);

  // Get color scheme based on theme
  const getColorScheme = useCallback(() => {
    if (colorTheme === 'auto') {
      return isDarkMode ? {
        primary: '#60A5FA',    // Blue-400
        secondary: '#34D399',  // Emerald-400
        accent: '#F472B6',     // Pink-400
        background: '#1F2937'  // Gray-800
      } : {
        primary: '#2563EB',    // Blue-600
        secondary: '#059669',  // Emerald-600
        accent: '#DB2777',     // Pink-600
        background: '#F9FAFB'  // Gray-50
      };
    }
    
    const themes = {
      neon: {
        primary: '#00FF00',
        secondary: '#FF0080',
        accent: '#00FFFF',
        background: '#000000'
      },
      fire: {
        primary: '#FF4500',
        secondary: '#FFD700',
        accent: '#FF6347',
        background: '#1A0000'
      },
      ocean: {
        primary: '#0077BE',
        secondary: '#40E0D0',
        accent: '#4169E1',
        background: '#001122'
      }
    };
    
    return themes[colorTheme];
  }, [colorTheme, isDarkMode]);

  // Bar spectrum visualization
  const drawBarSpectrum = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: Float32Array) => {
    const colors = getColorScheme();
    const barCount = Math.min(32, Math.floor(data.length / 8)); // Use fewer bars, skip some data points
    const barWidth = canvas.width / barCount;
    
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert dB values to linear scale properly
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * (data.length / barCount));
      let value = data[dataIndex];
      
      // Convert from dB to linear scale (FFT data is typically in dB)
      // Tone.js FFT returns values typically between -100 to 0 dB
      const minDb = -100;
      const maxDb = 0;
      value = Math.max(minDb, Math.min(maxDb, value));
      const normalizedValue = (value - minDb) / (maxDb - minDb);
      
      const scaledValue = normalizedValue * sensitivity;
      const barHeight = Math.max(2, scaledValue * canvas.height * 0.9); // Ensure minimum height
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      
      if (scaledValue > 0.8) {
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(0.6, colors.secondary);
        gradient.addColorStop(1, colors.accent);
      } else if (scaledValue > 0.4) {
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);
      } else {
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.primary);
      }
      
      ctx.fillStyle = gradient;
      
      const x = i * barWidth;
      const y = canvas.height - barHeight;
      
      // Add slight spacing between bars
      ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      
      // Add glow effect for high values
      if (scaledValue > 0.6) {
        ctx.shadowColor = colors.accent;
        ctx.shadowBlur = 5;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        ctx.shadowBlur = 0;
      }
    }
  }, [sensitivity, getColorScheme]);

  // Waveform visualization  
  const drawWaveform = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: Float32Array) => {
    const colors = getColorScheme();
    
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = canvas.height / 2;
    const amplitude = centerY * 0.6 * sensitivity;
    
    // Use fewer points to make it less "busy" and easier to see
    const step = Math.max(1, Math.floor(data.length / canvas.width * 2));
    
    for (let i = 0; i < data.length; i += step) {
      const x = (i / data.length) * canvas.width;
      const y = centerY + (data[i] * amplitude);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [sensitivity, getColorScheme]);

  // Circular spectrum visualization
  const drawCircularSpectrum = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: Float32Array) => {
    const colors = getColorScheme();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    const minRadius = maxRadius * 0.3;
    
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barCount = Math.min(48, Math.floor(data.length / 4)); // Fewer bars
    const angleStep = (Math.PI * 2) / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * (data.length / barCount));
      let value = data[dataIndex];
      
      // Convert from dB to linear scale (same as bars)
      const minDb = -100;
      const maxDb = 0;
      value = Math.max(minDb, Math.min(maxDb, value));
      const normalizedValue = (value - minDb) / (maxDb - minDb);
      
      const scaledValue = normalizedValue * sensitivity;
      const barLength = Math.max(2, scaledValue * (maxRadius - minRadius));
      const angle = i * angleStep;
      
      const innerX = centerX + Math.cos(angle) * minRadius;
      const innerY = centerY + Math.sin(angle) * minRadius;
      const outerX = centerX + Math.cos(angle) * (minRadius + barLength);
      const outerY = centerY + Math.sin(angle) * (minRadius + barLength);
      
      // Color based on frequency (low = red, high = blue)
      const hue = (i / barCount) * 240; // 0-240 degrees
      const saturation = Math.min(100, scaledValue * 100);
      const lightness = 50 + (scaledValue * 30);
      
      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
      
      // Add glow for high values
      if (scaledValue > 0.6) {
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    
    // Draw center circle
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(centerX, centerY, minRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }, [sensitivity, getColorScheme]);

  // Animation loop
  const animate = useCallback(() => {
    try {
      if (!canvasRef.current) {
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const native = nativeAnalyzersRef.current;
      if (native) {
        // Use native analyzers from non-Tone engines
        if (mode === 'waveform') {
          const arr = new Float32Array(native.waveform.fftSize);
          native.waveform.getFloatTimeDomainData(arr);
          // Normalize to roughly -1..1 if needed
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] > -0.1 && arr[i] < 1.1) arr[i] = (arr[i] - 0.5) * 2;
          }
          drawWaveform(canvas, ctx, arr);
        } else {
          const bins = native.fft.frequencyBinCount;
          const arr = new Float32Array(bins);
          native.fft.getFloatFrequencyData(arr); // dB values
          drawBarSpectrum(canvas, ctx, arr);
          if (mode === 'circular') drawCircularSpectrum(canvas, ctx, arr);
        }
      } else {
        // Fallback to Tone analyzers
        const currentAnalyzer = mode === 'waveform' ? waveformAnalyzerRef.current : fftAnalyzerRef.current;
        if (!currentAnalyzer) {
          const colors = getColorScheme();
          ctx.fillStyle = colors.background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (isPlaying) animationFrameRef.current = requestAnimationFrame(animate);
          return;
        }
        const data = currentAnalyzer.getValue() as Float32Array;
        switch (mode) {
          case 'bars':
            drawBarSpectrum(canvas, ctx, data);
            break;
          case 'waveform':
            drawWaveform(canvas, ctx, data);
            break;
          case 'circular':
            drawCircularSpectrum(canvas, ctx, data);
            break;
        }
      }
      
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    } catch (error) {
      console.warn('Error in spectrum analyzer animation:', error);
      // Continue animation despite errors
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }
  }, [mode, isPlaying, drawBarSpectrum, drawWaveform, drawCircularSpectrum, getColorScheme]);

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear canvas when stopped
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const colors = getColorScheme();
          ctx.fillStyle = colors.background;
          ctx.fillRect(0, 0, width, height);
        }
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, animate, width, height, getColorScheme, smoothing]);

  return (
    <div className={`spectrum-analyzer ${className}`}>
      {/* Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode('bars')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === 'bars' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Bars
          </button>
          <button
            onClick={() => setMode('waveform')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === 'waveform'
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Wave
          </button>
          <button
            onClick={() => setMode('circular')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === 'circular'
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Circular
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            Sensitivity:
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="w-8 text-center">{sensitivity.toFixed(1)}</span>
          </label>
          
          <select
            value={colorTheme}
            onChange={(e) => setColorTheme(e.target.value as ColorTheme)}
            className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="auto">Auto</option>
            <option value="neon">Neon</option>
            <option value="fire">Fire</option>
            <option value="ocean">Ocean</option>
          </select>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 rounded-lg">
            <div className="text-center">
              <div className="text-2xl mb-2">🎵</div>
              <div className="text-sm">Start playback to see visualization</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectrumAnalyzer;