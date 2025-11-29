// Chaves usadas para armazenamento no localStorage
export const STORAGE_KEYS = {
  COMPANY: 'safeprag_company_data',
  CLIENTS: 'safeprag_clients',
  PRODUCTS: 'safeprag_products',
  SCHEDULES: 'safeprag_schedules',
  SETTINGS: 'safeprag_settings',
  SERVICE_ORDERS: 'safeprag_service_orders',
  DEVICES: 'safeprag_devices',
  USER_DATA: 'safeprag_user_data',
  USERS: 'safeprag_users',
  DOWNLOADS: 'safeprag_downloads',
  PEST_COUNTS: 'safeprag_pest_counts'
} as const;

// Chaves adicionais que não estão no objeto STORAGE_KEYS mas precisam ser incluídas no backup
export const ADDITIONAL_KEYS = {
  USER_DATA: 'userData',
  CLIENT_SIGNATURE: 'client_signature_data'
} as const;

// Função para limpar todos os dados do localStorage
export const clearAllData = () => {
  // Limpar chaves principais
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Limpar chaves adicionais
  Object.values(ADDITIONAL_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Função para verificar se há dados salvos
export const hasStoredData = (key: keyof typeof STORAGE_KEYS): boolean => {
  return localStorage.getItem(STORAGE_KEYS[key]) !== null;
};

// Função para fazer backup de todos os dados
export const backupAllData = (): Record<string, any> => {
  const backup: Record<string, any> = {};
  
  // Backup das chaves principais
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    const data = localStorage.getItem(storageKey);
    if (data) {
      backup[key] = JSON.parse(data);
    }
  });
  
  // Backup das chaves adicionais (assinaturas e dados de usuário)
  Object.entries(ADDITIONAL_KEYS).forEach(([key, storageKey]) => {
    const data = localStorage.getItem(storageKey);
    if (data) {
      backup[key] = JSON.parse(data);
    }
  });
  
  return backup;
};

// Função para restaurar backup
export const restoreBackup = (backup: Record<string, any>) => {
  // Restaurar chaves principais
  Object.entries(backup).forEach(([key, data]) => {
    // Verificar se é uma chave principal
    const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
    
    // Verificar se é uma chave adicional
    if (key === 'USER_DATA' && ADDITIONAL_KEYS.USER_DATA) {
      localStorage.setItem(ADDITIONAL_KEYS.USER_DATA, JSON.stringify(data));
    }
    
    if (key === 'CLIENT_SIGNATURE' && ADDITIONAL_KEYS.CLIENT_SIGNATURE) {
      localStorage.setItem(ADDITIONAL_KEYS.CLIENT_SIGNATURE, JSON.stringify(data));
    }
  });
};
