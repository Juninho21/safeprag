import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

// Configure suas chaves aqui ou use variáveis de ambiente
const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key é necessária nas variáveis de ambiente');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function backupDatabase() {
  try {
    // Pasta para salvar os backups
    const backupDir = join(process.cwd(), 'backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir);
    }

    // Data atual para nome do arquivo
    const date = new Date().toISOString().split('T')[0];
    const backupFile = join(backupDir, `backup_${date}.json`);

    // Lista de todas as tabelas do projeto
    const tables = [
      'client_signatures',
      'clients',
      'company',
      'config',
      'devices',
      'products',
      'profiles',
      'schedules',
      'service_order_pdfs',
      'service_orders',
      'signatures',
      'system_settings',
      'user_data',
      'users'
    ];

    const backup = {};

    // Para cada tabela, obter todos os dados
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Erro ao exportar tabela ${tableName}:`, error);
        continue;
      }

      backup[tableName] = data;
    }

    // Salvar backup em arquivo
    writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`Backup salvo em: ${backupFile}`);

    // Backup do storage
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) throw bucketsError;

    const storageBackup = {};

    for (const bucket of buckets) {
      const { data: files, error: filesError } = await supabase
        .storage
        .from(bucket.name)
        .list();

      if (filesError) {
        console.error(`Erro ao listar arquivos do bucket ${bucket.name}:`, filesError);
        continue;
      }

      storageBackup[bucket.name] = files;
    }

    // Salvar backup do storage
    const storageBackupFile = join(backupDir, `storage_backup_${date}.json`);
    writeFileSync(storageBackupFile, JSON.stringify(storageBackup, null, 2));
    console.log(`Backup do storage salvo em: ${storageBackupFile}`);

  } catch (error) {
    console.error('Erro ao fazer backup:', error);
  }
}

backupDatabase();