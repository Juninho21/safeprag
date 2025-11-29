import { supabase } from '../config/supabase.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

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

        // Obter lista de todas as tabelas
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_type', 'BASE TABLE');

        if (tablesError) throw tablesError;

        const backup: { [key: string]: any[] } = {};

        // Para cada tabela, obter todos os dados
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table.table_name)
                .select('*');

            if (error) {
                console.error(`Erro ao exportar tabela ${table.table_name}:`, error);
                continue;
            }

            backup[table.table_name] = data;
        }

        // Salvar backup em arquivo
        writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        console.log(`Backup salvo em: ${backupFile}`);

        // Backup do storage
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) throw bucketsError;

        const storageBackup: { [key: string]: any[] } = {};

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

// Executar backup
backupDatabase(); 