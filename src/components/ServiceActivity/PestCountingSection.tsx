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


    </div>
  );
};