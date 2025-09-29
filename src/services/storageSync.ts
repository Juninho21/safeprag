import { STORAGE_KEYS, ADDITIONAL_KEYS } from './storageKeys';
// Removido: imports do Supabase

// Função para verificar se o usuário está autenticado
// Sempre retorna true, pois não usamos mais autenticação
const isAuthenticated = async (): Promise<boolean> => {
  return true; // Usuário sempre considerado autenticado
};

// Função para verificar se todas as chaves do localStorage estão sendo sincronizadas
export const verifyStorageSync = async (): Promise<{
  success: boolean;
  missingKeys: string[];
}> => {
  try {
    // Verificar se o usuário está autenticado
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return { success: false, missingKeys: [] };
    }
    
    // Lista de todas as chaves que devem ser sincronizadas
    const allKeys = [
      ...Object.values(STORAGE_KEYS),
      ...Object.values(ADDITIONAL_KEYS)
    ];
    
    // Lista de chaves que não estão sendo sincronizadas
    const missingKeys: string[] = [];
    
    // Verificar cada chave no localStorage
    for (const key of allKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        // A chave existe no localStorage, verificar se está sendo sincronizada
        // Esta verificação é apenas para garantir que a chave está sendo tratada
        // na função syncAllDataToSupabase
        if (
          // Verificar se a chave está sendo tratada em syncAllDataToSupabase
          (key === STORAGE_KEYS.CLIENTS) ||
          (key === STORAGE_KEYS.PRODUCTS) ||
          (key === STORAGE_KEYS.SCHEDULES) ||
          (key === STORAGE_KEYS.COMPANY) ||
          (key === STORAGE_KEYS.SERVICE_ORDERS) ||
          (key === ADDITIONAL_KEYS.USER_DATA) ||
          (key === ADDITIONAL_KEYS.CLIENT_SIGNATURE)
        ) {
          // A chave está sendo sincronizada
        } else {
          // A chave não está sendo sincronizada
          missingKeys.push(key);
        }
      }
    }
    
    return { success: missingKeys.length === 0, missingKeys };
  } catch (error) {
    console.error('Erro ao verificar sincronização de chaves:', error);
    return { success: false, missingKeys: [] };
  }
};

// Função para forçar a sincronização de todas as chaves do localStorage
export const forceSyncAllData = async (): Promise<boolean> => {
  try {
    // Verificar se o usuário está autenticado
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return false;
    }
    
    // Sincronizar todos os dados com o localStorage
    console.log('📱 Sincronizando dados no localStorage...');
    return true;
  } catch (error) {
    console.error('Erro ao forçar sincronização de dados:', error);
    return false;
  }
};

// Função para forçar o carregamento de todos os dados do Supabase
export const forceLoadAllData = async (): Promise<boolean> => {
  try {
    // Verificar se o usuário está autenticado
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return false;
    }
    
    // Carregar todos os dados do localStorage
    console.log('📱 Carregando dados do localStorage...');
    return true;
  } catch (error) {
    console.error('Erro ao forçar carregamento de dados:', error);
    return false;
  }
};