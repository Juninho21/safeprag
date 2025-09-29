import React from 'react';
import { DevicePestCounter } from '../DevicePestCounter';
import { DevicePestCount } from '../../types/pest.types';

interface PestCountingModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Array<{
    id: number;
    type: string;
    number: number;
    status: string;
  }>;
  onSavePestCounts: (pestCounts: DevicePestCount[]) => void;
  savedPestCounts?: DevicePestCount[];
}

export const PestCountingModal: React.FC<PestCountingModalProps> = ({
  isOpen,
  onClose,
  devices,
  onSavePestCounts,
  savedPestCounts = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Contagem de Pragas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-4">
          {devices && devices.length > 0 ? (
            <div className="bg-white rounded-lg p-4">
              <DevicePestCounter
                devices={devices.filter(device => device.status !== 'inativo').map(device => ({
                  type: device.type,
                  number: device.number || device.id
                }))}
                onSavePestCounts={(counts) => {
                  onSavePestCounts(counts);
                }}
              />
            </div>
          ) : (
            <p className="text-gray-600 italic">Nenhum dispositivo disponível para contagem de pragas.</p>
          )}
          
          {/* Resumo das contagens */}
          {savedPestCounts.length > 0 && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Resumo de Contagem de Pragas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {savedPestCounts.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                    <h4 className="font-medium text-gray-800">{item.deviceType} {item.deviceNumber}</h4>
                    <ul className="mt-2 space-y-1">
                      {item.pests.map((pest, pestIndex) => (
                        <li key={pestIndex} className="text-sm text-gray-600 flex justify-between">
                          <span>{pest.name}</span>
                          <span className="font-medium">{pest.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 sm:py-2 rounded-lg font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};