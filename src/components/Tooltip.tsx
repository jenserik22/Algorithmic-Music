import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for parameter labels with tooltips
export function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <Tooltip content={tooltip}>
        <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 dark:text-gray-400 border border-gray-400 dark:border-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          ?
        </span>
      </Tooltip>
    </div>
  );
}
