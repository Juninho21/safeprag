import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Device } from '../types';

interface AnimatedDeviceListProps {
  devices: Device[];
  selectedDevice: string;
}

interface GroupedDevices {
  [key: string]: Device[];
}

export const AnimatedDeviceList: React.FC<AnimatedDeviceListProps> = ({ devices, selectedDevice }) => {
  // Agrupa os dispositivos por status
  const groupedDevices = devices.reduce((acc: GroupedDevices, device) => {
    if (!acc[device.status]) {
      acc[device.status] = [];
    }
    acc[device.status].push(device);
    return acc;
  }, {});

  // Encontra o número do dispositivo selecionado
  const selectedDeviceInfo = devices.find(device => device.name === selectedDevice);

  return (
    <div className="p-4">
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h2 className="text-lg font-semibold text-blue-800">
          Dispositivo Selecionado: {selectedDevice || "Nenhum"}
          {selectedDeviceInfo && (
            <span className="ml-2 text-blue-600">
              (Número: {selectedDeviceInfo.number})
            </span>
          )}
        </h2>
        <p className="text-sm text-blue-600 mt-1">
          Total de dispositivos: {devices.length}
        </p>
      </div>
      
      <AnimatePresence>
        {Object.entries(groupedDevices).map(([status, statusDevices]) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                {status}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Total: {statusDevices.length}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  Números: {statusDevices.map(d => d.number).join(', ')}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {statusDevices.map((device) => (
                <motion.div
                  key={device.id}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-md border ${
                    device.name === selectedDevice 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`font-medium ${
                        device.name === selectedDevice 
                          ? 'text-blue-700' 
                          : 'text-gray-700'
                      }`}>
                        {device.name}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        (Nº {device.number})
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">#{device.id}</span>
                  </div>
                  {device.description && (
                    <p className="text-sm text-gray-600 mt-1">{device.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
