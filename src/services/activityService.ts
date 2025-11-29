import { DevicePestCount } from '../types/pest.types';
import { STORAGE_KEYS } from './storageKeys';
import { storageService } from './storageService';

export interface ServiceListItem {
  id: string;
  serviceType: string;
  targetPest: string;
  location: string;
  product: any;
  productAmount: string;
}

export interface ActivityState {
  currentServiceId?: string;
  availablePests: string[];
  availableServiceTypes: string[];
  showNewPestInput: boolean;
  newPest?: string;
  showNewServiceInput: boolean;
  newService?: string;
  localStartTime?: Date;
}

export interface SavedDevice {
  id: string;
  type: string;
  status: string;
  quantity?: string;
}

class ActivityService {
  // Salvar contagens de pragas no localStorage
  async savePestCounts(serviceOrderId: string, counts: DevicePestCount[]): Promise<void> {
    try {
      // Chave para armazenar as contagens de pragas específicas desta ordem de serviço
      const key = `pestCounts_${serviceOrderId}`;
      localStorage.setItem(key, JSON.stringify(counts));
      
      // Atualizar também a ordem de serviço com as contagens
      const serviceOrders = storageService.getServiceOrders();
      const updatedOrders = serviceOrders.map(order => {
        if (order.id === serviceOrderId) {
          return { ...order, pest_counts: counts };
        }
        return order;
      });
      storageService.saveServiceOrders(updatedOrders);
      
      console.log('Contagens de pragas salvas no localStorage:', counts);
    } catch (error) {
      console.error('Erro ao salvar contagens de pragas no localStorage:', error);
      throw error;
    }
  }

  // Carregar contagens de pragas do localStorage
  async loadPestCounts(serviceOrderId: string): Promise<DevicePestCount[]> {
    try {
      // Tentar carregar do armazenamento específico da ordem
      const key = `pestCounts_${serviceOrderId}`;
      const data = localStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data);
      }
      
      // Se não encontrar, tentar buscar da ordem de serviço
      const serviceOrders = storageService.getServiceOrders();
      const order = serviceOrders.find(o => o.id === serviceOrderId);
      
