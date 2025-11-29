import React from 'react';
import { cleanupSystemData } from '../services/ordemServicoService';
// import { toast } from 'react-toastify';

export const SystemCleanup: React.FC = () => {
  const handleCleanup = () => {
    try {
      cleanupSystemData();
      // toast.success('Sistema limpo com sucesso!');
      console.log('Sistema limpo com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar sistema:', error);
      // toast.error('Erro ao limpar sistema');
      console.error('Erro ao limpar sistema');
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleCleanup}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Limpar Sistema
      </button>
    </div>
  );
};
