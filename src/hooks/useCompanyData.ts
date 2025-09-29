import { useState, useEffect } from 'react';
import { CompanyData } from '../services/companyService';

const CACHE_KEY = 'safeprag_company';

interface CacheData {
  data: CompanyData;
  timestamp: number;
}

export const useCompanyData = () => {
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para salvar no cache
  const saveToCache = (companyData: CompanyData) => {
    try {
      const cacheData: CacheData = {
        data: companyData,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  };

  // Função para ler do cache
  const getFromCache = (): CompanyData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const { data } = JSON.parse(cached) as CacheData;
      return data;
    } catch (error) {
      console.error('Erro ao ler do cache:', error);
      return null;
    }
  };

  // Função para limpar o cache
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  return {
    data,
    setData,
    loading,
    setLoading,
    saveToCache,
    getFromCache,
    clearCache
  };
};
