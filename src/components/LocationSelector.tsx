import React, { useState } from 'react';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [locations, setLocations] = useState<string[]>(['Area interna', 'Area externa']);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLocation, setCustomLocation] = useState('');

  const handleAddCustomLocation = () => {
    if (customLocation.trim()) {
      setLocations([...locations, customLocation.trim()]);
      onChange(customLocation.trim());
      setCustomLocation('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={value}
        onChange={(e) => {
          const selectedValue = e.target.value;
          if (selectedValue === 'custom') {
            setShowCustomInput(true);
          } else {
            onChange(selectedValue);
          }
        }}
        className="w-full p-2 border rounded-md"
      >
        <option value="">Selecione o local</option>
        {locations.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
        <option value="custom">Adicionar novo local...</option>
      </select>

      {showCustomInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Digite o novo local"
            className="flex-1 p-2 border rounded-md"
          />
          <button
            onClick={handleAddCustomLocation}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Adicionar
          </button>
          <button
            onClick={() => {
              setShowCustomInput(false);
              setCustomLocation('');
            }}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
