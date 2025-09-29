// Removido: import do supabase
import { DevicePestCount } from '../types/pest.types';

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
  // Salvar contagens de pragas no Supabase
  async savePestCounts(serviceOrderId: string, counts: DevicePestCount[]): Promise<void> {
    try {
      // Primeiro, deletar contagens existentes para esta ordem
      await supabase
        .from('device_pest_counts')
        .delete()
        .eq('service_order_id', serviceOrderId);

      // Inserir novas contagens
      const pestCountsData = [];
      for (const deviceCount of counts) {
        for (const pest of deviceCount.pests) {
          pestCountsData.push({
            service_order_id: serviceOrderId,
            device_type: deviceCount.deviceType,
            device_number: deviceCount.deviceNumber,
            pest_name: pest.name,
            pest_count: pest.count
          });
        }
      }

      if (pestCountsData.length > 0) {
        const { error } = await supabase
          .from('device_pest_counts')
          .insert(pestCountsData);

        if (error) {
          throw error;
        }
      }

      // Também atualizar o campo pest_counts na tabela service_orders para compatibilidade
      await supabase
        .from('service_orders')
        .update({ pest_counts: counts })
        .eq('id', serviceOrderId);

      console.log('Contagens de pragas salvas no Supabase:', counts);
    } catch (error) {
      console.error('Erro ao salvar contagens de pragas no Supabase:', error);
      throw error;
    }
  }

  // Carregar contagens de pragas do Supabase
  async loadPestCounts(serviceOrderId: string): Promise<DevicePestCount[]> {
    try {
      const { data, error } = await supabase
        .from('device_pest_counts')
        .select('*')
        .eq('service_order_id', serviceOrderId);

      if (error) {
        throw error;
      }

      // Agrupar por dispositivo
      const deviceMap = new Map<string, DevicePestCount>();
      
      data?.forEach(item => {
        const deviceKey = `${item.device_type}-${item.device_number}`;
        
        if (!deviceMap.has(deviceKey)) {
          deviceMap.set(deviceKey, {
            deviceType: item.device_type,
            deviceNumber: item.device_number,
            pests: []
          });
        }
        
        const device = deviceMap.get(deviceKey)!;
        device.pests.push({
          name: item.pest_name,
          count: item.pest_count
        });
      });

      return Array.from(deviceMap.values());
    } catch (error) {
      console.error('Erro ao carregar contagens de pragas do Supabase:', error);
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

  // Salvar dispositivos no Supabase
  async saveDevices(serviceOrderId: string, devices: SavedDevice[]): Promise<void> {
    try {
      // Primeiro, deletar dispositivos existentes para esta ordem
      await supabase
        .from('service_order_devices')
        .delete()
        .eq('service_order_id', serviceOrderId);

      // Inserir novos dispositivos
      const devicesData = devices.map(device => ({
        service_order_id: serviceOrderId,
        device_id: device.id,
        device_type: device.type,
        device_status: device.status,
        quantity: device.quantity
      }));

      if (devicesData.length > 0) {
        const { error } = await supabase
          .from('service_order_devices')
          .insert(devicesData);

        if (error) {
          throw error;
        }
      }

      // Também atualizar o campo devices na tabela service_orders para compatibilidade
      await supabase
        .from('service_orders')
        .update({ devices: devices })
        .eq('id', serviceOrderId);

      console.log('Dispositivos salvos no Supabase:', devices);
    } catch (error) {
      console.error('Erro ao salvar dispositivos no Supabase:', error);
      throw error;
    }
  }

  // Carregar dispositivos do Supabase
  async loadDevices(serviceOrderId: string): Promise<SavedDevice[]> {
    try {
      const { data, error } = await supabase
        .from('service_order_devices')
        .select('*')
        .eq('service_order_id', serviceOrderId);

      if (error) {
        throw error;
      }

      return data?.map(item => ({
        id: item.device_id,
        type: item.device_type,
        status: item.device_status,
        quantity: item.quantity
      })) || [];
    } catch (error) {
      console.error('Erro ao carregar dispositivos do Supabase:', error);
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
      // Deletar estado da atividade
      await supabase
        .from('service_activity_state')
        .delete()
        .eq('service_order_id', serviceOrderId);

      console.log('Dados da atividade limpos para a OS:', serviceOrderId);
    } catch (error) {
      console.error('Erro ao limpar dados da atividade:', error);
      throw error;
    }
  }

  // Obter ordem de serviço ativa
  async getActiveServiceOrder(): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('status', 'in_progress')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum registro encontrado
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar ordem de serviço ativa:', error);
      return null;
    }
  }

  // Atualizar horário de início no Supabase
  async updateStartTime(serviceOrderId: string, startTime: Date): Promise<void> {
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({ start_time: startTime.toISOString() })
        .eq('id', serviceOrderId);

      if (error) {
        throw error;
      }

      console.log('Horário de início atualizado no Supabase:', startTime);
    } catch (error) {
      console.error('Erro ao atualizar horário de início no Supabase:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService();