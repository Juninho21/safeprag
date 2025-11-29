import React from 'react';
import { Device } from '../types';

interface DeviceSummaryProps {
  devices: Device[];
  selectedProduct?: { 
    id: string;
    name: string;
    activeIngredient: string;
    chemicalGroup: string;
    quantity: string;
    measure: string;
  } | null;
}

export const DeviceSummary: React.FC<DeviceSummaryProps> = ({ devices, selectedProduct }) => {
  // Agrupa dispositivos por tipo
  const devicesByType = devices.reduce((acc, device) => {
    const type = device.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  // Função para agrupar números em sequências
  const getSequences = (numbers: number[]): string => {
    if (numbers.length === 0) return '';
    
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const sequences: string[] = [];
    let start = sortedNumbers[0];
    let prev = start;

    for (let i = 1; i <= sortedNumbers.length; i++) {
      if (i === sortedNumbers.length || sortedNumbers[i] !== prev + 1) {
        if (start === prev) {
          sequences.push(start.toString());
        } else {
          sequences.push(`${start}-${prev}`);
        }
        if (i < sortedNumbers.length) {
          start = sortedNumbers[i];
          prev = start;
        }
      } else {
        prev = sortedNumbers[i];
      }
    }

    return sequences.join(', ');
  };

  if (devices.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Informações do Produto */}
      {selectedProduct && (
        <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Produto Utilizado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Nome:</span> {selectedProduct.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Princípio Ativo:</span> {selectedProduct.activeIngredient}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Grupo Químico:</span> {selectedProduct.chemicalGroup}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Quantidade:</span> {selectedProduct.quantity} {selectedProduct.measure}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resumo por tipo de dispositivo */}
      {Object.entries(devicesByType).map(([type, typeDevices]) => {
        // Agrupa por status para este tipo específico
        const devicesByStatus = typeDevices.reduce((acc, device) => {
          const status = device.status || 'Conforme';
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(device);
          return acc;
        }, {} as Record<string, Device[]>);

        // Ordena os status alfabeticamente (sem tratamento especial para "Não definido")
        const sortedStatuses = Object.entries(devicesByStatus).sort(([statusA], [statusB]) => {
          return statusA.localeCompare(statusB);
        });

        return (
          <div 
            key={type}
            className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            {/* Cabeçalho do tipo */}
            <div className="flex justify-between items-center mb-3">
              <div className="text-lg font-semibold text-gray-800">
                {type}
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Total: {typeDevices.length}
              </div>
            </div>

            {/* Status para este tipo */}
            <div className="space-y-2">
              {sortedStatuses.map(([status, statusDevices]) => {
                // Calcula a porcentagem para este status
                const percentage = ((statusDevices.length / typeDevices.length) * 100).toFixed(1);
                
                return (
                  <div
                    key={`${type}-${status}`}
                    className={`p-3 rounded-md ${
                      status === 'Conforme' 
                        ? 'bg-green-50 border border-green-200'
                        : status === 'Não definido'
                        ? 'bg-gray-50 border border-gray-300'
                        : status === 'Sem Dispositivo' || status === 'Dispositivo danificado'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${
                          status === 'Conforme' 
                            ? 'text-green-700'
                            : status === 'Não definido'
                            ? 'text-gray-600'
                            : status === 'Sem Dispositivo' || status === 'Dispositivo danificado'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}>
                          {status}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">
                            {statusDevices.length} ({percentage}%)
                          </span>
                        </div>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            status === 'Conforme'
                              ? 'bg-green-600'
                              : status === 'Não definido'
                              ? 'bg-gray-400'
                              : status === 'Sem Dispositivo' || status === 'Dispositivo danificado'
                              ? 'bg-red-600'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="text-sm text-gray-600">
                        Números: {getSequences(statusDevices.map(d => d.number))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
