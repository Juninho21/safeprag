// Script de diagnóstico para problemas de backup no Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqfucquhjvyoswentpjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZnVjcXVoanZ5b3N3ZW50cGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjgyMzcsImV4cCI6MjA2MDI0NDIzN30.pknHE-kKiYkFQtm6y_U2KVV36hQRRX7JJ5_dENq8Ak4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseBackupIssue() {
  console.log('🔍 Iniciando diagnóstico do problema de backup...\\n');

  try {
    // 1. Testar conexão básica
    console.log('1. Testando conexão básica com Supabase...');
    const { data: testData, error: testError } = await supabase.from('test_connection').select('*').limit(1);
    if (testError) {
      console.log('❌ Erro na conexão básica:', testError.message);
    } else {
      console.log('✅ Conexão básica OK');
    }

    // 2. Verificar buckets disponíveis
    console.log('\\n2. Verificando buckets de storage...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }

    console.log('📦 Buckets encontrados:', buckets?.map(b => b.name));
    
    // 3. Verificar se o bucket 'backups' existe
    const backupsBucket = buckets?.find(b => b.name === 'backups');
    if (!backupsBucket) {
      console.log('❌ Bucket "backups" não encontrado!');
      console.log('💡 Execute o script supabase/setup_backup_bucket.sql no Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Bucket "backups" encontrado:', backupsBucket);

    // 4. Testar permissões do bucket
    console.log('\\n3. Testando permissões do bucket "backups"...');
    
    // Testar listagem
    const { data: files, error: listError } = await supabase.storage
      .from('backups')
      .list();
    
    if (listError) {
      console.log('❌ Erro ao listar arquivos:', listError.message);
    } else {
      console.log('✅ Permissão de listagem OK');
      console.log(`📁 ${files?.length || 0} arquivo(s) encontrado(s)`);
    }

    // 5. Testar upload de arquivo de teste
    console.log('\\n4. Testando upload de arquivo JSON...');
    
    const testBackupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: { test: 'dados de teste' }
    };
    
    const testBlob = new Blob([JSON.stringify(testBackupData, null, 2)], { 
      type: 'application/json' 
    });
    
    const testFileName = `test-backup-${Date.now()}.json`;
    
    console.log(`📤 Tentando upload de ${testFileName}...`);
    console.log(`📊 Tamanho do arquivo: ${testBlob.size} bytes`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(testFileName, testBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/json'
      });

    if (uploadError) {
      console.log('❌ Erro no upload:', uploadError.message);
      console.log('📋 Detalhes do erro:', {
        name: uploadError.name,
        status: uploadError.status,
        statusCode: uploadError.statusCode
      });
      
      // Verificar se é problema de política
      if (uploadError.message.includes('policy') || uploadError.statusCode === 403) {
        console.log('💡 Possível problema de política de segurança:');
        console.log('   - Verifique se as políticas RLS estão configuradas corretamente');
        console.log('   - Execute o script supabase/setup_backup_bucket.sql novamente');
      }
    } else {
      console.log('✅ Upload realizado com sucesso!');
      console.log('📄 Arquivo criado:', uploadData);

      // 6. Testar URL pública
      console.log('\\n5. Testando URL pública...');
      const { data: urlData } = supabase.storage
        .from('backups')
        .getPublicUrl(testFileName);
      
      console.log('🔗 URL pública:', urlData.publicUrl);

      // 7. Limpar arquivo de teste
      console.log('\\n6. Limpando arquivo de teste...');
      const { error: deleteError } = await supabase.storage
        .from('backups')
        .remove([testFileName]);
      
      if (deleteError) {
        console.log('⚠️ Erro ao deletar arquivo de teste:', deleteError.message);
      } else {
        console.log('✅ Arquivo de teste removido');
      }
    }

  } catch (error) {
    console.log('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseBackupIssue().then(() => {
  console.log('\\n🎯 Diagnóstico concluído!');
});