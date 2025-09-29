export const COMPANY_STORAGE_KEY = 'safeprag_company_data';

export interface CompanyData {
  id?: number;
  name: string;
  cnpj: string;
  phone?: string;
  address?: string;
  email?: string;
  logo_url?: string;
  document?: string;
  environmental_license?: {
    number?: string;
    date?: string;
  };
  sanitary_permit?: {
    number?: string;
    expiry_date?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Função para buscar dados da empresa do localStorage
 * @returns Dados da empresa ou null se não existirem
 */
export const getCompany = (): CompanyData | null => {
  try {
    const data = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao buscar dados da empresa do localStorage:', error);
    return null;
  }
};

/**
 * Função para salvar dados da empresa no localStorage
 * @param data Dados da empresa a serem salvos
 * @param logoFile Arquivo de logo (opcional)
 * @returns Dados da empresa atualizados
 */
export const saveCompany = async (data: CompanyData, logoFile?: File | null): Promise<CompanyData> => {
  try {
    let updatedData = { ...data };

    if (logoFile) {
      // Converte o logo para base64 e armazena no localStorage
      const logoBase64 = await convertFileToBase64(logoFile);
      updatedData.logo_url = logoBase64;
    }

    updatedData.updated_at = new Date().toISOString();
    
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(updatedData));
    
    return updatedData;
  } catch (error) {
    console.error('Erro ao salvar dados da empresa no localStorage:', error);
    throw error;
  }
};

/**
 * Função para deletar dados da empresa do localStorage
 */
export const deleteCompany = async (): Promise<void> => {
  try {
    localStorage.removeItem(COMPANY_STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao deletar dados da empresa do localStorage:', error);
    throw error;
  }
};

/**
 * Função para converter um arquivo para base64
 * @param file Arquivo a ser convertido
 * @returns String base64 do arquivo
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Função para fazer upload do logo da empresa
 * @param file Arquivo de logo
 * @returns URL do logo (base64)
 */
export const uploadCompanyLogo = async (file: File): Promise<string> => {
  try {
    const base64Logo = await convertFileToBase64(file);
    
    // Atualiza os dados da empresa com o novo logo
    const companyData = getCompany();
    if (companyData) {
      companyData.logo_url = base64Logo;
      await saveCompany(companyData);
    }
    
    return base64Logo;
  } catch (error) {
    console.error('Erro ao fazer upload do logo da empresa:', error);
    throw error;
  }
};
