import { Device } from '../types';
import { STORAGE_KEYS } from './storageKeys';

export interface StorageService {
  // Dispositivos
  saveDevices: (devices: Device[]) => void;
  getDevices: () => Device[];

  // Clientes
  getClients: () => any[];
  saveClients: (clients: any[]) => void;
  deleteClient: (id: string) => void;

  // Produtos
  getProducts: () => any[];
  saveProducts: (products: any[]) => void;
  deleteProduct: (id: string) => void;

  // Ordens de Serviço
  getServiceOrders: () => any[];
  saveServiceOrders: (orders: any[]) => void;
  deleteServiceOrder: (id: string) => void;

  // Agendamentos
  getSchedules: () => any[];
  saveSchedules: (schedules: any[]) => void;
  deleteSchedule: (id: string) => void;

  // Empresa
  getCompany: () => any;
  saveCompany: (company: any) => void;
  deleteCompany: () => void;

  // Usuário
  getUserData: () => any;
  saveUserData: (userData: any) => void;
  deleteUserData: () => void;

  // Utilitários
  getItems: (key: string) => any[];
  saveItems: (key: string, items: any[]) => void;
  clearAll: () => void;
}

class StorageServiceImpl implements StorageService {
  // Dispositivos
  saveDevices(devices: Device[]): void {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  }

  getDevices(): Device[] {
    const devices = localStorage.getItem(STORAGE_KEYS.DEVICES);
    return devices ? JSON.parse(devices) : [];
  }

  // Clientes
  getClients(): any[] {
    return this.getItems(STORAGE_KEYS.CLIENTS);
  }

  saveClients(clients: any[]): void {
    this.saveItems(STORAGE_KEYS.CLIENTS, clients);
  }

  deleteClient(id: string): void {
    const clients = this.getClients();
    const updatedClients = clients.filter(client => client.id !== id);
    this.saveClients(updatedClients);
  }

  // Produtos
  getProducts(): any[] {
    return this.getItems(STORAGE_KEYS.PRODUCTS);
  }

  saveProducts(products: any[]): void {
    this.saveItems(STORAGE_KEYS.PRODUCTS, products);
  }

  deleteProduct(id: string): void {
    const products = this.getProducts();
    const updatedProducts = products.filter(product => product.id !== id);
    this.saveProducts(updatedProducts);
  }

  // Ordens de Serviço
  getServiceOrders(): any[] {
    return this.getItems(STORAGE_KEYS.SERVICE_ORDERS);
  }

  saveServiceOrders(orders: any[]): void {
    this.saveItems(STORAGE_KEYS.SERVICE_ORDERS, orders);
  }

  deleteServiceOrder(id: string): void {
    const orders = this.getServiceOrders();
    const updatedOrders = orders.filter(order => order.id !== id);
    this.saveServiceOrders(updatedOrders);
  }

  // Agendamentos
  getSchedules(): any[] {
    return this.getItems(STORAGE_KEYS.SCHEDULES);
  }

  saveSchedules(schedules: any[]): void {
    this.saveItems(STORAGE_KEYS.SCHEDULES, schedules);
  }

  deleteSchedule(id: string): void {
    const schedules = this.getSchedules();
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    this.saveSchedules(updatedSchedules);
  }

  // Empresa
  getCompany(): any {
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
    return data ? JSON.parse(data) : null;
  }

  saveCompany(company: any): void {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
  }

  deleteCompany(): void {
    localStorage.removeItem(STORAGE_KEYS.COMPANY);
  }

  // Usuário
  getUserData(): any {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  saveUserData(userData: any): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  deleteUserData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // Utilitários
  getItems(key: string): any[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Erro ao obter dados da chave ${key}:`, error);
      return [];
    }
  }

  saveItems(key: string, items: any[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error(`Erro ao salvar dados na chave ${key}:`, error);
    }
  }

  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        if (typeof key === 'string') {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Erro ao limpar dados do armazenamento:', error);
    }
  }
}

export const storageService = new StorageServiceImpl();
