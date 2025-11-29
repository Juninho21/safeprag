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
    status: string | string[];
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
  const [resetSignal, setResetSignal] = React.useState(0);
  // Dispositivos ativos para contagem (mesma regra usada no render)
  const activeDevices = devices && devices.length > 0 ? devices.filter(device => {
    const statusList = Array.isArray(device.status)
      ? device.status
      : device.status
        ? [device.status]
        : [];
    return !statusList.includes('inativo');
  }).map(device => ({
    type: device.type,
    number: device.number || (device as any).id
  })) : [];

  // Verifica se todos os dispositivos ativos possuem contagem salva
  const allCounted = activeDevices.every(d =>
    savedPestCounts.some(s => s.deviceType === d.type && s.deviceNumber === d.number)
  );
  const pendingCount = Math.max(0, activeDevices.length - savedPestCounts.filter(s =>
    activeDevices.some(d => d.type === s.deviceType && d.number === s.deviceNumber)
  ).length);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Contagem de Pragas</h2>
          <button
            onClick={allCounted ? onClose : undefined}
            disabled={!allCounted}
            className={`text-gray-500 ${allCounted ? 'hover:text-gray-700' : 'opacity-50 cursor-not-allowed'} focus:outline-none`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-4">
          {/* Aviso de regra */}
          <div className="mb-3 text-sm text-gray-600">
            É obrigatório realizar a contagem de todos os dispositivos listados.
            {pendingCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">Pendentes: {pendingCount}</span>
            )}
          </div>

          {activeDevices && activeDevices.length > 0 ? (
            <div className="bg-white rounded-lg p-4">
              <DevicePestCounter
                devices={activeDevices}
                onSavePestCounts={(counts) => {
                  onSavePestCounts(counts);
                }}
                resetSignal={resetSignal}
              />
            </div>
          ) : (
            <p className="text-gray-600 italic">Nenhum dispositivo disponível para contagem de pragas.</p>
          )}
          
          {/* Resumo das contagens */}
          {savedPestCounts.length > 0 && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-700">Resumo de Contagem de Pragas</h3>
                <button
                  onClick={() => {
                    onSavePestCounts([]);
                    setResetSignal(prev => prev + 1);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md"
                  title="Limpar lista de contagem"
                >
                  Refazer
                </button>
              </div>
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
        <div className="flex items-center justify-between p-4 border-t">
          <span className="text-sm text-gray-600">
            {allCounted ? 'Todas as contagens concluídas.' : `Pendentes: ${pendingCount}`}
          </span>
          <button
            onClick={allCounted ? onClose : undefined}
            disabled={!allCounted}
            className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 sm:py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};