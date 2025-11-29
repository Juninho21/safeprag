import React from 'react';

interface QuantityInputProps {
  quantity: string;
  onQuantityChange: (quantity: string) => void;
  selectedDevice: string;
  disabled?: boolean;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  onQuantityChange,
  selectedDevice,
  disabled = false,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor="quantity"
        className="block text-lg font-semibold text-gray-700 mb-2"
      >
        Quantidade total de dispositivos
      </label>
      <input
        type="number"
        id="quantity"
        value={quantity}
        onChange={(e) => onQuantityChange(e.target.value)}
        min="1"
        disabled={disabled || !selectedDevice}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base disabled:bg-gray-100"
      />
    </div>
  );
};