import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

// Configure suas chaves aqui ou use variáveis de ambiente
const supabaseUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key é necessária nas variáveis de ambiente');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function restoreDatabase() {
  try {
    // Caminho do arquivo de backup (ajuste a data conforme necessário)
    const backupFile = path.join(process.cwd(), 'backups', 'backup_YYYY-MM-DD.json'); // Substitua pela data do seu backup

    // Lê o arquivo de backup
    const backup = JSON.parse(readFileSync(backupFile, 'utf8'));

    // Para cada tabela, insere os dados
    for (const tableName of Object.keys(backup)) {
      const tableData = backup[tableName];
      if (!tableData || tableData.length === 0) continue;

      // Insere em lotes de 500 registros (limite da API)
      for (let i = 0; i < tableData.length; i += 500) {
        const batch = tableData.slice(i, i + 500);
        const { error } = await supabase.from(tableName).insert(batch, { upsert: true });
        if (error) {
          console.error(`Erro ao restaurar tabela ${tableName}:`, error);
        } else {
          console.log(`Restaurados ${batch.length} registros em ${tableName}`);
        }
      }
    }

    console.log('Restauração concluída!');
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
  }
}

restoreDatabase(); 