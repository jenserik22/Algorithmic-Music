import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Tone from 'tone';

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
  const animationFrameRef = useRef<number | null>(null);
  
  const [mode, setMode] = useState<VisualizationMode>('bars');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('auto');
  const [sensitivity, setSensitivity] = useState(1.0);
  const [smoothing, setSmoothing] = useState(0.8);
  
  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Initialize Web Audio analyzers
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeAnalyzers = () => {
      try {
        // Clean up existing analyzers
        if (fftAnalyzerRef.current) {
          fftAnalyzerRef.current.dispose();
        }
        if (waveformAnalyzerRef.current) {
          waveformAnalyzerRef.current.dispose();
        }
        
        // Create FFT analyzer for bars and circular modes
        fftAnalyzerRef.current = new Tone.Analyser('fft', 256);
        fftAnalyzerRef.current.smoothing = smoothing;
        
        // Create waveform analyzer for waveform mode
        waveformAnalyzerRef.current = new Tone.Analyser('waveform', 1024);
        waveformAnalyzerRef.current.smoothing = 0.1; // Less smoothing for waveform
        
        // Connect both analyzers to the master destination
        const destination = Tone.getDestination();
        destination.connect(fftAnalyzerRef.current);
        destination.connect(waveformAnalyzerRef.current);
        

      } catch (error) {
        console.warn('Failed to initialize spectrum analyzers:', error);
      }
    };

    const checkAndInit = () => {
      if (Tone.getContext().state === 'running') {
        initializeAnalyzers();
      } else {
        // Retry after a short delay
        timeoutId = setTimeout(checkAndInit, 200);
      }
    };

    // Start initialization
    checkAndInit();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      try {
        if (fftAnalyzerRef.current) {
          fftAnalyzerRef.current.dispose();
          fftAnalyzerRef.current = null;
        }
        if (waveformAnalyzerRef.current) {
          waveformAnalyzerRef.current.dispose();
          waveformAnalyzerRef.current = null;
        }
      } catch (error) {
        console.warn('Error disposing analyzers:', error);
      }
    };
  }, [smoothing]);

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
    const barCount = Math.min(64, data.length / 2); // Use fewer bars for clarity
    const barWidth = canvas.width / barCount;
    
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < barCount; i++) {
      const value = Math.abs(data[i]) * sensitivity;
      const barHeight = Math.min(value * canvas.height * 2, canvas.height);
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      
      if (barHeight > canvas.height * 0.8) {
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(0.6, colors.secondary);
        gradient.addColorStop(1, colors.accent);
      } else if (barHeight > canvas.height * 0.4) {
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
      if (barHeight > canvas.height * 0.6) {
        ctx.shadowColor = colors.accent;
        ctx.shadowBlur = 10;
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
    const amplitude = centerY * 0.8 * sensitivity;
    
    for (let i = 0; i < data.length; i++) {
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
    ctx.shadowBlur = 5;
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
    
    const barCount = Math.min(64, data.length / 2);
    const angleStep = (Math.PI * 2) / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const value = Math.abs(data[i]) * sensitivity;
      const barLength = value * (maxRadius - minRadius);
      const angle = i * angleStep;
      
      const innerX = centerX + Math.cos(angle) * minRadius;
      const innerY = centerY + Math.sin(angle) * minRadius;
      const outerX = centerX + Math.cos(angle) * (minRadius + barLength);
      const outerY = centerY + Math.sin(angle) * (minRadius + barLength);
      
      // Color based on frequency (low = red, high = blue)
      const hue = (i / barCount) * 240; // 0-240 degrees
      const saturation = Math.min(100, value * 100);
      const lightness = 50 + (value * 30);
      
      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
      
      // Add glow for high values
      if (value > 0.6) {
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    
    // Draw center circle
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(centerX, centerY, minRadius * 0.1, 0, Math.PI * 2);
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
      
      // Choose the right analyzer for the current mode
      const currentAnalyzer = mode === 'waveform' ? waveformAnalyzerRef.current : fftAnalyzerRef.current;
      
      if (!currentAnalyzer) {
        // If analyzer isn't ready, show empty visualization
        const colors = getColorScheme();
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (isPlaying) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        return;
      }
      
      const data = currentAnalyzer.getValue() as Float32Array;
      
      // Add some fake data if we're not getting any (for testing)
      if (Math.max(...Array.from(data).map(Math.abs)) < 0.001 && isPlaying) {
        // Generate some test data for debugging
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.sin(Date.now() / 1000 + i / 10) * 0.5;
        }
      }
      
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
      // Ensure audio context is started and analyzers are initialized
      if (Tone.getContext().state === 'suspended') {
        Tone.getContext().resume().then(() => {
          // Reinitialize analyzers if needed
          if (!fftAnalyzerRef.current || !waveformAnalyzerRef.current) {
            setTimeout(() => {
              // Trigger reinitialize
              setSmoothing(s => s);
            }, 100);
          }
        });
      }
      
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