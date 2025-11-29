import React from 'react';
import { DEVICE_TYPES } from '../constants';

interface DeviceSelectorProps {
  selectedDevice: string;
  onDeviceChange: (device: string) => void;
  disabled?: boolean;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  selectedDevice,
  onDeviceChange,
  disabled = false,
}) => {
  return (
    <div>
      <label className="block text-lg font-semibold text-gray-700 mb-2">
        Tipo de Dispositivo
      </label>
      <select
        value={selectedDevice}
        onChange={(e) => onDeviceChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base disabled:bg-gray-100"
      >
        <option value=""></option>
        {DEVICE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
};