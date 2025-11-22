import { v4 as uuidv4 } from 'uuid';
import { Schedule } from '../types/schedule';
import { ServiceOrder } from '../types/serviceOrder';
import { STORAGE_KEYS } from './storageKeys';

// ============================================
// FUNÇÕES PRINCIPAIS - MODO OFFLINE
// ============================================

/**
 * Verifica se um agendamento específico já está em andamento (localStorage)
 */
export const hasActiveSchedule = async (scheduleId: string): Promise<boolean> => {
  console.log('Verificando se o agendamento está em andamento:', scheduleId);
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) return false;

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    const hasActive = orders.some(order =>
      order.scheduleId === scheduleId && order.status === 'in_progress'
    );

    console.log('Agendamento em andamento:', hasActive);
    return hasActive;
  } catch (error) {
    console.error('Erro ao verificar agendamento em andamento:', error);
    return false;
  }
};

/**
 * Verifica se um agendamento específico já está em andamento (versão assíncrona)
 */
export const hasActiveScheduleAsync = async (scheduleId: string): Promise<boolean> => {
  return hasActiveSchedule(scheduleId);
};

/**
 * Obtém todas as ordens de serviço do localStorage
 */
export const getAllServiceOrders = async (): Promise<ServiceOrder[]> => {
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) return [];

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    return orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Erro ao obter ordens de serviço:', error);
    return [];
  }
};

/**
 * Obtém ordens de serviço para um agendamento específico
 */
export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  return getAllServiceOrders();
};

/**
 * Obtém a ordem de serviço ativa do usuário atual
 */
export const getActiveServiceOrder = async (): Promise<ServiceOrder | null> => {
  try {
    const orders = await getAllServiceOrders();
    const activeOrder = orders.find(order => order.status === 'in_progress');
    return activeOrder || null;
  } catch (error) {
    console.error('Erro ao obter ordem de serviço ativa:', error);
    return null;
  }
};

/**
 * Obtém todas as ordens de serviço finalizadas
 */
export const getFinishedServiceOrders = async (): Promise<ServiceOrder[]> => {
  try {
    const orders = await getAllServiceOrders();
    return orders.filter(order => order.status === 'completed');
  } catch (error) {
    console.error('Erro ao obter ordens finalizadas:', error);
    return [];
  }
};

// ============================================
// CRIAÇÃO E GERENCIAMENTO DE ORDENS DE SERVIÇO
// ============================================

/**
 * Cria uma nova Ordem de Serviço
 */
export async function createServiceOrder(schedule: Schedule, companyId: string): Promise<ServiceOrder> {
  try {
    console.log('🔵 Criando nova ordem de serviço...', { schedule, companyId });

    // Verificação de assinatura ativa antes de permitir criação de OS
    try {
      const { billingService } = await import('./billingService');
      const status = await billingService.getStatus(companyId);
      if (!status?.active) {
        throw new Error('Assinatura inativa. Não é possível iniciar ordem de serviço.');
      }
    } catch (billingError: any) {
      const msg = billingError?.message || 'Falha ao validar assinatura. Não é possível iniciar ordem de serviço.';
      console.error('[Billing] Bloqueio na criação de OS:', msg);
      throw new Error(msg);
    }

    // Verificar se já existe uma OS ativa para este agendamento
    const existingOrders = await getAllServiceOrders();
    const activeOrder = existingOrders.find(order =>
      order.scheduleId === schedule.id && order.status === 'in_progress'
    );

    if (activeOrder) {
      console.log('📱 Ordem de serviço já existe para este agendamento:', activeOrder.id);
      return activeOrder;
    }

    // Cria a nova OS
    const now = new Date();
    const formattedStartTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const newOrder: ServiceOrder = {
      id: uuidv4(),
      scheduleId: schedule.id,
      clientId: schedule.clientId,
      clientName: schedule.clientName,
      clientAddress: schedule.clientAddress || '',
      serviceType: 'Serviço de Controle de Pragas',
      date: schedule.date,
      startTime: formattedStartTime,
      endTime: '',
      status: 'in_progress',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      observations: '',
      devices: [],
      pestCounts: []
    };

    // Salva no localStorage
    existingOrders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(existingOrders));

    // Atualiza o status do agendamento
    try {
      const { schedulingService } = await import('./schedulingService');
      await schedulingService.updateScheduleStatus(schedule.id, 'in_progress');
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
    }

    // Salva horário de início
    localStorage.setItem('serviceStartTime', now.toISOString());

    // Limpa dados temporários
    localStorage.removeItem('pestCounts');
    localStorage.removeItem('retroactive_service_data');
    localStorage.removeItem(STORAGE_KEYS.PEST_COUNTS);

    console.log('✅ Nova ordem de serviço criada:', newOrder.id);
    return newOrder;
  } catch (error) {
    console.error('❌ Erro ao criar ordem de serviço:', error);
    throw error;
  }
}

