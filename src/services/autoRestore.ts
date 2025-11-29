import { restoreBackup, BackupData } from './backupService';
import { restoreBackup as restoreByKeyMap, STORAGE_KEYS } from './storageKeys';
import { Capacitor } from '@capacitor/core';

const INIT_FLAG_KEY = 'safeprag_initial_restore_done';
const PERSISTED_BACKUP_KEY = 'safeprag_auto_restore_backup';

interface PersistedBackupMeta {
  fileName?: string;
  savedAt: string;
  backup: BackupData;
}

export function saveBackupForAutoRestore(backup: BackupData, fileName?: string): void {
  try {
    const payload: PersistedBackupMeta = {
      fileName,
      savedAt: new Date().toISOString(),
      backup
    };
    localStorage.setItem(PERSISTED_BACKUP_KEY, JSON.stringify(payload));
    console.log('[AutoRestore] Persisted backup for future auto-restore:', { fileName });
  } catch (err) {
    console.error('[AutoRestore] Failed to persist backup for auto-restore:', err);
  }
}

export async function autoRestoreOnStartup(): Promise<void> {
  try {
    // Evita restaurar repetidamente se já foi feito uma vez
    const alreadyRestored = localStorage.getItem(INIT_FLAG_KEY) === 'true';
    if (alreadyRestored) {
      console.log('[AutoRestore] Inicialização já restaurada anteriormente; pulando auto-restauração.');
      return;
    }

    // Detecta se existem agendamentos locais para preservar
    let hasExistingSchedules = false;
    try {
      const schedulesStr = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (schedulesStr) {
        const parsed = JSON.parse(schedulesStr);
        hasExistingSchedules = Array.isArray(parsed) && parsed.length > 0;
      }
    } catch {}

    const isNative = Capacitor.getPlatform() !== 'web';

    // 1) Android/iOS: tentar primeiro do Filesystem interno (latest-backup.json)
    if (isNative) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const latest = await Filesystem.readFile({
          path: 'latest-backup.json',
          directory: Directory.Data,
          encoding: 'utf8',
        });
        if (latest?.data) {
          const jsonLatest = JSON.parse(latest.data);
          if (jsonLatest && jsonLatest.timestamp && jsonLatest.version && jsonLatest.data) {
            // Não sobrescreve agendamentos se já existem localmente
            if (hasExistingSchedules && jsonLatest.data) {
              delete jsonLatest.data[STORAGE_KEYS.SCHEDULES];
              console.log('[AutoRestore] Mantendo agendamentos locais (mobile).');
            }
            const resultLatest = restoreBackup(jsonLatest as BackupData);
            if (resultLatest.success) {
              localStorage.setItem(INIT_FLAG_KEY, 'true');
              console.log('[AutoRestore] (Mobile) Restaurado via Filesystem: latest-backup.json');
              return;
            } else {
              console.warn('[AutoRestore] (Mobile) Falha ao restaurar backup do Filesystem.');
            }
          } else {
            // JSON simples via mapa de chaves
            if (hasExistingSchedules) {
              delete jsonLatest['SCHEDULES'];
              delete jsonLatest[STORAGE_KEYS.SCHEDULES];
              console.log('[AutoRestore] Mantendo agendamentos locais (mobile JSON simples).');
            }
            restoreByKeyMap(jsonLatest as Record<string, any>);
            localStorage.setItem(INIT_FLAG_KEY, 'true');
            console.log('[AutoRestore] (Mobile) Restaurado via Filesystem JSON simples: latest-backup.json');
            return;
          }
        }
      } catch (e) {
        // Se não existir, segue para os caminhos web
      }
    }

    // 2) Web: tentar latest-backup.json no diretório público
    const latestPath = `${import.meta.env.BASE_URL}latest-backup.json`;
    try {
      const resLatest = await fetch(latestPath, { cache: 'no-cache' });
      if (resLatest.ok) {
        const jsonLatest = await resLatest.json();
        if (jsonLatest && jsonLatest.timestamp && jsonLatest.version && jsonLatest.data) {
          // Não sobrescreve agendamentos se já existem localmente
          if (hasExistingSchedules && jsonLatest.data) {
            delete jsonLatest.data[STORAGE_KEYS.SCHEDULES];
            console.log('[AutoRestore] Mantendo agendamentos locais (web).');
          }
          const resultLatest = restoreBackup(jsonLatest as BackupData);
          if (resultLatest.success) {
            localStorage.setItem(INIT_FLAG_KEY, 'true');
            console.log(`[AutoRestore] Restored ${resultLatest.restored} items from ${latestPath}.`);
            return;
          } else {
            console.warn(`[AutoRestore] Restore from ${latestPath} reported errors: ${resultLatest.errors.join(', ')}`);
          }
        } else {
          // JSON simples via mapa de chaves
          if (hasExistingSchedules) {
            delete jsonLatest['SCHEDULES'];
            delete jsonLatest[STORAGE_KEYS.SCHEDULES];
            console.log('[AutoRestore] Mantendo agendamentos locais (web JSON simples).');
          }
          restoreByKeyMap(jsonLatest as Record<string, any>);
          localStorage.setItem(INIT_FLAG_KEY, 'true');
          console.log(`[AutoRestore] Restored items from plain JSON at ${latestPath}.`);
          return;
        }
      } else {
        console.warn(`[AutoRestore] latest-backup.json não encontrado em ${latestPath} (status ${resLatest.status}).`);
      }
    } catch (e) {
      console.warn('[AutoRestore] Erro ao buscar latest-backup.json na web:', e);
    }

    // 3) Caso não encontre: permanecer em branco, aguardando backup manual
    console.warn('[AutoRestore] latest-backup.json não disponível. Inicialização sem dados. Aguarda backup manual.');
  } catch (error) {
    console.error('[AutoRestore] Erro inesperado:', error);
  }
}