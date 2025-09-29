import React, { useState, useRef } from 'react';
import {
  createBackup,
  restoreBackup,
  exportBackupToFile,
  importBackupFromFile,
  getBackupInfo,
  clearAllData,
  hasDataToBackup,
  getDataStats,
  BackupData,
  BackupInfo
} from '../services/backupService';

interface BackupManagerProps {
  onClose?: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [dataStats, setDataStats] = useState(getDataStats());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const backup = createBackup();
      const info = getBackupInfo(backup);
      setBackupInfo(info);
      showMessage('success', `Backup criado com sucesso! ${info.itemCount} itens incluídos.`);
    } catch (error) {
      showMessage('error', `Erro ao criar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBackup = async () => {
    setIsLoading(true);
    try {
      const backup = createBackup();
      exportBackupToFile(backup);
      showMessage('success', 'Arquivo de backup baixado com sucesso!');
    } catch (error) {
      showMessage('error', `Erro ao exportar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const backup = await importBackupFromFile(file);
      const result = restoreBackup(backup);
      
      if (result.success) {
        setDataStats(getDataStats());
        showMessage('success', `Backup restaurado com sucesso! ${result.restored} itens restaurados.`);
        if (result.errors.length > 0) {
          console.warn('Erros durante a restauração:', result.errors);
        }
      } else {
        showMessage('error', `Falha na restauração: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      showMessage('error', `Erro ao importar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta ação irá remover TODOS os dados locais. Tem certeza que deseja continuar?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = clearAllData();
      setDataStats(getDataStats());
      setBackupInfo(null);
      showMessage('info', `Dados limpos: ${result.cleared} itens removidos.`);
      if (result.errors.length > 0) {
        console.warn('Erros durante a limpeza:', result.errors);
      }
    } catch (error) {
      showMessage('error', `Erro ao limpar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasData = hasDataToBackup();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📦 Gerenciador de Backup</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                disabled={isLoading}
              >
                ×
              </button>
            )}
          </div>

          {/* Mensagem de status */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Estatísticas dos dados */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">📊 Estatísticas dos Dados Locais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total de itens:</p>
                <p className="text-xl font-bold text-blue-600">{dataStats.totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tamanho total:</p>
                <p className="text-xl font-bold text-blue-600">{formatFileSize(dataStats.totalSize)}</p>
              </div>
            </div>
            
            {Object.keys(dataStats.itemsByType).length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Distribuição por tipo:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(dataStats.itemsByType).map(([type, count]) => (
                    <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informações do último backup */}
          {backupInfo && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-2 text-green-800">✅ Último Backup Criado</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Data/Hora:</p>
                  <p className="font-medium">{new Date(backupInfo.timestamp).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Versão:</p>
                  <p className="font-medium">{backupInfo.version}</p>
                </div>
                <div>
                  <p className="text-gray-600">Itens:</p>
                  <p className="font-medium">{backupInfo.itemCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tamanho:</p>
                  <p className="font-medium">{formatFileSize(backupInfo.size)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ações de backup */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCreateBackup}
                disabled={isLoading || !hasData}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    📦 Criar Backup
                  </span>
                )}
              </button>

              <button
                onClick={handleExportBackup}
                disabled={isLoading || !hasData}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    💾 Baixar Backup
                  </span>
                )}
              </button>
            </div>

            <div className="border-t pt-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 block">
                  📁 Importar Backup de Arquivo:
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isLoading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
              </label>
            </div>

            <div className="border-t pt-4">
              <button
                onClick={handleClearData}
                disabled={isLoading || !hasData}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    🗑️ Limpar Todos os Dados
                  </span>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                ⚠️ Esta ação é irreversível. Faça um backup antes de limpar os dados.
              </p>
            </div>
          </div>

          {!hasData && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-center">
                📭 Nenhum dado encontrado para backup.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupManager;