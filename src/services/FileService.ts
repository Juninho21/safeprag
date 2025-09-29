import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';

export class FileService {
  static async savePDF(pdfBlob: Blob, fileName: string): Promise<string> {
    try {
      // Converter Blob para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64Data = reader.result as string;
          // Remove o cabeçalho do base64 se existir
          const pdfData = base64Data.replace(/^data:application\/pdf;base64,/, '');
          resolve(pdfData);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(pdfBlob);
      const pdfData = await base64Promise;

      // Tenta salvar no diretório Downloads primeiro (Android 10+)
      let result;
      try {
        result = await Filesystem.writeFile({
          path: `Download/${fileName}.pdf`,
          data: pdfData,
          directory: Directory.ExternalStorage,
          recursive: true
        });
      } catch (externalError) {
        // Se falhar, tenta no diretório Documents
        result = await Filesystem.writeFile({
          path: `${fileName}.pdf`,
          data: pdfData,
          directory: Directory.Documents,
          recursive: true
        });
      }

      console.log('PDF salvo em:', result.uri);
      return result.uri;
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      // Fallback: tenta salvar no diretório Documents se ExternalStorage falhar
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64Data = reader.result as string;
            const pdfData = base64Data.replace(/^data:application\/pdf;base64,/, '');
            resolve(pdfData);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(pdfBlob);
        const pdfData = await base64Promise;

        const result = await Filesystem.writeFile({
          path: `${fileName}.pdf`,
          data: pdfData,
          directory: Directory.Documents,
          recursive: true
        });

        console.log('PDF salvo em (fallback):', result.uri);
        return result.uri;
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        throw fallbackError;
      }
    }
  }

  static async shareFile(fileUri: string): Promise<void> {
    try {
      await Filesystem.getInfo({
        path: fileUri,
        directory: Directory.Documents
      });

      // Aqui você pode implementar o compartilhamento usando outro plugin do Capacitor
      // Por exemplo, usando @capacitor/share
    } catch (error) {
      console.error('Erro ao compartilhar arquivo:', error);
      throw error;
    }
  }

  static async openPDF(fileUri: string): Promise<void> {
    try {
      const isCapacitor = !!(window as any).Capacitor;
      
      if (isCapacitor) {
        // Método 1: Usar Share plugin (mais confiável no Android)
        try {
          await Share.share({
            title: 'Ordem de Serviço PDF',
            text: 'Visualizar PDF da Ordem de Serviço',
            url: fileUri,
            dialogTitle: 'Abrir PDF com...'
          });
          return;
        } catch (shareError) {
          console.log('Share plugin falhou:', shareError);
          
          // Se o Share falhar, tenta usar o método nativo do sistema
          try {
            // Para Android, tenta usar o intent do sistema
            if ((window as any).Capacitor?.getPlatform() === 'android') {
              // Cria um intent para abrir o PDF
              const intent = {
                action: 'android.intent.action.VIEW',
                url: fileUri,
                type: 'application/pdf',
                flags: ['FLAG_ACTIVITY_NEW_TASK', 'FLAG_GRANT_READ_URI_PERMISSION']
              };
              
              // Usa o plugin nativo se disponível
              if ((window as any).cordova?.plugins?.intent) {
                await (window as any).cordova.plugins.intent.startActivity(intent);
                return;
              }
            }
          } catch (intentError) {
            console.log('Intent nativo falhou:', intentError);
          }
        }
        
        // Método 2: Tenta usar o Browser plugin
        try {
          if ((window as any).Capacitor?.Plugins?.Browser) {
            const { Browser } = (window as any).Capacitor.Plugins;
            await Browser.open({ url: fileUri });
            return;
          }
        } catch (browserError) {
          console.log('Browser plugin falhou:', browserError);
        }
        
        // Método 3: Fallback - notifica sobre o local do arquivo
        console.log('PDF salvo em:', fileUri);
        throw new Error('PDF salvo com sucesso! Verifique a pasta Downloads ou Documentos do seu dispositivo.');
        
      } else {
        // Para web, usa o método padrão
        window.open(fileUri, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      throw error;
    }
  }
  
  // Método alternativo para compartilhar usando apenas o sistema nativo
  static async sharePDFNative(fileUri: string, fileName: string): Promise<void> {
    try {
      await Share.share({
        title: fileName,
        text: 'Compartilhar PDF da Ordem de Serviço',
        url: fileUri,
        dialogTitle: 'Compartilhar PDF'
      });
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      throw new Error('Não foi possível compartilhar o PDF. Arquivo salvo no dispositivo.');
    }
  }
}
