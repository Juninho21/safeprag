import React, { useState, useEffect } from 'react';
import { AdminClient, getAdminClients } from '../services/adminService';

interface ClientSearchProps {
  onClientSelect: (client: AdminClient) => void;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({ onClientSelect }) => {
  const [clients, setClients] = useState<AdminClient[]>([]);

  useEffect(() => {
    // Carrega os clientes ao montar o componente
    const loadedClients = getAdminClients();
    setClients(loadedClients);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClient = clients.find(client => client.id === e.target.value);
    if (selectedClient) {
      onClientSelect(selectedClient);
    }
  };

  return (
    <select
      onChange={handleChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      <option value="">Selecione um cliente</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name} - {client.cnpj}
        </option>
      ))}
    </select>
  );
};
