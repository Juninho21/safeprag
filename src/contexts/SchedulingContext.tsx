import React, { createContext, useContext, useState, useCallback } from 'react';
import { Client, SchedulingFilters } from '../types/scheduling';
import { Schedule } from '../types/schedule';
import { schedulingService } from '../services/schedulingService';
// import { toast } from 'react-toastify'; // Removido

interface SchedulingContextData {
  clients: Client[];
  filters: SchedulingFilters;
  loading: boolean;
  setFilters: (filters: SchedulingFilters) => void;
  loadSchedules: () => Promise<void>;
  updateScheduleStatus: (scheduleId: string, status: Schedule['status']) => Promise<void>;
}

const SchedulingContext = createContext<SchedulingContextData>({} as SchedulingContextData);

export function SchedulingProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState<SchedulingFilters>({});
  const [loading, setLoading] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await schedulingService.getSchedules(filters);
      setClients(data);
    } catch (error) {
      // toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateScheduleStatus = useCallback(async (scheduleId: string, status: Schedule['status']) => {
    try {
      await schedulingService.updateScheduleStatus(scheduleId, status);
      await loadSchedules();
    } catch (error) {
      // toast.error('Erro ao atualizar status do agendamento');
      throw error;
    }
  }, [loadSchedules]);

  return (
    <SchedulingContext.Provider 
      value={{
        clients,
        filters,
        loading,
        setFilters,
        loadSchedules,
        updateScheduleStatus,
      }}
    >
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const context = useContext(SchedulingContext);

  if (!context) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }

  return context;
}
