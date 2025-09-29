import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Função para solicitar input do usuário
function askQuestion(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getSupabaseKey() {
  if (!supabaseAnonKey) {
    console.log('🔑 Chave do Supabase não encontrada nas variáveis de ambiente');
    console.log('📝 Por favor, forneça sua chave anônima do Supabase:');
    console.log('   (Você pode encontrá-la em: Supabase Dashboard > Settings > API)');
    
    supabaseAnonKey = await askQuestion('Chave anônima do Supabase: ');
    
    if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
      console.error('❌ Chave do Supabase é obrigatória');
      process.exit(1);
    }
  }
  
  return supabaseAnonKey;
}

async function revertSupabaseChanges() {
  try {
    console.log('🔄 Iniciando reversão das modificações do Supabase...');
    
    // Obter a chave do Supabase
    const key = await getSupabaseKey();
    const supabase = createClient(supabaseUrl, key);
    
    // Testar conexão
    console.log('🔍 Testando conexão com o Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('config')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao conectar com o Supabase:', testError.message);
      console.log('💡 Verifique se a chave está correta e se o projeto está ativo');
      process.exit(1);
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    
    // Ler o script SQL de reversão
    const sqlFilePath = join(__dirname, '..', 'supabase', 'revert_changes_20_06.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Executando script de reversão...');
    
    // Dividir o script em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('DO'));
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`Executando: ${command.substring(0, 50)}...`);
        try {
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
          if (cmdError) {
            console.log(`⚠️  Comando ignorado (pode ser normal): ${cmdError.message}`);
          } else {
            console.log(`✅ Comando executado com sucesso`);
          }
        } catch (error) {
          console.log(`⚠️  Erro no comando (pode ser normal): ${error.message}`);
        }
      }
    }
    
    // Verificar o estado atual da tabela
    console.log('🔍 Verificando estado atual da tabela company...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'company')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }
    
    const columnNames = columns.map(col => col.column_name);
    console.log('📋 Colunas atuais da tabela company:');
    columnNames.forEach(col => console.log(`  - ${col}`));
    
    // Verificar se a reversão foi bem-sucedida
    const hasUseLogoOnLogin = columnNames.includes('use_logo_on_login');
    const hasSeparateLicenseColumns = columnNames.some(col => 
      ['environmental_license_number', 'environmental_license_validity', 'sanitary_permit_number', 'sanitary_permit_validity'].includes(col)
    );
    
    console.log('\n📊 Resultado da reversão:');
    if (hasUseLogoOnLogin && !hasSeparateLicenseColumns) {
      console.log('✅ Reversão concluída com sucesso!');
      console.log('✅ Coluna use_logo_on_login foi readicionada');
      console.log('✅ Colunas separadas de licenças foram removidas');
    } else {
      console.log('⚠️  Reversão parcial ou incompleta');
      if (!hasUseLogoOnLogin) {
        console.log('❌ Coluna use_logo_on_login não foi readicionada');
      }
      if (hasSeparateLicenseColumns) {
        console.log('❌ Colunas separadas de licenças ainda existem');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a reversão:', error);
  }
}

// Executar a reversão
revertSupabaseChanges(); 