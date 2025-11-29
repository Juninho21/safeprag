// MODO OFFLINE - Imports comentados para desabilitar autenticação online
// import { supabase } from '../config/supabase';
import { setupLocalStorageInterceptor, restoreLocalStorage } from './localStorageInterceptor';
// import { loadAllDataFromSupabase } from './dataSyncService';

// Função para inicializar o interceptor do localStorage
export const initializeStorageInterceptor = (): void => {
  setupLocalStorageInterceptor();
  console.log('Interceptor do localStorage inicializado com sucesso');
};

// Função para verificar se o usuário está autenticado (sempre retorna true após remoção da página de login)
export const isAuthenticated = async (): Promise<boolean> => {
  return true;
};

// MODO OFFLINE - Função simulada para carregar dados do usuário
export const loadUserData = async (): Promise<{
  success: boolean;
  loaded: string[];
}> => {
  try {
    console.log('📱 MODO OFFLINE: Simulando carregamento de dados do usuário');
    
    // Verificar se o usuário está autenticado (sempre true no modo offline)
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return { success: false, loaded: [] };
    }
    
    // Inicializar o interceptor do localStorage
    initializeStorageInterceptor();
    
    // Simular dados carregados com sucesso
    const loaded = ['localStorage', 'interceptor'];
    console.log('✅ Dados do usuário carregados em modo offline');
    
    return { success: true, loaded };
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    return { success: false, loaded: [] };
  }
};

// MODO OFFLINE - Função simulada para logout
export const handleLogout = async (): Promise<void> => {
  try {
    console.log('📱 MODO OFFLINE: Simulando logout do usuário');
    
    // Restaurar o método original do localStorage
    restoreLocalStorage();
    
    // Simular logout bem-sucedido (sem chamadas ao Supabase)
    console.log('✅ Logout realizado em modo offline');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};