      if (order && order.pest_counts) {
        return order.pest_counts;
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao carregar contagens de pragas do localStorage:', error);
      return [];
    }
  }

  // Salvar lista de serviços no localStorage apenas
  async saveServiceList(serviceOrderId: string, serviceList: ServiceListItem[]): Promise<void> {
    try {
      // Salvar apenas no localStorage
      const key = `serviceList_${serviceOrderId}`;
      localStorage.setItem(key, JSON.stringify(serviceList));
      console.log('Lista de serviços salva no localStorage:', serviceList);
    } catch (error) {
      console.error('Erro ao salvar lista de serviços no localStorage:', error);
      throw error;
    }
  }

  // Carregar lista de serviços do localStorage
  async loadServiceList(serviceOrderId: string): Promise<ServiceListItem[]> {
    try {
      const key = `serviceList_${serviceOrderId}`;
      const data = localStorage.getItem(key);
      
      if (!data) {
        return [];
      }
      
      return JSON.parse(data) || [];
    } catch (error) {
      console.error('Erro ao carregar lista de serviços do localStorage:', error);
      return [];
    }
  }

  // Salvar dispositivos no localStorage
  async saveDevices(serviceOrderId: string, devices: SavedDevice[]): Promise<void> {
    try {
      // Salvar dispositivos específicos desta ordem
      const key = `devices_${serviceOrderId}`;
      localStorage.setItem(key, JSON.stringify(devices));
      
      // Atualizar também a ordem de serviço com os dispositivos
      const serviceOrders = storageService.getServiceOrders();
      const updatedOrders = serviceOrders.map(order => {
        if (order.id === serviceOrderId) {
          return { ...order, devices: devices };
        }
        return order;
      });
      storageService.saveServiceOrders(updatedOrders);
      
      console.log('Dispositivos salvos no localStorage:', devices);
    } catch (error) {
      console.error('Erro ao salvar dispositivos no localStorage:', error);
      throw error;
    }
  }

  // Carregar dispositivos do localStorage
  async loadDevices(serviceOrderId: string): Promise<SavedDevice[]> {
    try {
      // Tentar carregar do armazenamento específico da ordem
      const key = `devices_${serviceOrderId}`;
      const data = localStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data);
      }
      
      // Se não encontrar, tentar buscar da ordem de serviço
      const serviceOrders = storageService.getServiceOrders();
      const order = serviceOrders.find(o => o.id === serviceOrderId);
      
      if (order && order.devices) {
        return order.devices;
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao carregar dispositivos do localStorage:', error);
      return [];
    }
  }

  // Salvar estado da atividade no localStorage apenas
  async saveActivityState(serviceOrderId: string, state: ActivityState): Promise<void> {
    try {
      // Salvar apenas no localStorage
      const key = `activityState_${serviceOrderId}`;
      const stateToSave = {
        ...state,
        localStartTime: state.localStartTime?.toISOString()
      };
      localStorage.setItem(key, JSON.stringify(stateToSave));
      console.log('Estado da atividade salvo no localStorage:', state);
    } catch (error) {
      console.error('Erro ao salvar estado da atividade no localStorage:', error);
      throw error;
    }
  }

  // Carregar estado da atividade do localStorage
  async loadActivityState(serviceOrderId: string): Promise<ActivityState | null> {
    try {
      const key = `activityState_${serviceOrderId}`;
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }
      
      const parsedData = JSON.parse(data);
      
      return {
        currentServiceId: parsedData.currentServiceId,
        availablePests: parsedData.availablePests || [],
        availableServiceTypes: parsedData.availableServiceTypes || [],
        showNewPestInput: parsedData.showNewPestInput || false,
        newPest: parsedData.newPest,
        showNewServiceInput: parsedData.showNewServiceInput || false,
        newService: parsedData.newService,
        localStartTime: parsedData.localStartTime ? new Date(parsedData.localStartTime) : undefined
      };
    } catch (error) {
      console.error('Erro ao carregar estado da atividade do localStorage:', error);
      return null;
    }
  }

  // Limpar dados da atividade quando a OS for finalizada
  async cleanupActivityData(serviceOrderId: string): Promise<void> {
    try {
      // Remover todos os dados relacionados a esta ordem de serviço
      const keys = [
        `activityState_${serviceOrderId}`,
        `serviceList_${serviceOrderId}`,
        `pestCounts_${serviceOrderId}`,
        `devices_${serviceOrderId}`
      ];
      
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('Dados da atividade limpos para a OS:', serviceOrderId);
    } catch (error) {
      console.error('Erro ao limpar dados da atividade:', error);
      throw error;
    }
  }

  // Obter ordem de serviço ativa
  async getActiveServiceOrder(): Promise<any | null> {
    try {
      const serviceOrders = storageService.getServiceOrders();
      const activeOrder = serviceOrders.find(order => order.status === 'in_progress');
      
      return activeOrder || null;
    } catch (error) {
      console.error('Erro ao buscar ordem de serviço ativa:', error);
      return null;
    }
  }

  // Atualizar horário de início no localStorage
  async updateStartTime(serviceOrderId: string, startTime: Date): Promise<void> {
    try {
      const serviceOrders = storageService.getServiceOrders();
      const updatedOrders = serviceOrders.map(order => {
        if (order.id === serviceOrderId) {
          return { ...order, start_time: startTime.toISOString() };
        }
        return order;
      });
      
      storageService.saveServiceOrders(updatedOrders);
      console.log('Horário de início atualizado no localStorage:', startTime);
    } catch (error) {
      console.error('Erro ao atualizar horário de início no localStorage:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService();