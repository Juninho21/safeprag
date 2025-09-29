import React, { useState } from 'react';
import { STORAGE_KEYS, backupAllData, restoreFromBackup } from '../../services/storageKeys';

const BackupMaintenance: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Função para criar backup dos dados
  const handleCreateBackup = () => {
    try {
      // Obter todos os dados do localStorage
      const backupData = backupAllData();
      
      // Converter para JSON e criar blob
      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Criar URL para download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo com data atual
      const date = new Date().toISOString().split('T')[0];
      link.download = `sulpest_backup_${date}.json`;
      
      // Simular clique para iniciar download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setBackupStatus('Backup criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      setBackupStatus(`Erro ao criar backup: ${error.message}`);
    }
  };

  // Função para lidar com seleção de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setRestoreStatus(null);
    }
  };

  // Função para restaurar backup
  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      setRestoreStatus('Selecione um arquivo de backup para restaurar');
      return;
    }

    try {
      // Ler o arquivo
      const fileContent = await selectedFile.text();
      const backupData = JSON.parse(fileContent);
      
      // Restaurar dados
      restoreFromBackup(backupData);
      
      setRestoreStatus('Dados restaurados com sucesso! Recarregue a página para ver as alterações.');
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      setRestoreStatus(`Erro ao restaurar backup: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Backup e Manutenção</h1>
      
      {/* Seção de Backup */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Backup de Dados</h2>
        <p className="mb-4">Crie um backup de todos os seus dados para armazenamento seguro.</p>
        
        <button 
          onClick={handleCreateBackup}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Criar Backup
        </button>
        
        {backupStatus && (
          <p className={`mt-2 ${backupStatus.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
            {backupStatus}
          </p>
        )}
      </div>
      
      {/* Seção de Restauração */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Restaurar Backup</h2>
        <p className="mb-4">Restaure seus dados a partir de um arquivo de backup.</p>
        
        <div className="mb-4">
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
        </div>
        
        <button 
          onClick={handleRestoreBackup}
          disabled={!selectedFile}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Restaurar Dados
        </button>
        
        {restoreStatus && (
          <p className={`mt-2 ${restoreStatus.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
            {restoreStatus}
          </p>
        )}
      </div>
    </div>
  );
};

export default BackupMaintenance;