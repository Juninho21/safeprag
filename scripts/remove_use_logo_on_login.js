const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeUseLogoOnLoginColumn() {
  try {
    console.log('🔄 Iniciando remoção da coluna use_logo_on_login...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'supabase', 'remove_use_logo_on_login.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executando migração SQL...');
    
    // Executar a migração
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      return false;
    }
    
    console.log('✅ Coluna use_logo_on_login removida com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    return false;
  }
}

// Executar a migração
removeUseLogoOnLoginColumn()
  .then((success) => {
    if (success) {
      console.log('🎉 Migração concluída com sucesso!');
    } else {
      console.log('💥 Falha na migração');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Erro inesperado:', error);
    process.exit(1);
  }); 