import React from 'react';
import { ExclamationIcon, MusicIcon, SettingsIcon } from '@/components/icons';

export function EducationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  // Get current theme from DOM
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-label="Algorithm education" 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`max-w-2xl w-full mx-auto rounded-lg shadow-xl border max-h-[80vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold flex items-center gap-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <MusicIcon className="w-6 h-6" />
            How Algorithmic Music Generation Works
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors hover:bg-opacity-80 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Overview */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <ExclamationIcon className="w-5 h-5" />
              Overview
            </h3>
            <p className={`leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              This application generates original music using various algorithmic approaches. Each algorithm creates unique musical patterns based on mathematical rules, probability, and musical theory.
            </p>
          </div>

          {/* Generation Process */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <SettingsIcon className="w-5 h-5" />
              Generation Process
            </h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  1. Algorithm Engines
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Different engines (Stochastic, Markov chains, Cellular Automata, L-Systems, etc.) create seed-deterministic note events using mathematical and probabilistic approaches.
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  2. Musical Arrangement
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  The arranger organizes generated notes into musical tracks (chords, bass, drums, lead) and structures them into sections with fills and effects.
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  3. Audio Synthesis
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Tone.js renders the tracks using virtual synthesizers, effects, and optional LFO automation to create the final audio output.
                </p>
              </div>
            </div>
          </div>

          {/* Algorithm Types */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Available Algorithms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                { name: 'Stochastic', desc: 'Random generation with musical constraints' },
                { name: 'Markov Chains', desc: 'Probability-based note sequences' },
                { name: 'Cellular Automata', desc: 'Grid-based pattern evolution' },
                { name: 'L-Systems', desc: 'Fractal recursive structures' },
                { name: 'Generative Grammar', desc: 'Rule-based composition' },
                { name: 'Euclidean Rhythms', desc: 'Mathematical rhythm patterns' },
                { name: 'SoundHelix', desc: 'Advanced multi-track generation' }
              ].map((alg) => (
                <div key={alg.name} className={`p-3 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {alg.name}
                  </div>
                  <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {alg.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-colors font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
