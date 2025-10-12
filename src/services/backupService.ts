// Serviço de Backup/Restore Local para modo offline
import { STORAGE_KEYS, ADDITIONAL_KEYS } from './storageKeys';
import { supabase } from '../config/supabase';

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
 * Salva backup no Supabase Storage
 */
export const saveBackupToSupabase = async (backup: BackupData, fileName?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    console.log('☁️ Salvando backup no Supabase Storage...');

    // Gerar nome do arquivo único para evitar conflitos
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = fileName ? fileName.replace(/\.json$/i, '') : 'backup';
    const backupFileName = `${baseName}-${timestamp}.json`;

    console.log(`📁 Nome do arquivo: ${backupFileName}`);

    // Converter backup para Blob
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    console.log(`📊 Tamanho do arquivo: ${dataBlob.size} bytes`);

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('backups')
      .upload(backupFileName, dataBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/json'
      });

    if (error) {
      console.error('❌ Erro ao fazer upload para Supabase:', error);
      console.error('Mensagem do erro:', error.message);
      return { success: false, error: `Upload falhou: ${error.message}` };
    }

    console.log('✅ Upload realizado com sucesso:', data);

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('backups')
      .getPublicUrl(backupFileName);

    console.log('✅ Backup salvo no Supabase com sucesso:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    const errorMsg = `Erro ao salvar backup no Supabase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error('❌', errorMsg);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return { success: false, error: errorMsg };
  }
};

/**
 * Importa backup de um arquivo e salva automaticamente no Supabase
 */
export const importBackupFromFile = (file: File, saveToSupabase: boolean = true): Promise<BackupData> => {
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
        
        // Salvar no Supabase se solicitado
        if (saveToSupabase) {
          const result = await saveBackupToSupabase(backup, file.name);
          if (result.success) {
            console.log('✅ Backup também salvo no Supabase');
          } else {
            console.error('❌ Falha ao salvar backup no Supabase:', result.error);
            // Não falhar a importação por causa do Supabase, apenas logar o erro
            console.warn('⚠️ Backup importado localmente, mas não foi possível salvar no Supabase:', result.error);
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
 * Testa a conexão com o Supabase Storage e verifica se o bucket existe
 */
export const testSupabaseStorageConnection = async (): Promise<{ success: boolean; buckets?: any[]; error?: string }> => {
  try {
    console.log('🔍 Testando conexão com Supabase Storage...');

    // Tentar listar buckets disponíveis
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return { success: false, error: `Erro ao listar buckets: ${bucketsError.message}` };
    }

    console.log('✅ Buckets disponíveis:', buckets?.map(b => b.name));

    // Verificar se o bucket 'backups' existe
    const backupsBucket = buckets?.find(b => b.name === 'backups');
    if (!backupsBucket) {
      console.error('❌ Bucket "backups" não encontrado!');
      return { success: false, error: 'Bucket "backups" não existe. Execute o script setup_backup_bucket.sql no Supabase.' };
    }

    console.log('✅ Bucket "backups" encontrado:', backupsBucket);
    return { success: true, buckets };
  } catch (error) {
    const errorMsg = `Erro ao testar conexão com Storage: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error('❌', errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Lista backups disponíveis no Supabase Storage
 */
export const listSupabaseBackups = async (): Promise<{ success: boolean; files?: any[]; error?: string }> => {
  try {
    console.log('📋 Listando backups do Supabase...');

    // Primeiro testar se o bucket existe
    const testResult = await testSupabaseStorageConnection();
    if (!testResult.success) {
      return { success: false, error: testResult.error };
    }

    const { data, error } = await supabase.storage
      .from('backups')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Erro ao listar backups do Supabase:', error);
      console.error('Mensagem do erro:', error.message);
      return { success: false, error: `Erro ao listar: ${error.message}` };
    }

    console.log(`✅ ${data?.length || 0} backup(s) encontrado(s) no Supabase`);
    return { success: true, files: data };
  } catch (error) {
    const errorMsg = `Erro ao listar backups: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Baixa um backup específico do Supabase Storage
 */
export const downloadBackupFromSupabase = async (fileName: string): Promise<{ success: boolean; backup?: BackupData; error?: string }> => {
  try {
    console.log(`⬇️ Baixando backup ${fileName} do Supabase...`);
    
    const { data, error } = await supabase.storage
      .from('backups')
      .download(fileName);
    
    if (error) {
      console.error('Erro ao baixar backup do Supabase:', error);
      return { success: false, error: error.message };
    }
    
    // Converter Blob para texto e fazer parse
    const text = await data.text();
    const backup: BackupData = JSON.parse(text);
    
    // Validar estrutura
    if (!backup.timestamp || !backup.version || !backup.data) {
      throw new Error('Arquivo de backup inválido: estrutura incorreta');
    }
    
    console.log('✅ Backup baixado do Supabase com sucesso');
    return { success: true, backup };
  } catch (error) {
    const errorMsg = `Erro ao baixar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Remove um backup do Supabase Storage
 */
export const deleteBackupFromSupabase = async (fileName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗑️ Removendo backup ${fileName} do Supabase...`);
    
    const { error } = await supabase.storage
      .from('backups')
      .remove([fileName]);
    
    if (error) {
      console.error('Erro ao remover backup do Supabase:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Backup removido do Supabase com sucesso');
    return { success: true };
  } catch (error) {
    const errorMsg = `Erro ao remover backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
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