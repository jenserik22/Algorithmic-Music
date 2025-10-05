import React, { useState } from 'react';
import type { EngineOutput } from '@/lib/music/engines/types';
import { MidiExporter as MidiExportClass } from '@/lib/export/midiExporter';
import { DownloadIcon, FileIcon, MusicIcon } from '@/components/icons';

interface MidiExporterProps {
  output: EngineOutput | null;
  disabled?: boolean;
  className?: string;
}

export function MidiExporter({ output, disabled = false, className = '' }: MidiExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quantize, setQuantize] = useState<'off' | '1/16' | '1/8' | '1/4'>('off');
  
  // Get current theme from DOM
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  // Validate output for MIDI export
  const validation = MidiExportClass.validateOutput(output);
  const isValid = validation.valid && !disabled;
  
  // Get file size estimate
  const estimatedSize = output ? MidiExportClass.getEstimatedFileSize(output) : '0B';

  const handleExport = async () => {
    if (!output || isExporting || !validation.valid) return;

    setIsExporting(true);
    
    try {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      const fileName = `algorithmic-music-${timestamp}`;
      
      // Export MIDI file
      MidiExportClass.exportToMidi(output, {
        fileName,
        includeMetadata,
        quantize,
      });
      
    } catch (error) {
      console.error('MIDI export failed:', error);
      alert(`MIDI export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!output && !disabled) {
    return (
      <div className={`text-center p-4 rounded-lg border border-dashed ${
        isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
      }`}>
        <MusicIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Generate music first to enable MIDI export</p>
      </div>
    );
  }

  // Get track information for display
  const getTrackInfo = () => {
    if (!output || !output.events) return null;
    
    const tracks = output.events.reduce((acc, event) => {
      const track = event.track || 'lead';
      acc[track] = (acc[track] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tracks).map(([name, count]) => `${name} (${count})`);
  };

  const trackInfo = getTrackInfo();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* MIDI Export Info */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-3">
          <FileIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <div className="flex-1">
            <h4 className={`font-medium ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              MIDI Export
            </h4>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-blue-700'
            }`}>
              Export your composition as a MIDI file for use in any DAW
            </p>
            {/* Compact info row */}
            <div className={`mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1 ${
              isDarkMode ? 'text-gray-400' : 'text-blue-600'
            }`}>
              <span>Type 1</span>
              <span>Estimated: {estimatedSize}</span>
              {trackInfo && <span>Tracks: {trackInfo.join(', ')}</span>}
              {output?.meta?.bpm && <span>Tempo: {output.meta.bpm} BPM</span>}
              {output?.meta?.key && <span>Key: {output.meta.key}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Primary action */}
      <button
        onClick={handleExport}
        disabled={!isValid || isExporting}
        className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          !isValid
            ? isDarkMode
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50'
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
            Download MIDI
          </>
        )}
      </button>

      {/* Advanced options toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className={`text-sm underline ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-3">
          <label className={`flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="rounded"
            />
            Include metadata (song title, algorithm, key, style)
          </label>

          {/* Quantize setting */}
          <div className="flex items-center justify-between text-sm">
            <label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Quantize grid
            </label>
            <select
              value={quantize}
              onChange={(e) => setQuantize(e.target.value as typeof quantize)}
              className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="off">Off</option>
              <option value="1/16">1/16</option>
              <option value="1/8">1/8</option>
              <option value="1/4">1/4</option>
            </select>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {!validation.valid && (
        <div className={`text-xs p-2 rounded ${
          isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'
        }`}>
          {validation.reason}
        </div>
      )}

      {/* Keep feature info behind advanced toggle now (removed from always-on view) */}

      {/* Compatibility block removed from default view to reduce clutter */}
    </div>
  );
}

export default MidiExporter;