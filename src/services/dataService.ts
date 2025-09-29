// MODO OFFLINE - Apenas localStorage
import { storageService } from './storageService';
// import { supabase } from '../config/supabase';
// import { getConnectionStatus } from './supabaseService';
import { Client } from './clientService';
import { Product } from '../types/product.types';
import * as clientStorage from './clientStorage';
import * as productService from './productService';
// import * as supabaseService from './supabaseService';

// Tipos
interface CompanyData {
  name: string;
  document: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
}

// MODO OFFLINE - Enum simplificado para modo de armazenamento
export enum StorageMode {
  LOCAL = 'local',
  SUPABASE = 'supabase', // Mantido para compatibilidade, mas não usado
  HYBRID = 'hybrid' // Mantido para compatibilidade, mas não usado
}

// Keys para localStorage
const STORAGE_KEYS = {
  COMPANY: 'safeprag_company',
  CLIENTS: 'safeprag_clients',
  PRODUCTS: 'safeprag_products',
};

// Chave para armazenar o modo de armazenamento
const STORAGE_MODE_KEY = 'safeprag_storage_mode';

// Função para obter o modo de armazenamento - SEMPRE LOCAL
export const getStorageMode = (): StorageMode => {
  return StorageMode.LOCAL;
};

// Função para definir o modo de armazenamento - NÃO FAZ NADA
export const setStorageMode = (mode: StorageMode): void => {
  console.log('📱 Sistema em modo offline - modo de armazenamento fixo em LOCAL');
};

// Função para verificar se o Supabase está disponível - SEMPRE FALSE
export const isSupabaseAvailable = async (): Promise<boolean> => {
  console.log('📱 Sistema em modo offline - Supabase desabilitado');
  return false;
};

// Serviço de Empresa
export const companyService = {
  getCompany: (): CompanyData | null => {
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
    return data ? JSON.parse(data) : null;
  },

  saveCompany: (data: CompanyData): void => {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(data));
  },

  deleteCompany: (): void => {
    localStorage.removeItem(STORAGE_KEYS.COMPANY);
  }
};

// Serviço de Clientes
export const clientService = {
  getClients: async (): Promise<Client[]> => {
    // MODO OFFLINE - Sempre usa localStorage
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },

  saveClient: async (client: Client): Promise<Client> => {
    // MODO OFFLINE - Salva apenas no localStorage
    const clients = await clientService.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    console.log('📱 Cliente salvo no localStorage:', client.name);
    
    return client;
  },

  deleteClient: async (id: string): Promise<boolean> => {
    // MODO OFFLINE - Deleta apenas do localStorage
    const clients = await clientService.getClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
    console.log('📱 Cliente removido do localStorage');
    
    return true;
  },

  searchClients: async (query: string): Promise<Client[]> => {
    const clients = await clientService.getClients();
    const searchTerm = query.toLowerCase();
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm) ||
      client.document.toLowerCase().includes(searchTerm)
    );
  }
};

// Serviço de Produtos - MODO OFFLINE
export const productDataService = {
  getProducts: async (): Promise<Product[]> => {
    // MODO OFFLINE - Sempre usa localStorage
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  
  saveProduct: async (product: Product): Promise<Product> => {
    // MODO OFFLINE - Salva apenas no localStorage
    const products = await productDataService.getProducts();
    
    // Gerar ID se não existir
    const productToSave = {
      ...product,
      id: product.id && product.id.trim() !== '' ? product.id : `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const index = products.findIndex(p => p.id === productToSave.id);
    
    if (index >= 0) {
      products[index] = productToSave;
    } else {
      products.push(productToSave);
    }
    
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    console.log('📱 Produto salvo no localStorage:', productToSave.name);
    
    return productToSave;
  },
  
  deleteProduct: async (id: string): Promise<boolean> => {
    // MODO OFFLINE - Remove apenas do localStorage
    const products = await productDataService.getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filteredProducts));
    console.log('📱 Produto removido do localStorage:', id);
    
    return true;
  }
};