/**
 * Registra não atendimento para um agendamento
 */
export async function registerNoService(schedule: Schedule, reason: string): Promise<ServiceOrder> {
  try {
    const now = new Date();

    const noServiceOrder: ServiceOrder = {
      id: uuidv4(),
      scheduleId: schedule.id,
      clientId: schedule.clientId,
      clientName: schedule.clientName,
      clientAddress: schedule.clientAddress || '',
      serviceType: 'Não Atendimento',
      date: schedule.date,
      startTime: now.toLocaleTimeString('pt-BR'),
      endTime: now.toLocaleTimeString('pt-BR'),
      status: 'cancelled',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      observations: `Não atendido. Motivo: ${reason}`,
      devices: [],
      pestCounts: []
    };

    // Salva no localStorage
    const existingOrders = await getAllServiceOrders();
    existingOrders.push(noServiceOrder);
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(existingOrders));

    // Atualiza status do agendamento
    try {
      const { schedulingService } = await import('./schedulingService');
      await schedulingService.updateScheduleStatus(schedule.id, 'cancelled');
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
    }

    console.log('✅ Não atendimento registrado:', noServiceOrder.id);
    return noServiceOrder;
  } catch (error) {
    console.error('❌ Erro ao registrar não atendimento:', error);
    throw error;
  }
}

/**
 * Finaliza uma ordem de serviço
 */
export async function finishServiceOrder(orderId: string): Promise<void> {
  try {
    console.log('🔵 Finalizando ordem de serviço:', orderId);

    // Busca a ordem de serviço no localStorage
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) {
      throw new Error('Nenhuma ordem de serviço encontrada');
    }

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Ordem de serviço não encontrada');
    }

    const order = orders[orderIndex];

    // Atualiza o status da OS
    const now = new Date();
    orders[orderIndex] = {
      ...order,
      status: 'completed',
      endTime: now.toLocaleTimeString('pt-BR'),
      updatedAt: now.toISOString()
    };

    // Salva no localStorage
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));
    console.log('💾 Ordem de serviço atualizada no localStorage:', orderId);

    // Atualiza o agendamento
    if (order.scheduleId) {
      try {
        const { schedulingService } = await import('./schedulingService');
        await schedulingService.updateScheduleStatus(order.scheduleId, 'completed');

        // Dispara evento de atualização
        const updateEvent = new CustomEvent('scheduleUpdate', {
          detail: {
            scheduleId: order.scheduleId,
            status: 'completed',
            timestamp: now.toISOString()
          }
        });
        window.dispatchEvent(updateEvent);
      } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
      }
    }

    // Gera e compartilha o PDF
    try {
      const { generateAndShareServiceOrderPDF } = await import('./pdfService');
      // await generateAndShareServiceOrderPDF(order); // TODO: Implementar quando necessário
    } catch (error) {
      console.error('Erro ao gerar/compartilhar PDF:', error);
    }

    // Limpa dados temporários
    localStorage.removeItem('serviceStartTime');
    localStorage.removeItem('pestCounts');
    localStorage.removeItem('currentServiceOrder');
    localStorage.removeItem('activeServiceOrder');
    localStorage.removeItem('retroactive_service_data');

    console.log('✅ Ordem de serviço finalizada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao finalizar ordem de serviço:', error);
    throw error;
  }
}

/**
 * Salva uma ordem de serviço
 */
