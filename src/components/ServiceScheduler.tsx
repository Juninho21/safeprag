import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from './Calendar';
import { ScheduleList } from './ScheduleList';
import { Schedule } from '../types/schedule';
import { schedulingService } from '../services/schedulingService';
import { Plus } from 'lucide-react';
// import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { getClients, Client } from '../services/clientStorage';

import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SystemMessageBox } from './SystemMessageBox';

const SERVICE_TYPES = [
  'Contrato',
  'Emergencial',
  'Avulso',
];





const TIME_SLOTS = [
  '00:00',
  '00:30',
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
  '23:00',
  '23:30'
];

interface ServiceSchedulerProps {
  onTabChange: (tab: string) => void;
  onOSStart: () => void;
}



export const ServiceScheduler: React.FC<ServiceSchedulerProps> = ({ onOSStart }) => {
  const { role, subscription, user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [schedule, setSchedule] = useState<Partial<Schedule>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '06:00',
    endTime: '17:00',
    serviceType: '',
    status: 'pending'
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageConfig, setMessageConfig] = useState<{ title?: string; message: string; variant?: 'warning' | 'error' | 'info'; primaryLabel?: string; onPrimary?: () => void; secondaryLabel?: string; onSecondary?: () => void } | null>(null);

  // Carrega os agendamentos
  const loadSchedules = useCallback(async () => {
    console.log('Carregando agendamentos...');


    try {
      // Carrega agendamentos usando o serviço do Supabase
      const allSchedules = await schedulingService.getSchedules();
      console.log('Agendamentos carregados:', allSchedules);

      // Filtrar por data selecionada
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Data formatada:', formattedDate);


      const dateSchedules = allSchedules.filter(
        (schedule: Schedule) => schedule.date === formattedDate
      );
      console.log('Agendamentos filtrados por data:', dateSchedules);


      const sortedSchedules = dateSchedules.sort((a: Schedule, b: Schedule) => {
        // Coloca os agendamentos concluídos por último
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        // Ordena por horário
        return a.startTime.localeCompare(b.startTime);
      });

      console.log('Agendamentos ordenados:', sortedSchedules);
      setSchedules(sortedSchedules);


    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setSchedules([]);
    }
  }, [selectedDate]);

  // Função para atualizar agendamentos
  const handleScheduleUpdate = useCallback(() => {
    console.log('Atualizando lista de agendamentos...');
    loadSchedules();
  }, [loadSchedules]);

  // Carrega os clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = getClients();
        setClients(clientsData);
        console.log('Clientes carregados:', clientsData.length);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setClients([]);
      }
    };
    fetchClients();
  }, []);

  // Carrega os agendamentos iniciais
  useEffect(() => {
    console.log('Efeito de carregamento inicial dos agendamentos');
    loadSchedules();
  }, [loadSchedules]);

  // Atualiza os agendamentos quando retornar para esta tela
  useEffect(() => {
    console.log('Configurando event listeners');


    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tela visível, recarregando agendamentos...');
        loadSchedules();
      }
    };

    // Removido: não usa mais localStorage

    const handleScheduleUpdate = (event: CustomEvent) => {
      console.log('ServiceScheduler recebeu evento scheduleUpdate:', event.detail);
      const { scheduleId, status, schedule } = event.detail;


      // Atualiza o estado local se o agendamento estiver na lista atual
      setSchedules(prevSchedules => {
        console.log('Agendamentos atuais:', prevSchedules.map(s => ({ id: s.id, status: s.status })));
        console.log('Procurando agendamento com ID:', scheduleId);


        const scheduleIndex = prevSchedules.findIndex(s => s.id === scheduleId);
        if (scheduleIndex === -1) {
          console.log('❌ Agendamento não encontrado na lista atual');
          return prevSchedules;
        }

        console.log('✅ Agendamento encontrado no índice:', scheduleIndex);
        const newSchedules = [...prevSchedules];
        newSchedules[scheduleIndex] = {
          ...newSchedules[scheduleIndex],
          ...schedule,
          status
        };

        console.log('✅ Agendamentos atualizados localmente:', newSchedules.map(s => ({ id: s.id, status: s.status })));
        return newSchedules;
      });

      // Força uma atualização dos dados do localStorage
      loadSchedules();
    };

    const handleServiceOrderUpdate = (event: CustomEvent) => {
      console.log('ServiceScheduler recebeu evento serviceOrderUpdate:', event.detail);
      const { scheduleId, status } = event.detail;
      if (scheduleId && status) {
        // Atualiza o estado local se o agendamento estiver na lista atual
        setSchedules(prevSchedules => {
          const scheduleIndex = prevSchedules.findIndex(s => s.id === scheduleId);
          if (scheduleIndex === -1) return prevSchedules;

          const newSchedules = [...prevSchedules];
          newSchedules[scheduleIndex] = {
            ...newSchedules[scheduleIndex],
            status
          };

          console.log('Agendamentos atualizados localmente:', newSchedules);
          return newSchedules;
        });

        // Força uma atualização dos dados do Supabase
        loadSchedules();
      }
    };

    const handleServiceOrderFinished = (event: CustomEvent) => {
      console.log('ServiceScheduler recebeu evento serviceOrderFinished:', event.detail);
      if (event.detail?.success) {
        // Recarregar agendamentos quando um serviço é finalizado
        console.log('Recarregando agendamentos após finalização do serviço...');
        loadSchedules();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Removido listener de storage - não usa mais localStorage
    window.addEventListener('scheduleUpdate', handleScheduleUpdate as EventListener);
    window.addEventListener('serviceOrderUpdate', handleServiceOrderUpdate as EventListener);
    window.addEventListener('serviceOrderFinished', handleServiceOrderFinished as EventListener);

    // Carrega os agendamentos imediatamente
    loadSchedules();

    return () => {
      console.log('Removendo event listeners');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Removido: não usa mais localStorage
      window.removeEventListener('scheduleUpdate', handleScheduleUpdate as EventListener);
      window.removeEventListener('serviceOrderUpdate', handleServiceOrderUpdate as EventListener);
      window.removeEventListener('serviceOrderFinished', handleServiceOrderFinished as EventListener);
    };
  }, [loadSchedules]);

  useEffect(() => {
    console.log('Forçando atualização quando houver mudança de status');
    loadSchedules();
  }, [schedule.status]);

  const handleDateChange = (date: Date) => {
    console.log('Data selecionada mudou para:', date);
    setSelectedDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    setSchedule(prev => ({ ...prev, date: formattedDate }));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setSchedule(prev => ({
        ...prev,
        clientId: client.id,
        client_address: `${client.address}, ${client.city} - ${client.state}`
      }));
    }
  };

  const canManageSchedules = useCallback(() => {
    // Debug log
    console.log('[ServiceScheduler] Permission Check:', {
      email: user?.email,
      role,
      subscriptionStatus: subscription?.status,
      isPrivileged: role === 'owner' || role === 'superuser' || role === 'suporte',
      isActiveSub: subscription?.status === 'active'
    });

    // Superusuários sempre podem
    if (role === 'owner' || role === 'superuser' || role === 'suporte') {
      return true;
    }

    // Outros precisam de assinatura ativa
    return subscription?.status === 'active';
  }, [role, subscription, user]);

  const handleEditSchedule = (scheduleToEdit: Schedule) => {
    if (!canManageSchedules()) {
      setMessageConfig({
        title: 'Acesso Restrito',
        message: 'Sua assinatura não está ativa. Não é possível editar agendamentos.',
        variant: 'error',
        primaryLabel: 'Ok',
        onPrimary: () => setMessageOpen(false)
      });
      setMessageOpen(true);
      return;
    }

    // Carrega os dados do agendamento no formulário
    setSchedule(scheduleToEdit);


    // Encontra e seleciona o cliente
    const client = clients.find(c => c.id === scheduleToEdit.clientId);
    if (client) {
      setSelectedClient(client);
    }


    // Abre o modal
    setShowForm(true);
  };

  const handleDeleteSchedule = async (scheduleToDelete: Schedule) => {
    if (!canManageSchedules()) {
      setMessageConfig({
        title: 'Acesso Restrito',
        message: 'Sua assinatura não está ativa. Não é possível excluir agendamentos.',
        variant: 'error',
        primaryLabel: 'Ok',
        onPrimary: () => setMessageOpen(false)
      });
      setMessageOpen(true);
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        // Excluir o agendamento usando o serviço
        const success = schedulingService.deleteSchedule(scheduleToDelete.id);

        if (success) {
          // Recarrega a lista de agendamentos
          loadSchedules();


          // toast.success('Agendamento excluído com sucesso!');
          console.log('Agendamento excluído com sucesso!');
        } else {
          console.error('Falha ao excluir agendamento');
        }
      } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        return;
      }
    }
  };

  const handleNewScheduleClick = () => {
    if (canManageSchedules()) {
      setSelectedClient(null);
      setSchedule({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '06:00',
        endTime: '17:00',
        serviceType: '',
        status: 'pending'
      });
      setShowForm(true);
      return;
    }

    // Se chegou aqui, não tem assinatura ativa e não é superuser
    if (role === 'admin') {
      setMessageConfig({
        title: 'Assinatura Necessária',
        message: 'Você precisa de uma assinatura ativa para criar agendamentos. Deseja ver os planos disponíveis?',
        variant: 'warning',
        primaryLabel: 'Ver Planos',
        onPrimary: () => {
          setMessageOpen(false);
          navigate('/configuracoes/assinaturas');
        },
        secondaryLabel: 'Cancelar',
        onSecondary: () => setMessageOpen(false)
      });
      setMessageOpen(true);
    } else {
      // Controladores e outros papéis
      setMessageConfig({
        title: 'Acesso Restrito',
        message: 'Sua empresa precisa de uma assinatura ativa para criar agendamentos. Por favor, entre em contato com o administrador do sistema.',
        variant: 'warning',
        primaryLabel: 'Entendi',
        onPrimary: () => setMessageOpen(false)
      });
      setMessageOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (!selectedClient) {
      // toast.error('Por favor, selecione um cliente');
      console.error('Por favor, selecione um cliente');
      return;
    }

    if (!schedule.serviceType) {
      // toast.error('Por favor, selecione o tipo de serviço');
      console.error('Por favor, selecione o tipo de serviço');
      return;
    }

    if (!schedule.startTime || !schedule.endTime) {
      // toast.error('Por favor, selecione os horários de início e fim');
      console.error('Por favor, selecione os horários de início e fim');
      return;
    }

    // Validar se horário de fim é depois do início
    if (schedule.startTime >= schedule.endTime) {
      // toast.error('O horário de fim deve ser depois do horário de início');
      console.error('O horário de fim deve ser depois do horário de início');
      return;
    }

    // Se já existe um ID, é uma edição
    const isEditing = Boolean(schedule.id);


    const scheduleData: Schedule = {
      id: schedule.id || uuidv4(),
      clientId: selectedClient.id!,
      clientName: selectedClient.name,
      clientAddress: `${selectedClient.address}, ${selectedClient.city} - ${selectedClient.state}`,
      clientPhone: selectedClient.phone,
      date: schedule.date!,
      startTime: schedule.startTime as string,
      endTime: schedule.endTime as string,
      serviceType: schedule.serviceType!,
      status: (schedule.status as 'pending' | 'in_progress' | 'completed' | 'cancelled') || 'pending'
    };

    // Verifica conflitos de horário usando os agendamentos já carregados
    try {
      const allSchedules = await schedulingService.getSchedules();
      const existingSchedules = allSchedules.filter(s => s.date === schedule.date);

      // Verifica se já existe agendamento no mesmo horário
      const hasConflict = existingSchedules.some((existingSchedule: Schedule) => {
        // Ignora o próprio agendamento em caso de edição
        if (isEditing && existingSchedule.id === schedule.id) {
          return false;
        }

        // Verifica se há sobreposição de horários
        const newStart = schedule.startTime!;
        const newEnd = schedule.endTime!;
        const existingStart = existingSchedule.startTime;
        const existingEnd = existingSchedule.endTime || existingSchedule.startTime; // Fallback se não tiver end_time

        return (
          (newStart >= existingStart && newStart < existingEnd) || // Novo início durante agendamento existente
          (newEnd > existingStart && newEnd <= existingEnd) || // Novo fim durante agendamento existente
          (newStart <= existingStart && newEnd >= existingEnd) // Novo agendamento engloba existente
        );
      });

      if (hasConflict) {
        // toast.error('Já existe um agendamento neste horário');
        // toast.error('Já existe um agendamento neste horário');
        console.error('Já existe um agendamento neste horário');

        return;
      }
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      // toast.error('Erro ao verificar conflitos de horário');
      console.error('Erro ao verificar conflitos de horário');
      return;
    }

    // Verificação de segurança adicional usando a helper
    if (!canManageSchedules()) {
      console.error('Tentativa de criar/editar agendamento sem permissão');
      setMessageConfig({
        title: 'Acesso Negado',
        message: 'Sua assinatura expirou ou você não tem permissão para realizar esta ação.',
        variant: 'error',
        primaryLabel: 'Ok',
        onPrimary: () => setMessageOpen(false)
      });
      setMessageOpen(true);
      return;
    }

    // Salvar usando o serviço do Supabase
    try {
      await schedulingService.createSchedule(scheduleData);
      console.log('Agendamento salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      return;
    }

    // Limpa o formulário
    setSelectedClient(null);
    setSchedule({
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '06:00',
      endTime: '17:00',
      serviceType: '',
      status: 'pending'
    });

    // Fecha o modal e recarrega os agendamentos
    setShowForm(false);
    loadSchedules();

    console.log(isEditing ? 'Agendamento atualizado com sucesso!' : 'Agendamento salvo com sucesso!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4">Agenda</h1>
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleNewScheduleClick}

            className="min-w-[160px] bg-[#00A651] hover:bg-[#008c44] text-white font-semibold py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-8">
            <Calendar onDateSelect={handleDateChange} selectedDate={selectedDate} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <ScheduleList
            schedules={schedules}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onScheduleClick={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onScheduleUpdate={handleScheduleUpdate}
            onOSStart={onOSStart}
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {schedule.clientName ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de seleção de cliente */}
              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  id="client"
                  name="client"
                  value={selectedClient?.id || ''}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.address}, {client.city} - {client.state}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Dados do Cliente</h3>
                  <p className="text-sm text-gray-900">{selectedClient.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedClient.address}, {selectedClient.city} - {selectedClient.state}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Tel: {selectedClient.phone}</p>
                  <p className="text-sm text-gray-600 mt-1">Contato: {selectedClient.contact}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Serviço
                </label>
                <select
                  value={schedule.serviceType}
                  onChange={(e) => setSchedule(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Selecione o serviço</option>
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={schedule.date}
                    onChange={(e) => setSchedule(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Início
                    </label>
                    <select
                      value={schedule.startTime}
                      onChange={(e) => setSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      required
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Fim
                    </label>
                    <select
                      value={schedule.endTime}
                      onChange={(e) => setSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      required
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {messageConfig && (
        <SystemMessageBox
          isOpen={messageOpen}
          onClose={() => setMessageOpen(false)}
          title={messageConfig.title}
          message={messageConfig.message}
          variant={messageConfig.variant}
          primaryAction={{ label: messageConfig.primaryLabel || 'Ok', onClick: messageConfig.onPrimary || (() => setMessageOpen(false)) }}
          secondaryAction={messageConfig.secondaryLabel && messageConfig.onSecondary ? { label: messageConfig.secondaryLabel, onClick: messageConfig.onSecondary } : undefined}
        />
      )}

    </div>
  );
};
