import React, { useState, useRef, useEffect } from 'react';
import {
  createBackup,
  restoreBackup,
  exportBackupToFile,
  importBackupFromFile,
  getBackupInfo,
  clearAllData,
  hasDataToBackup,
  getDataStats,
  saveBackupToSupabase,
  listSupabaseBackups,
  downloadBackupFromSupabase,
  deleteBackupFromSupabase,
  testSupabaseStorageConnection,
  BackupData,
  BackupInfo
} from '../services/backupService';

interface BackupManagerProps {
  onClose?: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [dataStats, setDataStats] = useState(getDataStats());
  const [supabaseBackups, setSupabaseBackups] = useState<any[]>([]);
  const [showSupabaseBackups, setShowSupabaseBackups] = useState(false);
  const [localBackupFile, setLocalBackupFile] = useState<File | null>(null); // New state for storing the local backup file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null); // New ref for the local file input

  useEffect(() => {
    if (showSupabaseBackups) {
      loadSupabaseBackups();
    }
  }, [showSupabaseBackups]);

  const showMessage = (type: 'success' | 'error' | 'info' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadSupabaseBackups = async () => {
    setIsLoading(true);
    try {
      const result = await listSupabaseBackups();
      if (result.success && result.files) {
        setSupabaseBackups(result.files);
        showMessage('success', `${result.files.length} backup(s) encontrado(s) no Supabase.`);
      } else {
        showMessage('error', `Erro ao listar backups: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Erro ao conectar com Supabase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
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
      
      // Também salvar no Supabase
      const supabaseResult = await saveBackupToSupabase(backup);
      if (supabaseResult.success) {
        showMessage('success', 'Backup baixado e salvo no Supabase com sucesso! ☁️');
      } else {
        showMessage('warning', `Backup baixado localmente, mas houve erro ao salvar no Supabase: ${supabaseResult.error}`);
      }
    } catch (error) {
      showMessage('error', `Erro ao exportar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // New function to handle local backup file selection
  const handleLocalBackupFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLocalBackupFile(file);
      showMessage('info', `Arquivo selecionado: ${file.name}`);
    }
  };

  // New function to save the local backup file to Supabase
  const handleSaveLocalBackupToSupabase = async () => {
    if (!localBackupFile) {
      showMessage('error', 'Nenhum arquivo selecionado.');
      return;
    }

    setIsLoading(true);
    try {
      // Import the backup file first to validate it
      const backup = await importBackupFromFile(localBackupFile, false); // Don't save to Supabase yet
      
      // Now save it to Supabase
      const result = await saveBackupToSupabase(backup, localBackupFile.name);
      if (result.success) {
        showMessage('success', `Backup "${localBackupFile.name}" salvo no Supabase com sucesso! ☁️`);
        // Clear the selected file after successful upload
        setLocalBackupFile(null);
        if (localFileInputRef.current) {
          localFileInputRef.current.value = '';
        }
        // Refresh the Supabase backups list
        loadSupabaseBackups();
      } else {
        showMessage('error', `Erro ao salvar backup no Supabase: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Erro ao processar o backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Importar backup e salvar automaticamente no Supabase
      const backup = await importBackupFromFile(file, true); // Save to Supabase during import
      const result = restoreBackup(backup);

      if (result.success) {
        setDataStats(getDataStats());
        showMessage('success', `Backup restaurado localmente e salvo no Supabase! ${result.restored} itens restaurados. ☁️`);

        if (result.errors.length > 0) {
          console.warn('Erros durante a restauração:', result.errors);
          showMessage('warning', `Backup restaurado com ${result.errors.length} avisos. Verifique o console para detalhes.`);
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

  console.log('🔧 BackupManager renderizando...');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Debug message - remover depois */}
          <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
            🔧 Debug: Componente BackupManager carregado
          </div>
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
              message.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
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

            {/* New section for saving local backup files to Supabase */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">☁️ Salvar Backup Local no Supabase</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Selecione um arquivo de backup .json local:
                  </span>
                  <input
                    ref={localFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleLocalBackupFileSelect}
                    disabled={isLoading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                </label>
                
                {localBackupFile && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Arquivo selecionado:</span> {localBackupFile.name} 
                      ({formatFileSize(localBackupFile.size)})
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleSaveLocalBackupToSupabase}
                  disabled={isLoading || !localBackupFile}
                  className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      ☁️ Salvar no Supabase
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3 mb-3">
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const result = await testSupabaseStorageConnection();
                      if (result.success) {
                        showMessage('success', `✅ Conexão com Supabase OK! Buckets: ${result.buckets?.map(b => b.name).join(', ')}`);
                      } else {
                        showMessage('error', `❌ Erro na conexão: ${result.error}`);
                      }
                    } catch (error) {
                      showMessage('error', `❌ Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      🔍 Testar Conexão
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowSupabaseBackups(!showSupabaseBackups)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="flex items-center">
                    ☁️ {showSupabaseBackups ? 'Ocultar' : 'Ver'} Backups na Nuvem
                  </span>
                </button>
              </div>

              {showSupabaseBackups && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold mb-3 text-purple-800">☁️ Backups no Supabase</h3>
                  {supabaseBackups.length === 0 ? (
                    <p className="text-gray-600 text-center py-2">Nenhum backup encontrado no Supabase.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {supabaseBackups.map((backup) => (
                        <div key={backup.name} className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{backup.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(backup.created_at).toLocaleString('pt-BR')} • {formatFileSize(backup.metadata?.size || 0)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setIsLoading(true);
                                try {
                                  const result = await downloadBackupFromSupabase(backup.name);
                                  if (result.success && result.backup) {
                                    const restoreResult = restoreBackup(result.backup);
                                    if (restoreResult.success) {
                                      setDataStats(getDataStats());
                                      showMessage('success', `Backup restaurado do Supabase! ${restoreResult.restored} itens.`);
                                    } else {
                                      showMessage('error', `Falha na restauração: ${restoreResult.errors.join(', ')}`);
                                    }
                                  } else {
                                    showMessage('error', `Erro ao baixar backup: ${result.error}`);
                                  }
                                } catch (error) {
                                  showMessage('error', `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              disabled={isLoading}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300"
                            >
                              ↓ Restaurar
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Deseja realmente excluir o backup "${backup.name}"?`)) {
                                  setIsLoading(true);
                                  try {
                                    const result = await deleteBackupFromSupabase(backup.name);
                                    if (result.success) {
                                      showMessage('success', 'Backup excluído do Supabase.');
                                      loadSupabaseBackups();
                                    } else {
                                      showMessage('error', `Erro ao excluir: ${result.error}`);
                                    }
                                  } catch (error) {
                                    showMessage('error', `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }
                              }}
                              disabled={isLoading}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:bg-gray-300"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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