import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Company } from '../types/company.types';

/**
 * Serviço para gerenciar dados da empresa no Firestore
 */

/**
 * Busca dados de uma empresa específica
 */
export const getCompany = async (companyId: string): Promise<Company | null> => {
  try {
    const docRef = doc(db, 'companies', companyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Company;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    throw error;
  }
};

/**
 * Atualiza dados da empresa
 */
export const saveCompany = async (
  companyId: string,
  data: Partial<Omit<Company, 'id' | 'created_at'>>,
  logoFile?: File | null
): Promise<void> => {
  try {
    let updateData: any = { ...data };

    // Upload de logo se fornecido
    if (logoFile) {
      const logoUrl = await uploadCompanyLogo(companyId, logoFile);
      updateData.logo_url = logoUrl;
    }

    updateData.updated_at = serverTimestamp();

    const docRef = doc(db, 'companies', companyId);
    // Use setDoc com merge: true para criar se não existir ou atualizar se existir
    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    throw error;
  }
};

/**
 * Faz upload do logo da empresa para o Firebase Storage
 * Com otimização automática: compressão e conversão para WebP
 */
export const uploadCompanyLogo = async (companyId: string, file: File): Promise<string> => {
  try {
    // Importar dinamicamente o módulo de utilitários de imagem
    const { optimizeImage } = await import('../utils/imageUtils');

    // Otimizar imagem (validar, comprimir e converter para WebP)
    const optimizedFile = await optimizeImage(file);

    // Nome do arquivo sempre em WebP
    const fileName = `company-logos/${companyId}.webp`;
    const storageRef = ref(storage, fileName);

    // Upload do arquivo otimizado
    await uploadBytes(storageRef, optimizedFile, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000', // Cache de 1 ano
    });

    // Obter URL pública
    const downloadURL = await getDownloadURL(storageRef);

    console.log(`✅ Logo enviado com sucesso: ${fileName}`);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    throw error;
  }
};

/**
 * Função auxiliar para converter arquivo para base64 (para compatibilidade com código legado)
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Backward compatibility: exportar interface legada
export interface CompanyData extends Company { }
export const COMPANY_STORAGE_KEY = 'safeprag_company_data'; // Mantido para compatibilidade

// ===== BACKWARD COMPATIBILITY FUNCTIONS FOR BACKUP/RESTORE =====
// Estas funções usam localStorage e são mantidas para compatibilidade com o sistema de backup existente

/**
 * Busca dados da empresa do localStorage (para backup/restore)
 * @deprecated Use getCompany(companyId) para operações normais
 */
export const getCompanyFromLocalStorage = (): CompanyData | null => {
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
 * Salva dados da empresa no localStorage (para backup/restore)
 * @deprecated Use saveCompany(companyId, data, logoFile) para operações normais
 */
export const saveCompanyToLocalStorage = async (data: CompanyData, logoFile?: File | null): Promise<CompanyData> => {
  try {
    let updatedData = { ...data };

    if (logoFile) {
      // Para localStorage, converte para base64
      const logoBase64 = await convertFileToBase64(logoFile);
      updatedData.logo_url = logoBase64;
    }

    updatedData.updated_at = new Date().toISOString();

    if (!updatedData.id) {
      updatedData.id = crypto.randomUUID();
    }

    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(updatedData));

    return updatedData;
  } catch (error) {
    console.error('Erro ao salvar dados da empresa no localStorage:', error);
    throw error;
  }
};

/**
 * Deleta dados da empresa do localStorage (para backup/restore)
 * @deprecated Não use para operações normais
 */
export const deleteCompanyFromLocalStorage = async (): Promise<void> => {
  try {
    localStorage.removeItem(COMPANY_STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao deletar dados da empresa do localStorage:', error);
    throw error;
  }
};

/**
 * Faz upload do logo da empresa para localStorage (base64)
 * @deprecated Use uploadCompanyLogo(companyId, file) para operações normais
 */
export const uploadCompanyLogoToLocalStorage = async (file: File): Promise<string> => {
  try {
    const base64Logo = await convertFileToBase64(file);

    // Atualiza os dados da empresa com o novo logo
    const companyData = getCompanyFromLocalStorage();
    if (companyData) {
      companyData.logo_url = base64Logo;
      await saveCompanyToLocalStorage(companyData);
    }

    return base64Logo;
  } catch (error) {
    console.error('Erro ao fazer upload do logo da empresa:', error);
    throw error;
  }
};

// Função de delete removida - não permitimos deletar empresas através do serviço do frontend
