import React from 'react';
import { X } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { Device } from '../types';

interface ReportModalProps {
  devices: Device[];
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ devices, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <Dashboard devices={devices} />
      </div>
    </div>
  );
};