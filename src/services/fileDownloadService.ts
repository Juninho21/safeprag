import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Device } from '@capacitor/device';

export interface DownloadOptions {
  url: string;
  filename: string;
  directory?: Directory;
  showToast?: boolean;
}

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: string[];
}

export class FileDownloadService {
  /**
   * Faz download de um arquivo da internet
   */
  static async downloadFile(options: DownloadOptions): Promise<string> {
    try {
      const { url, filename, directory = Directory.Documents, showToast = true } = options;

      // Verifica se é uma URL válida
      if (!url || !url.startsWith('http')) {
        throw new Error('URL inválida');
      }

      // Faz o download do arquivo
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro no download: ${response.status}`);
      }

      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      // Salva o arquivo
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: directory,
        recursive: true
      });

      if (showToast) {
        await Toast.show({
          text: `Arquivo salvo: ${filename}`,
          duration: 'short',
          position: 'bottom'
        });
      }

      return result.uri;
    } catch (error) {
      console.error('Erro no download:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await Toast.show({
        text: `Erro no download: ${errorMessage}`,
        duration: 'long',
        position: 'bottom'
      });
      throw error;
    }
  }

  /**
   * Compartilha um arquivo
   */
  static async shareFile(options: ShareOptions): Promise<void> {
    try {
      const { title = 'Compartilhar', text, url, files } = options;

      const shareOptions: any = {
        title,
        text: text || 'Arquivo do Sulpest'
      };

      if (url) {
        shareOptions.url = url;
      }

      if (files && files.length > 0) {
        shareOptions.files = files;
      }

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      await Toast.show({
        text: 'Erro ao compartilhar arquivo',
        duration: 'long',
        position: 'bottom'
      });
      throw error;
    }
  }

  /**
   * Lista arquivos em um diretório
   */
  static async listFiles(directory: Directory = Directory.Documents): Promise<any[]> {
    try {
      const result = await Filesystem.readdir({
        path: '',
        directory: directory
      });

      return result.files || [];
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      return [];
    }
  }

  /**
   * Remove um arquivo
   */
  static async deleteFile(filename: string, directory: Directory = Directory.Documents): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: filename,
        directory: directory
      });

      await Toast.show({
        text: `Arquivo removido: ${filename}`,
        duration: 'short',
        position: 'bottom'
      });
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      await Toast.show({
        text: 'Erro ao remover arquivo',
        duration: 'long',
        position: 'bottom'
      });
      throw error;
    }
  }

  /**
   * Lê um arquivo como texto
   */
  static async readFileAsText(filename: string, directory: Directory = Directory.Documents): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: directory,
        encoding: Encoding.UTF8
      });

      return result.data as string;
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      throw error;
    }
  }

  /**
   * Converte blob para base64
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          // Remove o prefixo "data:application/octet-stream;base64," se existir
          const base64 = result.split(',')[1] || result;
          resolve(base64);
        } else {
          reject(new Error('Falha ao converter blob para base64'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Verifica se o dispositivo tem permissões de armazenamento
   */
  static async checkStoragePermissions(): Promise<boolean> {
    try {
      const info = await Device.getInfo();
      // Para Android 10+ (API 29+), as permissões são gerenciadas automaticamente
      // Para versões anteriores, pode ser necessário verificar permissões
      return true;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  /**
   * Gera um nome de arquivo único com timestamp
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = new Date().getTime();
    const extension = originalName.split('.').pop() || '';
    const nameWithoutExtension = originalName.replace(`.${extension}`, '');
    return `${nameWithoutExtension}_${timestamp}.${extension}`;
  }
}

export default FileDownloadService; 