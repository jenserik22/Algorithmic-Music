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
        includeMetadata
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
            <h4 className={`font-medium mb-2 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              MIDI Export
            </h4>
            <p className={`text-sm mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-blue-700'
            }`}>
              Export your algorithmic composition as a MIDI file for use in any DAW
            </p>
            
            {/* File Info */}
            <div className={`text-xs space-y-1 ${
              isDarkMode ? 'text-gray-400' : 'text-blue-600'
            }`}>
              <div>Format: Standard MIDI File (Type 1)</div>
              <div>Estimated size: {estimatedSize}</div>
              {trackInfo && (
                <div>Tracks: {trackInfo.join(', ')}</div>
              )}
              {output?.meta?.bpm && (
                <div>Tempo: {output.meta.bpm} BPM</div>
              )}
              {output?.meta?.key && (
                <div>Key: {output.meta.key}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
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
      </div>

      {/* Export Button */}
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
      
      {/* Validation Error */}
      {!validation.valid && (
        <div className={`text-xs p-2 rounded ${
          isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'
        }`}>
          {validation.reason}
        </div>
      )}

      {/* MIDI Features Info */}
      <div className={`text-xs p-3 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-start gap-2">
          <FileIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">MIDI Export Features:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Multi-track separation:</strong> Lead, chords, bass, drums on separate tracks</li>
              <li>• <strong>General MIDI compatible:</strong> Works with all DAWs and software instruments</li>
              <li>• <strong>Proper timing:</strong> Preserves exact note timing and duration</li>
              <li>• <strong>Velocity data:</strong> Maintains note dynamics and expression</li>
              <li>• <strong>Tempo & time signature:</strong> Embedded for accurate playback</li>
              <li>• <strong>Instrument mapping:</strong> Realistic instrument assignments per track</li>
            </ul>
          </div>
        </div>
      </div>

      {/* DAW Compatibility */}
      <div className={`text-xs p-3 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-green-50 border-green-200 text-green-600'
      }`}>
        <p className="font-medium mb-1">Compatible with all major DAWs:</p>
        <p>Ableton Live, Logic Pro, FL Studio, Cubase, Pro Tools, Reaper, Studio One, and more</p>
      </div>
    </div>
  );
}

export default MidiExporter;