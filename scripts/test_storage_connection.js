// Script para testar a conexão com o Supabase Storage
// Execute este script no console do navegador ou como um teste

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
const supabaseAnonKey = 'SUA_CHAVE_ANON_AQUI'; // Substitua pela sua chave anon

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageConnection() {
  console.log('🔍 Testando conexão com Supabase Storage...');
  
  try {
    // 1. Testar listagem de buckets
    console.log('📦 Listando buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Erro ao listar buckets:', bucketError);
      return;
    }
    
    console.log('✅ Buckets encontrados:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    // 2. Verificar se o bucket 'company' existe
    const companyBucket = buckets?.find(b => b.name === 'company');
    if (!companyBucket) {
      console.error('❌ Bucket "company" não encontrado!');
      console.log('💡 Você precisa criar o bucket "company" no Supabase Dashboard');
      return;
    }
    
    console.log('✅ Bucket "company" encontrado:', companyBucket);
    
    // 3. Testar listagem de arquivos no bucket
    console.log('📁 Listando arquivos no bucket "company"...');
    const { data: files, error: filesError } = await supabase.storage
      .from('company')
      .list('logos');
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
    } else {
      console.log('✅ Arquivos encontrados:', files);
    }
    
    // 4. Testar criação de um arquivo de teste
    console.log('🧪 Testando upload de arquivo de teste...');
    const testContent = 'Teste de conexão com storage';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company')
      .upload('test/test.txt', testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Erro no upload de teste:', uploadError);
      console.error('📋 Detalhes:', {
        message: uploadError.message,
        name: uploadError.name
      });
    } else {
      console.log('✅ Upload de teste realizado com sucesso:', uploadData);
      
      // 5. Testar obtenção da URL pública
      const { data: urlData } = supabase.storage
        .from('company')
        .getPublicUrl('test/test.txt');
      
      console.log('🔗 URL pública do arquivo de teste:', urlData.publicUrl);
      
      // 6. Limpar arquivo de teste
      const { error: deleteError } = await supabase.storage
        .from('company')
        .remove(['test/test.txt']);
      
      if (deleteError) {
        console.error('⚠️ Erro ao deletar arquivo de teste:', deleteError);
      } else {
        console.log('🧹 Arquivo de teste removido');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Função para testar upload de imagem
async function testImageUpload() {
  console.log('🖼️ Testando upload de imagem...');
  
  try {
    // Criar uma imagem de teste simples
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('TEST', 20, 50);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('❌ Erro ao criar blob da imagem');
        return;
      }
      
      const testImageFile = new File([blob], 'test-logo.png', { type: 'image/png' });
      
      console.log('📤 Fazendo upload da imagem de teste...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company')
        .upload('logos/test-logo.png', testImageFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Erro no upload da imagem:', uploadError);
        console.error('📋 Detalhes:', {
          message: uploadError.message,
          name: uploadError.name
        });
      } else {
        console.log('✅ Upload da imagem realizado com sucesso:', uploadData);
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('company')
          .getPublicUrl('logos/test-logo.png');
        
        console.log('🔗 URL pública da imagem:', urlData.publicUrl);
        
        // Limpar arquivo de teste
        const { error: deleteError } = await supabase.storage
          .from('company')
          .remove(['logos/test-logo.png']);
        
        if (deleteError) {
          console.error('⚠️ Erro ao deletar imagem de teste:', deleteError);
        } else {
          console.log('🧹 Imagem de teste removida');
        }
      }
    }, 'image/png');
    
  } catch (error) {
    console.error('❌ Erro no teste de upload de imagem:', error);
  }
}

// Executar testes
console.log('🚀 Iniciando testes de storage...');
testStorageConnection().then(() => {
  console.log('✅ Teste de conexão concluído');
  testImageUpload().then(() => {
    console.log('✅ Teste de upload de imagem concluído');
  });
}); 