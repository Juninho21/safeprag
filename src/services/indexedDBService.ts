/**
 * Serviço para gerenciar o armazenamento de PDFs usando IndexedDB
 */

interface PDFStorageItem {
  orderNumber: string;
  pdf: string;
  createdAt: string;
  clientName: string;
  serviceType: string;
  clientCode?: string;
  services?: any[];
  technicianName?: string;
}

class IndexedDBService {
  private dbName = 'SafepragPDFStorage';
  private storeName = 'pdfs';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Inicializa o banco de dados IndexedDB
   */
  async initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = (event) => {
          console.error('Erro ao abrir IndexedDB:', event);
          reject(new Error('Falha ao abrir IndexedDB'));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log('IndexedDB inicializado com sucesso');

          // Migrar dados do localStorage para IndexedDB automaticamente
          this.migrateFromLocalStorage()
            .then(() => {
              console.log('Migração automática de PDFs concluída');
              resolve(true);
            })
            .catch(error => {
              console.error('Erro na migração automática:', error);
              // Mesmo com erro na migração, consideramos o DB inicializado
              resolve(true);
            });
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Criar object store para PDFs se não existir
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'orderNumber' });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            console.log('Object store para PDFs criado');
          }
        };
      } catch (error) {
        console.error('Erro ao inicializar IndexedDB:', error);
        reject(error);
      }
    });
  }

  /**
   * Armazena um PDF no IndexedDB
   */
  async storePDF(pdfData: PDFStorageItem): Promise<boolean> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const request = store.put(pdfData);

        request.onsuccess = () => {
          console.log('PDF armazenado com sucesso no IndexedDB:', pdfData.orderNumber);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error('Erro ao armazenar PDF no IndexedDB:', event);
          reject(new Error('Falha ao armazenar PDF no IndexedDB'));
        };
      } catch (error) {
        console.error('Erro ao armazenar PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Obtém um PDF específico do IndexedDB
   */
  async getPDF(orderNumber: string): Promise<PDFStorageItem | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);

        const request = store.get(orderNumber);

        request.onsuccess = () => {
          const result = request.result as PDFStorageItem;
          resolve(result || null);
        };

        request.onerror = (event) => {
          console.error('Erro ao buscar PDF do IndexedDB:', event);
          reject(new Error('Falha ao buscar PDF do IndexedDB'));
        };
      } catch (error) {
        console.error('Erro ao buscar PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Obtém todos os PDFs armazenados no IndexedDB
   */
  async getAllPDFs(): Promise<PDFStorageItem[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);

        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result as PDFStorageItem[];
          resolve(results || []);
        };

        request.onerror = (event) => {
          console.error('Erro ao buscar todos os PDFs do IndexedDB:', event);
          reject(new Error('Falha ao buscar PDFs do IndexedDB'));
        };
      } catch (error) {
        console.error('Erro ao buscar todos os PDFs:', error);
        reject(error);
      }
    });
  }

  /**
   * Exclui um PDF específico do IndexedDB
   */
  async deletePDF(orderNumber: string): Promise<boolean> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const request = store.delete(orderNumber);

        request.onsuccess = () => {
          console.log('PDF excluído com sucesso do IndexedDB:', orderNumber);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error('Erro ao excluir PDF do IndexedDB:', event);
          reject(new Error('Falha ao excluir PDF do IndexedDB'));
        };
      } catch (error) {
        console.error('Erro ao excluir PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Migra PDFs do localStorage para o IndexedDB
   */
  async migrateFromLocalStorage(): Promise<{ success: number, errors: number }> {
    try {
      console.log('Iniciando migração de PDFs do localStorage para IndexedDB');

      // Obter PDFs do localStorage
      const storedPDFs = JSON.parse(localStorage.getItem('safeprag_service_order_pdfs') || '{}');
      const orderNumbers = Object.keys(storedPDFs);

      if (orderNumbers.length === 0) {
        console.log('Nenhum PDF encontrado no localStorage para migração');
        return { success: 0, errors: 0 };
      }

      console.log(`Encontrados ${orderNumbers.length} PDFs para migração`);

      let successCount = 0;
      let errorCount = 0;

      // Migrar cada PDF para o IndexedDB
      for (const orderNumber of orderNumbers) {
        try {
          const pdfData = storedPDFs[orderNumber];

          // Armazenar no IndexedDB
          await this.storePDF({
            orderNumber,
            pdf: pdfData.pdf,
            createdAt: pdfData.createdAt,
            clientName: pdfData.clientName,
            serviceType: pdfData.serviceType,
            clientCode: pdfData.clientCode,
            services: pdfData.services
          });

          successCount++;
          console.log(`PDF ${orderNumber} migrado com sucesso`);
        } catch (error) {
          errorCount++;
          console.error(`Erro ao migrar PDF ${orderNumber}:`, error);
        }
      }

      console.log(`Migração concluída: ${successCount} sucesso, ${errorCount} erros`);
      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error('Erro durante a migração de PDFs:', error);
      throw error;
    }
  }
}

export const indexedDBService = new IndexedDBService();