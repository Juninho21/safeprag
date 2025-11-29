import React from 'react';
import { Shield } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Safeprag</h1>
        </div>
        <p className="mt-2 text-gray-600">Sistema de Ordem de Serviço - Controle de Pragas</p>
      </div>
    </header>
  );
};