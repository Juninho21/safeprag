import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ActionButtonsProps {
  onReset: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onReset,
}) => {
  return (
    <div className="mt-8 flex gap-4 justify-end md:sticky md:top-16 md:z-10 md:bg-transparent">
      <button
        onClick={onReset}
        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 md:self-start"
      >
        <RotateCcw className="h-5 w-5" />
        Refazer
      </button>
    </div>
  );
};