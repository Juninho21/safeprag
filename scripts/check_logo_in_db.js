import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZHl2aHpqcmplbXlxemVxbGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogoInDatabase() {
  console.log('🔍 Verificando logo no banco de dados...');
  
  try {
    // Buscar dados da empresa Sulpest
    const { data, error } = await supabase
      .from('company')
      .select('*')
      .eq('name', 'Sulpest')
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }
    
    if (data) {
      console.log('✅ Dados da empresa encontrados:');
      console.log('   Nome:', data.name);
      console.log('   Logo URL:', data.logo_url);
      console.log('   Logo URL está vazia?', !data.logo_url);
      console.log('   Logo URL é a correta?', data.logo_url === 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png');
      
      if (!data.logo_url || data.logo_url !== 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png') {
        console.log('🔄 Atualizando URL do logo...');
        
        const { error: updateError } = await supabase
          .from('company')
          .update({ 
            logo_url: 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png',
            updated_at: new Date().toISOString()
          })
          .eq('name', 'Sulpest');
        
        if (updateError) {
          console.error('❌ Erro ao atualizar logo:', updateError);
        } else {
          console.log('✅ Logo atualizado com sucesso!');
        }
      }
    } else {
      console.log('⚠️ Empresa Sulpest não encontrada no banco');
    }
    
  } catch (error) {
    console.error('💥 Erro durante verificação:', error);
  }
}

// Executar o script
checkLogoInDatabase(); 