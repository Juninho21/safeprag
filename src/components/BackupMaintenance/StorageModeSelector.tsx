import React, { useState, useEffect } from 'react';
import { StorageMode, getStorageMode, setStorageMode } from '../../services/dataService';

const StorageModeSelector: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<StorageMode>(StorageMode.LOCAL);

  useEffect(() => {
    // Carregar o modo atual
    setCurrentMode(getStorageMode());
  }, []);

  const handleModeChange = (mode: StorageMode) => {
    setStorageMode(mode);
    setCurrentMode(mode);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Modo de Armazenamento</h2>
      
      <div className="mb-4">
        <p className="mb-2">Selecione onde seus dados serão armazenados:</p>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="local"
              name="storageMode"
              value={StorageMode.LOCAL}
              checked={currentMode === StorageMode.LOCAL}
              onChange={() => handleModeChange(StorageMode.LOCAL)}
              className="mr-2"
            />
            <label htmlFor="local" className="cursor-pointer">
              <span className="font-medium">Local</span> - Dados armazenados apenas no dispositivo
            </label>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <p className="font-semibold mb-1">Informações:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Local:</strong> Dados disponíveis apenas neste dispositivo.</li>
        </ul>
      </div>
    </div>
  );
};

export default StorageModeSelector;