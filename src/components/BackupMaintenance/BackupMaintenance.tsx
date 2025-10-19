import React, { useState, useRef } from 'react';
import { Database, RotateCw, Trash2, Upload, X } from 'lucide-react';
// import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Modal } from '../Modal';
import { STORAGE_KEYS, restoreBackup as restoreByKeyMap } from '../../services/storageKeys';
import { restoreBackup as restoreStructuredBackup, BackupData, createBackup } from '../../services/backupService';
import { saveBackupForAutoRestore } from '../../services/autoRestore';
import { saveBackupJson } from '../../services/crossPlatformSave';
import { cleanupSystemData } from '../../services/ordemServicoService';
import { saveBackupToSupabase } from '../../services/backupService'; // Import the saveBackupToSupabase function
import { fileSharingService } from '../../services/fileSharingService';
import { Capacitor } from '@capacitor/core';

const BackupMaintenance = () => {
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupData, setBackupData] = useState('');
  const [backupFileName, setBackupFileName] = useState(''); // Store the backup file name
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [flashRestore, setFlashRestore] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Criar backup estruturado compatível com Android/iOS e web
      const backup = createBackup();
      const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
      const content = JSON.stringify(backup, null, 2);

      // Salvar de forma cross‑plataforma (Android/iOS: Filesystem; Web/Dev: public/ via endpoint)
      const saveResult = await saveBackupJson(fileName, content);
      if (!saveResult.success) {
        // Fallback para download via navegador (útil no web se endpoint não estiver disponível)
        try {
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.warn('Falha no salvamento cross‑plataforma, realizado download via navegador.');
        } catch (fallbackErr) {
          console.error('Falha no fallback de download:', fallbackErr);
        }
      }

      // Persistir metadados para auto‑restore
      saveBackupForAutoRestore(backup, fileName);

      // Opcional: salvar também no Supabase (se configurado)
      try {
        const cloud = await saveBackupToSupabase(backup, fileName);
        if (!cloud.success) {
          console.warn('Não foi possível salvar no Supabase:', cloud.error);
        }
      } catch (supErr) {
        console.warn('Erro ao salvar no Supabase:', supErr);
      }

      // Após salvar, abrir a folha de compartilhamento no Android
      try {
        // Converter conteúdo para Base64 (para uso no serviço de compartilhamento)
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        if (fileSharingService.isSharingSupported() && Capacitor.getPlatform() === 'android') {
          const shared = await fileSharingService.shareFile({
            filename: fileName,
            data: base64Content,
            mimeType: 'application/json'
          });

          if (!shared) {
            console.warn('Falha ao abrir compartilhamento para o backup.');
          }
        } else {
          // Em plataformas web, manter o comportamento de download (já realizado acima no fallback)
          console.log('Compartilhamento não suportado nesta plataforma.');
        }
      } catch (shareErr) {
        console.error('Erro ao compartilhar backup:', shareErr);
      }

      console.log('Backup realizado e salvo com sucesso.');
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = () => {
    setShowRestoreModal(true);
  };

  const handleRestoreConfirm = async () => {
    try {
      const parsed = JSON.parse(backupData);

      // Suporte a dois formatos de backup:
      // - JSON simples (mapa de chaves) -> restoreByKeyMap
      // - BackupData estruturado ({ timestamp, version, data }) -> restoreStructuredBackup
      if (parsed && parsed.timestamp && parsed.version && parsed.data) {
        const result = restoreStructuredBackup(parsed as BackupData);
        if (!result.success) {
          console.warn('Restauração estruturada reportou erros:', result.errors?.join(', '));
        }
      } else {
        restoreByKeyMap(parsed as Record<string, any>);
      }
      // Persist the uploaded backup JSON locally for future auto-restore
      const backupForPersistence: BackupData = (
        parsed && parsed.timestamp && parsed.version && parsed.data
      ) ? parsed as BackupData : {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: parsed as Record<string, any>
      };
      saveBackupForAutoRestore(backupForPersistence, backupFileName);
      // Salvar backup localmente (web: public/, Android: Filesystem)
      if (backupFileName && backupData) {
        const resultLocal = await saveBackupJson(backupFileName, backupData);
        if (!resultLocal.success) {
          console.warn('Falha ao salvar JSON localmente:', resultLocal.error);
        }
      }
      
      // Save the backup file to Supabase storage
      try {
        // Preparar objeto BackupData para salvar no Supabase
        const backupForSupabase: BackupData = (
          parsed && parsed.timestamp && parsed.version && parsed.data
        ) ? parsed as BackupData : {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          data: parsed as Record<string, any>
        };
        
        const result = await saveBackupToSupabase(backupForSupabase, backupFileName);
        if (result.success) {
          console.log('Backup também salvo no Supabase com sucesso!');
        } else {
          console.error('Erro ao salvar backup no Supabase:', result.error);
        }
      } catch (supabaseError) {
        console.error('Erro ao salvar backup no Supabase:', supabaseError);
      }
      
      setShowRestoreModal(false);
      setBackupData('');
      setBackupFileName('');
      // toast.success('Backup restaurado com sucesso!');
      console.log('Backup restaurado com sucesso!');
      window.location.reload(); // Recarrega a página para atualizar os dados
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      // toast.error('Erro ao restaurar backup. Verifique se o arquivo é válido.');
      console.error('Erro ao restaurar backup. Verifique se o arquivo é válido.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Store the file name
    setBackupFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Verificar se o conteúdo é um JSON válido
        const parsed = JSON.parse(content);
        setBackupData(content);
        setFlashRestore(true);
        setTimeout(() => setFlashRestore(false), 15000);
        // Persist immediately the uploaded backup for future auto-restore
        const backupForPersistence: BackupData = (
          parsed && parsed.timestamp && parsed.version && parsed.data
        ) ? parsed as BackupData : {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          data: parsed as Record<string, any>
        };
        saveBackupForAutoRestore(backupForPersistence, file.name);
        // Salvar backup localmente (web: public/, Android: Filesystem)
        saveBackupJson(file.name, content).then((res) => {
          if (!res.success) {
            console.warn('Falha ao salvar JSON localmente:', res.error);
          }
        });
      } catch (error) {
        console.error('Erro ao ler arquivo de backup:', error);
        // toast.error('Arquivo de backup inválido. Selecione um arquivo JSON válido.');
        console.error('Arquivo de backup inválido. Selecione um arquivo JSON válido.');
      }
    };
    reader.onerror = () => {
      // toast.error('Erro ao ler o arquivo');
        console.error('Erro ao ler o arquivo');
    };
    reader.readAsText(file);
  };

  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isCleaningSystem, setIsCleaningSystem] = useState(false);

  const handleCleanup = () => {
    setShowCleanupModal(true);
  };

  const handleCleanupConfirm = async () => {
    try {
      setIsCleaningSystem(true);
      // Pequeno delay para mostrar o indicador de carregamento
      await new Promise(resolve => setTimeout(resolve, 800));
      cleanupSystemData();
      // toast.success('Sistema limpo com sucesso!');
      console.log('Sistema limpo com sucesso!');
      setShowCleanupModal(false);
      setIsCleaningSystem(false);
      // Recarregar a página após limpar o sistema
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao limpar sistema:', error);
      // toast.error('Erro ao limpar sistema');
      console.error('Erro ao limpar sistema');
      setIsCleaningSystem(false);
    }
  };

  const handleCleanupCancel = () => {
    setShowCleanupModal(false);
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4 max-w-lg mx-auto">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 sm:h-14 text-base sm:text-lg rounded-lg flex items-center justify-center gap-2"
          onClick={handleBackup}
          disabled={isBackingUp}
        >
          {isBackingUp ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </>
          ) : (
            <>
              <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
              Fazer Backup
            </>
          )}
        </Button>

        <Button
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-12 sm:h-14 text-base sm:text-lg rounded-lg flex items-center justify-center gap-2"
          onClick={handleRestore}
        >
          <Database className="h-4 w-4 sm:h-5 sm:w-5" />
          Restaurar Backup
        </Button>

        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12 sm:h-14 text-base sm:text-lg rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          onClick={handleCleanup}
        >
          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          Limpar Sistema
        </Button>

        <p className="text-sm sm:text-base text-gray-500 mt-2 text-center px-4">
          Atenção: Esta ação irá limpar todos os dados do sistema. Faça um backup antes de prosseguir.
        </p>
      </div>

      <Modal
        isOpen={showRestoreModal}
        onRequestClose={() => {
          setShowRestoreModal(false);
          setBackupData('');
          setBackupFileName('');
        }}
      >
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Restaurar Backup</h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="backup-file-input"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="mb-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivo .json
              </Button>
              <p className="text-sm text-gray-500">
                {backupData ? 'Arquivo carregado com sucesso!' : 'Selecione um arquivo de backup no formato .json'}
              </p>
            </div>
            
            {backupData && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700 truncate">
                  Arquivo de backup pronto para restauração
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRestoreModal(false);
                  setBackupData('');
                  setBackupFileName('');
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleRestoreConfirm}
                className={`w-full sm:w-auto ${flashRestore ? 'animate-blink-green' : ''}`}
                disabled={!backupData}
              >
                Restaurar
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Limpeza do Sistema */}
      <Modal isOpen={showCleanupModal} onRequestClose={handleCleanupCancel}>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Limpar Sistema</h2>
            <button 
              onClick={handleCleanupCancel} 
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              disabled={isCleaningSystem}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Atenção!</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Esta ação irá remover <strong>todos os dados</strong> do sistema, incluindo:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Agendamentos</li>
                    <li>Ordens de serviço</li>
                    <li>Dados de clientes</li>
                    <li>Configurações do sistema</li>
                  </ul>
                  <p className="mt-2 font-semibold">Esta ação não pode ser desfeita!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800" 
              onClick={handleCleanupCancel}
              disabled={isCleaningSystem}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              onClick={handleCleanupConfirm}
              disabled={isCleaningSystem}
            >
              {isCleaningSystem ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Confirmar Limpeza
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BackupMaintenance;