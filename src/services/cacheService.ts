export class CacheService {
  private static COMPANY_KEY = 'safeprag_company_data';

  static setCompanyData(data: any): void {
    try {
      localStorage.setItem(this.COMPANY_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  static getCompanyData(): any | null {
    try {
      const cached = localStorage.getItem(this.COMPANY_KEY);
      if (!cached) return null;
      return JSON.parse(cached).data;
    } catch (error) {
      console.error('Erro ao ler do cache:', error);
      return null;
    }
  }

  static clearCompanyData(): void {
    try {
      localStorage.removeItem(this.COMPANY_KEY);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}
