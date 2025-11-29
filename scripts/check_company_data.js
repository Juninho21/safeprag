const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZHl2aHpyamJlbXlxemVxbGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanyData() {
  try {
    console.log('🔍 Verificando dados da tabela company...');
    
    // Buscar todos os registros da tabela company
    const { data, error } = await supabase
      .from('company')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar dados da empresa:', error);
      return;
    }

    console.log('📊 Total de registros encontrados:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('✅ Dados encontrados:');
      data.forEach((record, index) => {
        console.log(`\n📋 Registro ${index + 1}:`);
        console.log('  ID:', record.id);
        console.log('  Nome:', record.name);
        console.log('  CNPJ:', record.cnpj);
        console.log('  Telefone:', record.phone);
        console.log('  Email:', record.email);
        console.log('  Endereço:', record.address);
        console.log('  Documento:', record.document);
        console.log('  Logo URL:', record.logo_url);
        console.log('  Licença Ambiental - Número:', record.environmental_license_number);
        console.log('  Licença Ambiental - Validade:', record.environmental_license_validity);
        console.log('  Alvará Sanitário - Número:', record.sanitary_permit_number);
        console.log('  Alvará Sanitário - Validade:', record.sanitary_permit_validity);
        console.log('  Criado em:', record.created_at);
        console.log('  Atualizado em:', record.updated_at);
      });
    } else {
      console.log('⚠️ Nenhum registro encontrado na tabela company');
    }

    // Verificar se há dados no localStorage (simulado)
    console.log('\n💾 Verificando localStorage (simulado)...');
    console.log('Para verificar o localStorage real, abra o console do navegador e execute:');
    console.log('localStorage.getItem("company_data")');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a verificação
checkCompanyData(); 