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
      const message = error instanceof Error ? error.message : String(error);
      alert(`MIDI export failed: ${message}`);
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

  // Get track information for advanced info box
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
        <div className="space-y-4">
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

          {/* Info (matches WAV style) */}
          <div className={`text-xs p-3 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-start gap-2">
              <FileIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">MIDI Export Details:</p>
                <ul className="space-y-1">
                  <li>• Format: Standard MIDI File Type 1</li>
                  <li>• Estimated size: {estimatedSize}</li>
                  {trackInfo && <li>• Tracks: {trackInfo.join(', ')}</li>}
                  {output?.meta?.bpm && <li>• Tempo: {output.meta.bpm} BPM</li>}
                  {output?.meta?.key && <li>• Key: {output.meta.key}</li>}
                  <li>• Channel mapping: 10 (drums), others for instruments</li>
                </ul>
              </div>
            </div>
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

      {/* All extra details are behind the advanced toggle to match WAV exporter presentation */}
    </div>
  );
}

export default MidiExporter;