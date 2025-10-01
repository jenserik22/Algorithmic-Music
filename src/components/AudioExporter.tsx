import React, { useState } from 'react';
import type { EngineOutput } from '@/lib/music/engines/types';
import { encodeAudio, downloadAudio, type AudioFormat } from '@/lib/audio/audioEncoder';
import { DownloadIcon, FileIcon, MusicIcon } from '@/components/icons';
import { TonePlayer } from '@/lib/audio/tonePlayer';
import { WebAudioPlayer } from '@/lib/audio/webAudioPlayer';

interface AudioExporterProps {
  output: EngineOutput | null;
  disabled?: boolean;
  className?: string;
}

export function AudioExporter({ output, disabled = false, className = '' }: AudioExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<AudioFormat>('wav');
  const [showOptions, setShowOptions] = useState(false);
  
  // Get current theme from DOM
  const isDarkMode = document.documentElement.classList.contains('dark');

  const handleExport = async () => {
    if (!output || isExporting) return;

    setIsExporting(true);
    try {
      // First, we need to render the audio to get an AudioBuffer
      const audioBuffer = await renderOutputToBuffer(output);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      const filename = `algorithmic-music-${timestamp}`;
      
      // Encode to selected format
      const encodedAudio = await encodeAudio(audioBuffer, { 
        format: exportFormat,
        quality: exportFormat === 'mp3' ? 2 : undefined,
        bitrate: exportFormat === 'mp3' ? 192 : undefined
      });
      
      // Trigger download
      downloadAudio(encodedAudio, filename, exportFormat);
      
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Function to render the engine output to an AudioBuffer using Tone.js offline rendering
  const renderOutputToBuffer = async (engineOutput: EngineOutput): Promise<AudioBuffer> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Calculate duration from the output
        const duration = engineOutput.events && engineOutput.events.length > 0 
          ? Math.max(...engineOutput.events.map(event => event.time + (event.duration || 0.25))) + 1
          : 4.0; // add 1 second buffer
        
        // Import Tone dynamically to avoid issues
        const { Tone } = await import('tone');
        
        // Create an offline context for rendering
        const sampleRate = 44100;
        const offlineContext = Tone.Offline(() => {
          // Create instruments similar to what TonePlayer uses
          const synth = new Tone.Synth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.8 }
          }).toDestination();
          
          const bass = new Tone.MonoSynth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 }
          }).toDestination();
          
          const drums = new Tone.MembraneSynth({
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }
          }).toDestination();
          
          const noise = new Tone.NoiseSynth({
            envelope: { attack: 0.01, decay: 0.1, sustain: 0 }
          }).toDestination();
          
          // Schedule all events
          for (const event of engineOutput.events) {
            const pitch = Tone.Frequency(event.pitch, 'midi').toFrequency();
            const time = event.time;
            const duration = event.duration;
            const velocity = event.velocity;
            
            switch (event.track) {
              case 'bass':
                bass.triggerAttackRelease(pitch, duration, time, velocity);
                break;
              case 'drums':
                if (event.pitch < 40) {
                  // Low drum sounds - use membrane synth
                  drums.triggerAttackRelease(pitch, 0.1, time, velocity);
                } else {
                  // High drum sounds - use noise
                  noise.triggerAttackRelease(0.05, time, velocity * 0.7);
                }
                break;
              case 'chords':
              case 'lead':
              default:
                synth.triggerAttackRelease(pitch, duration, time, velocity * 0.8);
                break;
            }
          }
          
        }, duration, 2, sampleRate);
        
        // Render offline and convert to AudioBuffer
        const buffer = await offlineContext;
        resolve(buffer);
        
      } catch (error) {
        console.error('Tone.js rendering failed, falling back to simple synthesis:', error);
        
        // Fallback to simple synthesis if Tone.js fails
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const duration = engineOutput.events && engineOutput.events.length > 0 
            ? Math.max(...engineOutput.events.map(event => event.time + (event.duration || 0.25))) + 1
            : 4.0;
          
          const sampleRate = audioContext.sampleRate;
          const length = Math.ceil(duration * sampleRate);
          const buffer = audioContext.createBuffer(2, length, sampleRate);
          
          const leftChannel = buffer.getChannelData(0);
          const rightChannel = buffer.getChannelData(1);
          leftChannel.fill(0);
          rightChannel.fill(0);
          
          // Improved synthesis with better sound design
          for (const event of engineOutput.events) {
            const startSample = Math.floor(event.time * sampleRate);
            const durationSamples = Math.floor(event.duration * sampleRate);
            const endSample = Math.min(startSample + durationSamples, length);
            
            if (startSample >= length) continue;
            
            const frequency = 440 * Math.pow(2, (event.pitch - 69) / 12);
            const volume = event.velocity * 0.2;
            
            for (let i = startSample; i < endSample; i++) {
              if (i >= length) break;
              
              const t = (i - startSample) / sampleRate;
              let sample = 0;
              
              switch (event.track) {
                case 'drums':
                  if (event.pitch < 40) {
                    // Kick drum - sine wave with pitch sweep
                    const pitchEnv = Math.exp(-t * 20);
                    sample = Math.sin(2 * Math.PI * (frequency * pitchEnv) * t) * Math.exp(-t * 5) * volume * 2;
                  } else {
                    // Snare/hi-hat - filtered noise
                    sample = (Math.random() - 0.5) * Math.exp(-t * 8) * volume;
                  }
                  break;
                case 'bass':
                  // Square wave with filter sweep
                  const filterEnv = 0.5 + 0.5 * Math.exp(-t * 2);
                  sample = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * Math.exp(-t * 1.5) * volume * filterEnv;
                  break;
                default:
                  // Sawtooth with exponential decay
                  const sawwave = 2 * ((frequency * t) % 1) - 1;
                  sample = sawwave * Math.exp(-t * 2) * volume * 0.8;
                  break;
              }
              
              // Stereo positioning
              const pan = Math.min(1, Math.max(-1, (event.pitch - 60) / 24));
              leftChannel[i] += sample * (1 - pan) * 0.5;
              rightChannel[i] += sample * (1 + pan) * 0.5;
            }
          }
          
          resolve(buffer);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    });
  };

  if (!output && !disabled) {
    return (
      <div className={`text-center p-4 rounded-lg border border-dashed ${
        isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
      }`}>
        <MusicIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Generate music first to enable export</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Format Selection */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Export Format
        </label>
        <div className="flex gap-2">
          {(['wav', 'mp3'] as AudioFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                exportFormat === format
                  ? 'bg-blue-600 text-white border-blue-600'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FileIcon className="w-4 h-4 inline mr-1" />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          {exportFormat === 'wav' 
            ? 'Uncompressed, high quality (larger file size)'
            : 'Compressed, good quality (smaller file size)'
          }
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={disabled || !output || isExporting}
        className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          disabled || !output
            ? isDarkMode
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50'
        }`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Exporting...
          </>
        ) : (
          <>
            <DownloadIcon className="w-5 h-5" />
            Download {exportFormat.toUpperCase()}
          </>
        )}
      </button>

      {/* Info */}
      <div className={`text-xs p-3 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-start gap-2">
          <FileIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Export Quality:</p>
            <ul className="space-y-1 text-xs">
              <li>• WAV: 44.1kHz, 16-bit, stereo (CD quality)</li>
              <li>• MP3: 192kbps, stereo (high quality)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}