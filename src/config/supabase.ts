import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = 'https://uqfucquhjvyoswentpjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZnVjcXVoanZ5b3N3ZW50cGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjgyMzcsImV4cCI6MjA2MDI0NDIzN30.pknHE-kKiYkFQtm6y_U2KVV36hQRRX7JJ5_dENq8Ak4';

// Inicializa o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar a conexão com o Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('test_connection').select('*').limit(1);
    
    if (error) throw error;
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    throw error;
  }
};

// Função para reconectar em caso de perda de conexão
export const reconnectSupabase = async (): Promise<void> => {
  console.log('🔄 Attempting to reconnect to Supabase...');
  await testSupabaseConnection();
};