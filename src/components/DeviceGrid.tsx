import React from 'react';
import { Bug } from 'lucide-react';
import { Device } from '../types';

interface DeviceGridProps {
  devices: Device[];
  onDeviceClick: (deviceId: number) => void;
  selectedDeviceId: number | null;
}

export const DeviceGrid: React.FC<DeviceGridProps> = ({ devices, onDeviceClick, selectedDeviceId }) => {
  const handleDeviceClick = (device: Device) => {
    // Se o dispositivo já está selecionado, vai remover a seleção
    onDeviceClick(device.id);
  };

  // Filtra dispositivos com número zero
  const filteredDevices = devices.filter(device => device.number !== 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Bug className="h-5 w-5 text-blue-600" />
        Dispositivos Disponíveis
      </h2>
      <div className="flex flex-wrap gap-1">
        {filteredDevices.map((device) => (
          <button
            key={device.id}
            onClick={() => handleDeviceClick(device)}
            className={`w-9 h-9 flex items-center justify-center rounded border text-sm font-semibold hover:shadow-md transition-shadow ${
              device.id === selectedDeviceId 
                ? 'bg-green-200 border-green-400 text-green-600' 
                : device.status 
                  ? 'bg-red-100 border-red-300 text-red-600' 
                  : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            {device.number}
          </button>
        ))}
      </div>
      {filteredDevices.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Nenhum dispositivo disponível.
        </p>
      )}
    </div>
  );
};