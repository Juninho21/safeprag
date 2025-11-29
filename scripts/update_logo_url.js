import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateLogoUrl() {
  console.log('🔄 Atualizando URL do logo da empresa...');
  
  const newLogoUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png';
  
  try {
    // Atualizar a URL do logo
    const { data, error } = await supabase
      .from('company')
      .update({ 
        logo_url: newLogoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Sulpest');
    
    if (error) {
      console.error('❌ Erro ao atualizar logo:', error);
      return;
    }
    
    console.log('✅ Logo atualizado com sucesso!');
    console.log('🖼️ Nova URL:', newLogoUrl);
    
    // Verificar se a atualização foi bem-sucedida
    const { data: companyData, error: fetchError } = await supabase
      .from('company')
      .select('*')
      .eq('name', 'Sulpest')
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ Erro ao verificar dados:', fetchError);
      return;
    }
    
    if (companyData) {
      console.log('✅ Dados verificados:');
      console.log('   Nome:', companyData.name);
      console.log('   Logo URL:', companyData.logo_url);
      console.log('   URL está correta?', companyData.logo_url === newLogoUrl);
    }
    
  } catch (error) {
    console.error('💥 Erro durante atualização:', error);
  }
}

// Executar a função
updateLogoUrl(); 