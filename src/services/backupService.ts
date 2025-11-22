// Serviço de Backup/Restore Local para modo offline
import { STORAGE_KEYS, ADDITIONAL_KEYS } from './storageKeys';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface BackupData {
  timestamp: string;
  version: string;
  data: Record<string, any>;
}

export interface BackupInfo {
  timestamp: string;
  version: string;
  size: number;
  itemCount: number;
}

// Chaves que devem ser incluídas no backup
const BACKUP_KEYS = [
  ...Object.values(STORAGE_KEYS),
  ...Object.values(ADDITIONAL_KEYS),
  'safeprag_sync_status'
];

/**
 * Cria um backup completo dos dados do localStorage
 */
export const createBackup = (): BackupData => {
  console.log('📦 Criando backup dos dados locais...');

  const backupData: Record<string, any> = {};
  let itemCount = 0;

  // Coletar todos os dados relevantes do localStorage
  BACKUP_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        // Tentar fazer parse do JSON, se falhar, manter como string
        backupData[key] = JSON.parse(value);
      } catch {
        backupData[key] = value;
      }
      itemCount++;
    }
  });

  const backup: BackupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: backupData
  };

  console.log(`✅ Backup criado com ${itemCount} itens`);
  return backup;
};

/**
 * Restaura dados de um backup
 */
export const restoreBackup = (backup: BackupData): { success: boolean; restored: number; errors: string[] } => {
  console.log('📥 Restaurando backup dos dados locais...');

  let restored = 0;
  const errors: string[] = [];

  try {
    // Validar estrutura do backup
    if (!backup.data || typeof backup.data !== 'object') {
      throw new Error('Estrutura de backup inválida');
    }

    // Restaurar cada item
    Object.entries(backup.data).forEach(([key, value]) => {
      try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        restored++;
      } catch (error) {
        const errorMsg = `Erro ao restaurar ${key}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    });

    console.log(`✅ Backup restaurado: ${restored} itens`);
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} erros durante a restauração`);
    }

    return { success: true, restored, errors };
  } catch (error) {
    const errorMsg = `Erro crítico na restauração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    errors.push(errorMsg);
    console.error(errorMsg);
    return { success: false, restored, errors };
  }
};

/**
 * Exporta backup como arquivo JSON para download
 */
export const exportBackupToFile = (backup: BackupData): void => {
  try {
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sulpest-backup-${new Date().toISOString().split('T')[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log('✅ Arquivo de backup baixado com sucesso');
  } catch (error) {
    console.error('Erro ao exportar backup:', error);
    throw new Error('Falha ao exportar arquivo de backup');
  }
};

/**
 * Salva backup no Firebase Storage
 */
export const saveBackupToFirebase = async (backup: BackupData, fileName?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    console.log('☁️ Salvando backup no Firebase Storage...');

    // Gerar nome do arquivo único para evitar conflitos
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = fileName ? fileName.replace(/\.json$/i, '') : 'backup';
    const backupFileName = `${baseName}-${timestamp}.json`;

    console.log(`📁 Nome do arquivo: ${backupFileName}`);

    // Converter backup para Blob
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    console.log(`📊 Tamanho do arquivo: ${dataBlob.size} bytes`);

    // Criar referência no Firebase Storage
    const storageRef = ref(storage, `backups/${backupFileName}`);

    // Fazer upload para o Firebase Storage
    await uploadBytes(storageRef, dataBlob, {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    });

    console.log('✅ Upload realizado com sucesso');

    // Obter URL pública do arquivo
    const downloadURL = await getDownloadURL(storageRef);

    console.log('✅ Backup salvo no Firebase com sucesso:', downloadURL);
    return { success: true, url: downloadURL };
  } catch (error) {
    const errorMsg = `Erro ao salvar backup no Firebase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error('❌', errorMsg);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return { success: false, error: errorMsg };
  }
};

/**
 * Importa backup de um arquivo e salva automaticamente no Firebase
 */
export const importBackupFromFile = (file: File, saveToCloud: boolean = true): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup: BackupData = JSON.parse(content);

        // Validar estrutura básica
        if (!backup.timestamp || !backup.version || !backup.data) {
          throw new Error('Arquivo de backup inválido: estrutura incorreta');
        }

        console.log('✅ Arquivo de backup importado com sucesso');

        // Salvar no Firebase se solicitado
        if (saveToCloud) {
          const result = await saveBackupToFirebase(backup, file.name);
          if (result.success) {
            console.log('✅ Backup também salvo no Firebase');
          } else {
            console.error('❌ Falha ao salvar backup no Firebase:', result.error);
            // Não falhar a importação por causa do Firebase, apenas logar o erro
            console.warn('⚠️ Backup importado localmente, mas não foi possível salvar no Firebase:', result.error);
          }
        }

        resolve(backup);
      } catch (error) {
        const errorMsg = `Erro ao importar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }
    };

    reader.onerror = () => {
      const errorMsg = 'Erro ao ler arquivo de backup';
      console.error(errorMsg);
      reject(new Error(errorMsg));
    };

    reader.readAsText(file);
  });
};

/**
 * Obtém informações sobre um backup
 */
export const getBackupInfo = (backup: BackupData): BackupInfo => {
  const dataStr = JSON.stringify(backup);
  const size = new Blob([dataStr]).size;
  const itemCount = Object.keys(backup.data).length;

  return {
    timestamp: backup.timestamp,
    version: backup.version,
    size,
    itemCount
  };
};

/**
 * Limpa todos os dados do localStorage (usar com cuidado)
 */
export const clearAllData = (): { cleared: number; errors: string[] } => {
  console.log('🗑️ Limpando todos os dados locais...');

  let cleared = 0;
  const errors: string[] = [];

  BACKUP_KEYS.forEach(key => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared++;
      }
    } catch (error) {
      const errorMsg = `Erro ao limpar ${key}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  });

  console.log(`✅ ${cleared} itens removidos do localStorage`);
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} erros durante a limpeza`);
  }

  return { cleared, errors };
};

/**
 * Verifica se existem dados para backup
 */
export const hasDataToBackup = (): boolean => {
  return BACKUP_KEYS.some(key => localStorage.getItem(key) !== null);
};

/**
 * Obtém estatísticas dos dados locais
 */
export const getDataStats = (): { totalItems: number; totalSize: number; itemsByType: Record<string, number> } => {
  let totalItems = 0;
  let totalSize = 0;
  const itemsByType: Record<string, number> = {};

  BACKUP_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      totalItems++;
      totalSize += value.length;

      // Categorizar por tipo de dados
      if (key.includes('clients')) itemsByType.clients = (itemsByType.clients || 0) + 1;
      else if (key.includes('products')) itemsByType.products = (itemsByType.products || 0) + 1;
      else if (key.includes('company')) itemsByType.company = (itemsByType.company || 0) + 1;
      else if (key.includes('signature')) itemsByType.signatures = (itemsByType.signatures || 0) + 1;
      else if (key.includes('service')) itemsByType.serviceOrders = (itemsByType.serviceOrders || 0) + 1;
      else if (key.includes('device')) itemsByType.devices = (itemsByType.devices || 0) + 1;
      else itemsByType.other = (itemsByType.other || 0) + 1;
    }
  });

  return { totalItems, totalSize, itemsByType };
};