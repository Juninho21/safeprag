import React, { useState } from 'react';
import { STATUS_TYPES } from '../constants';

interface StatusSelectorProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onSelectAll: () => void;
  disabled?: boolean;
  selectedDevice: string;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  selectedStatus,
  onStatusChange,
  onSelectAll,
  disabled = false,
  selectedDevice
}) => {
  const [showNewStatusInput, setShowNewStatusInput] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  const filteredStatusTypes = [...STATUS_TYPES];
  
  if (selectedDevice === 'Armadilha luminosa') {
    filteredStatusTypes.push('Lâmpada queimada');
  }
  
  const finalStatusTypes = filteredStatusTypes.filter((status) => {
    if (selectedDevice === 'Porta isca') {
      const excludedOptions = [
        'Refil substituído',
        'Atrativo biológico substituído',
        'Desarmada',
        'Desligada'
      ];
      return !excludedOptions.includes(status);
    }
    if (selectedDevice === 'Placa adesiva') {
      const excludedOptions = [
        'Mofada',
        'Consumida',
        'Deteriorada',
        'Atrativo biológico substituído',
        'Desarmada',
        'Desligada'
      ];
      return !excludedOptions.includes(status);
    }
    if (selectedDevice === 'Armadilha mecânica') {
      const excludedOptions = [
        'Mofada',
        'Consumida',
        'Deteriorada',
        'Refil substituído',
        'Atrativo biológico substituído',
        'Desligada'
      ];
      return !excludedOptions.includes(status);
    }
    if (selectedDevice === 'Armadilha luminosa') {
      const excludedOptions = [
        'Mofada',
        'Consumida',
        'Deteriorada',
        'Atrativo biológico substituído',
        'Desarmada'
      ];
      return !excludedOptions.includes(status);
    }
    if (selectedDevice === 'Armadilha biológica') {
      const excludedOptions = [
        'Mofada',
        'Consumida',
        'Deteriorada',
        'Refil substituído',
        'Desarmada',
        'Desligada'
      ];
      return !excludedOptions.includes(status);
    }
    if (selectedDevice === 'Armadilha feromônio') {
      const excludedOptions = [
        'Mofada',
        'Consumida',
        'Deteriorada',
        'Atrativo biológico substituído',
        'Desarmada',
        'Desligada'
      ];
      return !excludedOptions.includes(status);
    }
    return true;
  });

  return (
    <div>
      <label className="block text-lg font-semibold text-gray-700 mb-2">
        Status do Dispositivo
      </label>
      <div className="flex gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => {
            if (e.target.value === 'novo_status') {
              setShowNewStatusInput(true);
            } else {
              onStatusChange(e.target.value);
            }
          }}
          disabled={disabled || !selectedDevice}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base disabled:bg-gray-100"
        >
          <option value=""></option>
          {finalStatusTypes.map((status, index) => (
            <option key={status} value={status}>
              {`${index + 1}. ${status}`}
            </option>
          ))}
          <option value="novo_status">+ Adicionar novo status</option>
        </select>
        {selectedStatus === 'Conforme' && (
          <button
            onClick={onSelectAll}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            Selecionar Todos
          </button>
        )}
      </div>

      {showNewStatusInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Digite o novo status"
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (newStatus.trim()) {
                onStatusChange(newStatus.trim());
                setNewStatus('');
                setShowNewStatusInput(false);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Adicionar
          </button>
          <button
            onClick={() => {
              setNewStatus('');
              setShowNewStatusInput(false);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};