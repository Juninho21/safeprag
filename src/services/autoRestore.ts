import { restoreBackup, BackupData } from './backupService';
import { restoreBackup as restoreByKeyMap } from './storageKeys';
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
    // Always attempt to restore from public files regardless of existing data.

    const isNative = Capacitor.getPlatform() !== 'web';

    // 0) Android/iOS: tentar primeiro do Filesystem interno (latest-backup.json)
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
            const resultLatest = restoreBackup(jsonLatest as BackupData);
            if (resultLatest.success) {
              localStorage.setItem(INIT_FLAG_KEY, 'true');
              console.log('[AutoRestore] (Mobile) Restaurado via Filesystem: latest-backup.json');
              return;
            }
          } else {
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

    // 1) Try well-known latest-backup.json first (always prioritized)
    const latestPath = `${import.meta.env.BASE_URL}latest-backup.json`;
    try {
      const resLatest = await fetch(latestPath, { cache: 'no-cache' });
      if (resLatest.ok) {
        const jsonLatest = await resLatest.json();
        // If JSON is in backup format (with data), use backupService restore; otherwise map keys via storageKeys
        if (jsonLatest && jsonLatest.timestamp && jsonLatest.version && jsonLatest.data) {
          const resultLatest = restoreBackup(jsonLatest as BackupData);
          if (resultLatest.success) {
            localStorage.setItem(INIT_FLAG_KEY, 'true');
            console.log(`[AutoRestore] Restored ${resultLatest.restored} items from ${latestPath}.`);
            return;
          } else {
            console.warn(`[AutoRestore] Restore from ${latestPath} reported errors: ${resultLatest.errors.join(', ')}`);
          }
        } else {
          // Plain JSON (e.g., { COMPANY, CLIENTS, ... })
          restoreByKeyMap(jsonLatest as Record<string, any>);
          localStorage.setItem(INIT_FLAG_KEY, 'true');
          console.log(`[AutoRestore] Restored items from plain JSON at ${latestPath}.`);
          return;
        }
      }
    } catch (e) {
      // Ignore and fall through to other strategies
    }

    // 2) Try a user-saved backup persisted locally (with original fileName)
    const persistedStr = localStorage.getItem(PERSISTED_BACKUP_KEY);
    if (persistedStr) {
      try {
        const payload = JSON.parse(persistedStr) as PersistedBackupMeta;

        // Mobile: tentar arquivo com o nome original salvo no Filesystem
        if (isNative && payload.fileName) {
          try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const normalizedName = payload.fileName.endsWith('.json') ? payload.fileName : `${payload.fileName}.json`;
            const file = await Filesystem.readFile({
              path: normalizedName,
              directory: Directory.Data,
              encoding: 'utf8',
            });
            if (file?.data) {
              const json = JSON.parse(file.data);
              if (json && json.timestamp && json.version && json.data) {
                const result = restoreBackup(json as BackupData);
                if (result.success) {
                  localStorage.setItem(INIT_FLAG_KEY, 'true');
                  console.log(`[AutoRestore] (Mobile) Restaurado via Filesystem: ${normalizedName}.`);
                  return;
                }
              } else {
                restoreByKeyMap(json as Record<string, any>);
                localStorage.setItem(INIT_FLAG_KEY, 'true');
                console.log(`[AutoRestore] (Mobile) Restaurado via Filesystem JSON simples: ${normalizedName}.`);
                return;
              }
            }
          } catch (err) {
            // prosseguir para caminhos web
          }
        }

        // Try to restore from a copy saved in public (if available)
        if (payload.fileName) {
          const publicUrl = `${import.meta.env.BASE_URL}${payload.fileName}`;
          try {
            const res = await fetch(publicUrl, { cache: 'no-cache' });
            if (res.ok) {
              const json = await res.json();
              if (json && json.timestamp && json.version && json.data) {
                const result = restoreBackup(json as BackupData);
                if (result.success) {
                  localStorage.setItem(INIT_FLAG_KEY, 'true');
                  console.log(`[AutoRestore] Restored ${result.restored} items from public file (${payload.fileName}).`);
                  return;
                }
              } else {
                restoreByKeyMap(json as Record<string, any>);
                localStorage.setItem(INIT_FLAG_KEY, 'true');
                console.log(`[AutoRestore] Restored items from plain JSON public file (${payload.fileName}).`);
                return;
              }
            } else {
              console.warn(`[AutoRestore] Public file not found at ${publicUrl} (status ${res.status}). Falling back to persisted payload.`);
            }
          } catch (err) {
            console.warn('[AutoRestore] Error restoring from public file, falling back to persisted payload:', err);
          }
        }

        // Fallback to persisted payload in localStorage
        if (payload.backup && payload.backup.data) {
          // If data object uses internal storage keys, use backupService; else map via storageKeys
          const hasInternalKeys = Object.keys(payload.backup.data).some(k => k.startsWith('safeprag_'));
          if (hasInternalKeys) {
            const result = restoreBackup(payload.backup);
            if (result.success) {
              localStorage.setItem(INIT_FLAG_KEY, 'true');
              console.log(`[AutoRestore] Restored ${result.restored} items from persisted backup (${payload.fileName || 'unnamed'}).`);
              return;
            } else {
              console.warn(`[AutoRestore] Persisted restore reported errors: ${result.errors.join(', ')}`);
            }
          } else {
            restoreByKeyMap(payload.backup.data);
            localStorage.setItem(INIT_FLAG_KEY, 'true');
            console.log(`[AutoRestore] Restored items from persisted plain backup (${payload.fileName || 'unnamed'}).`);
            return;
          }
        }
      } catch (err) {
        console.error('[AutoRestore] Failed to restore from persisted backup:', err);
      }
    }

    // 3) Fallback to bundled default backup path
    const defaultPath = (import.meta.env.VITE_DEFAULT_BACKUP_PATH as string) || `${import.meta.env.BASE_URL}default-backup.json`;
    const candidates = [defaultPath];

    for (const path of candidates) {
      try {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) {
          console.warn(`[AutoRestore] Backup file not found at ${path} (status ${res.status}).`);
          continue;
        }
        const json = await res.json();
        if (json && json.timestamp && json.version && json.data) {
          const result = restoreBackup(json as BackupData);
          if (result.success) {
            localStorage.setItem(INIT_FLAG_KEY, 'true');
            console.log(`[AutoRestore] Restored ${result.restored} items from ${path}.`);
            return;
          } else {
            console.warn(`[AutoRestore] Restore reported errors: ${result.errors.join(', ')}`);
          }
        } else {
          restoreByKeyMap(json as Record<string, any>);
          localStorage.setItem(INIT_FLAG_KEY, 'true');
          console.log(`[AutoRestore] Restored items from plain JSON at ${path}.`);
          return;
        }
      } catch (err) {
        console.error(`[AutoRestore] Error restoring from ${path}:`, err);
      }
    }

    console.warn('[AutoRestore] No valid backup file found, skipping.');
  } catch (error) {
    console.error('[AutoRestore] Unexpected error:', error);
  }
}