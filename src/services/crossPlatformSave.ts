import { Capacitor } from '@capacitor/core';

export interface SaveResult {
  success: boolean;
  path?: string;
  latestPath?: string;
  error?: string;
}

/**
 * Salva um JSON de backup de forma cross‑plataforma.
 * - Web/Dev: usa o endpoint de desenvolvimento para salvar em `public/`
 * - Android/iOS (Capacitor): grava em armazenamento interno do app (`Directory.Data`)
 *   e também mantém uma cópia em `latest-backup.json` para auto‑restore previsível.
 */
export async function saveBackupJson(fileName: string, content: string): Promise<SaveResult> {
  const isNative = Capacitor.getPlatform() !== 'web';

  if (!isNative) {
    const { saveBackupJsonToPublic } = await import('./devFileSave');
    return await saveBackupJsonToPublic(fileName, content);
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    const normalizedName = fileName?.endsWith('.json') ? fileName : `${fileName || 'backup'}.json`;

    // Caminho do arquivo original (para referência)
    await Filesystem.writeFile({
      path: normalizedName,
      data: content,
      directory: Directory.Data,
      encoding: 'utf8',
      recursive: true,
    });

    // Cópia previsível para auto‑restore
    await Filesystem.writeFile({
      path: 'latest-backup.json',
      data: content,
      directory: Directory.Data,
      encoding: 'utf8',
      recursive: true,
    });

    return {
      success: true,
      path: `${Directory.Data}/${normalizedName}`,
      latestPath: `${Directory.Data}/latest-backup.json`,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Falha ao salvar backup no dispositivo' };
  }
}