import React, { useState, useEffect } from 'react';
import { DevicePestCounter } from '../DevicePestCounter';
import { Pest, DevicePestCount } from '../../types/pest.types';

interface PestCountingSectionProps {
  devices: Array<{
    id: number;
    type: string;
    number: number;
    status: string;
  }>;
  onSavePestCounts: (pestCounts: DevicePestCount[]) => void;
  savedPestCounts?: DevicePestCount[];
}

export const PestCountingSection: React.FC<PestCountingSectionProps> = ({
  devices,
  onSavePestCounts,
  savedPestCounts = []
}) => {
  const [showPestCounting, setShowPestCounting] = useState(false);
  const [pestCounts, setPestCounts] = useState<DevicePestCount[]>(savedPestCounts);

  // Atualiza os dados quando savedPestCounts mudar
  useEffect(() => {
    if (savedPestCounts.length > 0) {
      setPestCounts(savedPestCounts);
    }
  }, [savedPestCounts]);

  // Função para salvar as contagens de pragas
  const handleSavePestCounts = (counts: DevicePestCount[]) => {
    setPestCounts(counts);
    onSavePestCounts(counts);
  };

  // Filtra apenas dispositivos ativos para contagem
  const activeDevices = devices && devices.length > 0 ? devices.filter(device => device.status !== 'inativo').map(device => ({
    type: device.type,
    number: device.number || device.id
  })) : [];

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Contagem de Pragas</h2>
        <button
          onClick={() => setShowPestCounting(!showPestCounting)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {showPestCounting ? 'Ocultar Contagem' : 'Mostrar Contagem'}
        </button>
      </div>

      {showPestCounting && (
        <div className="bg-white rounded-lg shadow p-4">
          {activeDevices.length > 0 ? (
            <DevicePestCounter
              devices={activeDevices}
              onSavePestCounts={handleSavePestCounts}
            />
          ) : (
            <p className="text-gray-600 italic">Nenhum dispositivo disponível para contagem de pragas.</p>
          )}
        </div>
      )}

      {/* Resumo das contagens (sempre visível) */}
      {!showPestCounting && pestCounts.length > 0 && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Resumo de Contagem de Pragas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pestCounts.map((item, index) => (
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
  );
};