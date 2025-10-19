import React, { useState } from 'react';
import { Plus, Minus, Save } from 'lucide-react';
import { Pest } from '../../types/pest.types';

interface PestCounterProps {
  deviceType: string;
  deviceNumber: number;
  onSave: (deviceType: string, deviceNumber: number, pestCounts: Pest[]) => void;
}

export const PestCounter: React.FC<PestCounterProps> = ({
  deviceType,
  deviceNumber,
  onSave
}) => {
  // Lista padrão de pragas comuns
  const allDefaultPests = [
    { name: 'Moscas', count: 0 },
    { name: 'Mosquitos', count: 0 },
    { name: 'Mariposas', count: 0 },
    { name: 'Baratas', count: 0 },
    { name: 'Formigas', count: 0 },
    { name: 'Outros', count: 0 }
  ];

  // Pragas a serem excluídas
  const excludedPests = ['Baratas', 'Formigas', 'Outros'];

  // Lista padrão filtrada de pragas comuns
  const defaultPests = allDefaultPests.filter(pest => !excludedPests.includes(pest.name));

  // Usamos deviceType e deviceNumber como dependências do useEffect para resetar as contagens
  // quando um novo dispositivo é selecionado
  const [pests, setPests] = useState<Pest[]>(defaultPests);
  
  // Resetar contagens quando mudar o dispositivo selecionado
  React.useEffect(() => {
    // Reinicia as contagens com os valores padrão (zerados)
    setPests(defaultPests);
  }, [deviceType, deviceNumber]); // Dependências: quando mudar o dispositivo, reseta as contagens
  const [newPestName, setNewPestName] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);

  const handleCountChange = (index: number, increment: number) => {
    const newPests = [...pests];
    const newCount = Math.max(0, newPests[index].count + increment);
    newPests[index].count = newCount;
    setPests(newPests);
  };

  const handleAddNewPest = () => {
    if (newPestName.trim() === '') return;
    
    setPests([...pests, { name: newPestName, count: 0 }]);
    setNewPestName('');
    setShowAddNew(false);
  };

  const handleSave = () => {
    // Filtra apenas pragas com contagem > 0
    const pestsWithCount = pests.filter(pest => pest.count > 0);
    onSave(deviceType, deviceNumber, pestsWithCount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {deviceType} {deviceNumber}
        </h3>
      </div>

      <div className="space-y-3">
        {pests.map((pest, index) => (
          <div key={`${pest.name}-${index}`} className="flex items-center justify-between">
            <span className="text-gray-700">{pest.name}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCountChange(index, -1)}
                className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                disabled={pest.count === 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={pest.count === 0 ? '' : pest.count}
                onChange={(e) => {
                  const newPests = [...pests];
                  const newValue = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                  newPests[index].count = Math.max(0, newValue);
                  setPests(newPests);
                }}
                className="w-12 text-center border border-gray-300 rounded-md mx-1 py-1"
              />
              <button
                onClick={() => handleCountChange(index, 1)}
                className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddNew ? (
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="text"
            value={newPestName}
            onChange={(e) => setNewPestName(e.target.value)}
            placeholder="Nome da praga"
            className="flex-1 border border-gray-300 rounded-md px-3 py-1"
          />
          <button
            onClick={handleAddNewPest}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
          >
            Adicionar
          </button>
          <button
            onClick={() => setShowAddNew(false)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded-md"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddNew(true)}
          className="mt-4 text-blue-500 hover:text-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar nova praga
        </button>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </button>
      </div>
    </div>
  );
};