import React, { useEffect, useState } from 'react';

// ... outros imports ...

interface Cliente {
  id: string;
  nome: string;
  // outros campos do cliente...
}

export default function Home() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');

  useEffect(() => {
    // Carregar clientes do localStorage quando a página carregar
    const clientesSalvos = localStorage.getItem('clientes');
    if (clientesSalvos) {
      setClientes(JSON.parse(clientesSalvos));
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* ... código existente ... */}
      
      <div className="mb-4">
        <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
          Selecione o Cliente
        </label>
        <select
          id="cliente"
          value={clienteSelecionado}
          onChange={(e) => setClienteSelecionado(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione um cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
      </div>

      {/* ... resto do seu código ... */}
    </div>
  );
} 