export async function saveServiceOrder(order: ServiceOrder): Promise<void> {
  try {
    const existingOrders = await getAllServiceOrders();
    const orderIndex = existingOrders.findIndex(o => o.id === order.id);

    if (orderIndex >= 0) {
      // Atualiza ordem existente
      existingOrders[orderIndex] = {
        ...order,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Adiciona nova ordem
      existingOrders.push({
        ...order,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(existingOrders));
    console.log('✅ Ordem de serviço salva:', order.id);
  } catch (error) {
    console.error('❌ Erro ao salvar ordem de serviço:', error);
    throw error;
  }
}

/**
 * Aprova uma ordem de serviço
 */
export async function approveServiceOrder(orderId: string): Promise<void> {
  try {
    const orders = await getAllServiceOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex >= 0) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: 'approved',
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));
      console.log('✅ Ordem de serviço aprovada:', orderId);
    } else {
      console.error('❌ Ordem de serviço não encontrada:', orderId);
    }
  } catch (error) {
    console.error('❌ Erro ao aprovar ordem de serviço:', error);
    throw error;
  }
}

// ============================================
// FUNÇÕES DE LIMPEZA E MANUTENÇÃO
// ============================================

/**
 * Finaliza todas as ordens de serviço ativas
 */
export async function finishAllActiveServiceOrders(): Promise<void> {
  try {
    const orders = await getAllServiceOrders();
    const activeOrders = orders.filter(o => o.status === 'in_progress');

    for (const order of activeOrders) {
      await finishServiceOrder(order.id);
    }

    console.log(`✅ ${activeOrders.length} ordens de serviço finalizadas`);
  } catch (error) {
    console.error('❌ Erro ao finalizar ordens ativas:', error);
  }
}

/**
 * Força limpeza de ordens ativas (administrativa)
 */
export async function forceCleanupActiveOrders(): Promise<void> {
  try {
    const orders = await getAllServiceOrders();
    const now = new Date();

    const updatedOrders = orders.map(order => {
      if (order.status === 'in_progress') {
        return {
          ...order,
          status: 'cancelled' as const,
          endTime: now.toLocaleTimeString('pt-BR'),
          updatedAt: now.toISOString(),
          observations: (order.observations || '') + ' [Cancelada automaticamente]'
        };
      }
      return order;
    });

    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(updatedOrders));

    // Limpa dados temporários
    localStorage.removeItem('pestCounts');
    localStorage.removeItem('retroactive_service_data');
    localStorage.removeItem('serviceStartTime');
    localStorage.removeItem(STORAGE_KEYS.PEST_COUNTS);

    console.log('✅ Limpeza de ordens ativas concluída');
  } catch (error) {
    console.error('❌ Erro ao limpar ordens ativas:', error);
  }
}

/**
 * Atualiza status do agendamento
 */
export async function updateScheduleStatus(
  scheduleId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
): Promise<void> {
  try {
    const { schedulingService } = await import('./schedulingService');
    await schedulingService.updateScheduleStatus(scheduleId, status);

    // Atualiza localStorage também
    const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (storedSchedules) {
      const schedules = JSON.parse(storedSchedules);
      const scheduleIndex = schedules.findIndex((s: any) => s.id === scheduleId);

      if (scheduleIndex >= 0) {
        schedules[scheduleIndex].status = status;
        schedules[scheduleIndex].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
        console.log('📱 Status atualizado no localStorage:', scheduleId, status);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status do agendamento:', error);
  }
}

/**
 * Limpa todos os dados do sistema
 */
export function cleanupSystemData(): void {
  try {
    // Limpa todo o localStorage
    localStorage.clear();

    // Tenta limpar o IndexedDB (usado pelo Firebase)
    function clearIndexedDB() {
      if (window.indexedDB) {
        window.indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
    }

    clearIndexedDB();

    // Limpa Cache API
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    console.log('✅ Todos os dados do sistema foram limpos');
  } catch (error) {
    console.error('❌ Erro ao limpar dados do sistema:', error);
  }
}

// ============================================
// EXPORTAÇÃO DO SERVIÇO
// ============================================

export const ordemServicoService = {
  hasActiveSchedule,
  hasActiveScheduleAsync,
  getActiveServiceOrder,
  getAllServiceOrders,
  getFinishedServiceOrders,
  createServiceOrder,
  registerNoService,
  finishServiceOrder,
  finishAllActiveServiceOrders,
  saveServiceOrder,
  approveServiceOrder,
  forceCleanupActiveOrders,
  updateScheduleStatus,
  cleanupSystemData
};
