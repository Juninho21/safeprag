import { Client, SchedulingFilters } from '../types/scheduling';
import { Schedule } from '../types/schedule';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from './storageKeys';

export const schedulingService = {
  async createSchedule(scheduleData: Schedule) {
    try {
      const now = new Date().toISOString();
      
      // Buscar agendamentos existentes
      const existingSchedules = this.getSchedules();
      
      // Criar novo agendamento
      const newSchedule: Schedule = {
        ...scheduleData,
        id: scheduleData.id || uuidv4(),
        createdAt: now,
        updatedAt: now
      };
      
      // Adicionar à lista
      existingSchedules.push(newSchedule);
      
      // Salvar no localStorage
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(existingSchedules));
      
      console.log('Agendamento salvo no localStorage:', newSchedule);
      return newSchedule.id;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  async updateScheduleStatus(scheduleId: string, status: Schedule['status'], startTime?: string) {
    try {
      console.log('🔄 Iniciando atualização do status do agendamento:', { scheduleId, status });
      
      // Buscar agendamentos existentes
      const schedules = this.getSchedules();
      console.log('📋 Agendamentos encontrados:', schedules.length);
      
      // Encontrar e atualizar o agendamento
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
      console.log('🔍 Índice do agendamento encontrado:', scheduleIndex);
      
      if (scheduleIndex !== -1) {
        const oldSchedule = schedules[scheduleIndex];
        console.log('📝 Agendamento antes da atualização:', oldSchedule);
        
        const updatedSchedule = {
          ...schedules[scheduleIndex],
          status: status as Schedule['status'],
          updatedAt: new Date().toISOString()
        };
        
        schedules[scheduleIndex] = updatedSchedule;
        console.log('📝 Agendamento após atualização:', updatedSchedule);
        
        // Salvar no localStorage
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
        console.log('💾 Status do agendamento salvo no localStorage:', scheduleId, status);
        
        // Disparar evento de atualização
        const event = new CustomEvent('scheduleUpdate', {
          detail: {
            scheduleId,
            status,
            schedule: updatedSchedule,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
        console.log('✅ Evento scheduleUpdate disparado:', { scheduleId, status, updatedSchedule });
      } else {
        console.log('❌ Agendamento não encontrado com ID:', scheduleId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar status do agendamento:', error);
      throw error;
    }
  },

  getSchedules(filters?: SchedulingFilters): Schedule[] {
    try {
      // Buscar agendamentos do localStorage
      const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      let schedules: Schedule[] = storedSchedules ? JSON.parse(storedSchedules) : [];

      console.log('Agendamentos carregados do localStorage:', schedules);

      return this.applyFilters(schedules, filters);
    } catch (error) {
      console.error('Error getting schedules:', error);
      return [];
    }
  },

  deleteSchedule(scheduleId: string): boolean {
    try {
      // Buscar agendamentos existentes
      const schedules = this.getSchedules();
      
      // Filtrar o agendamento a ser excluído
      const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
      
      // Salvar no localStorage
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updatedSchedules));
      
      console.log('Agendamento excluído do localStorage:', scheduleId);
      return true;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return false;
    }
  },

  applyFilters(schedules: Schedule[], filters?: SchedulingFilters): Schedule[] {
    if (!filters) return schedules;

    return schedules.filter(schedule => {
      let match = true;

      if (filters.status && schedule.status !== filters.status) {
        match = false;
      }

      if (filters.startDate && new Date(schedule.date) < new Date(filters.startDate)) {
         match = false;
       }

       if (filters.endDate && new Date(schedule.date) > new Date(filters.endDate)) {
         match = false;
       }

       return match;
     }).sort((a, b) => a.date.localeCompare(b.date));
   }
};
