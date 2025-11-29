import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Schedule } from '../types/schedule';
import { Clock, MapPin, User, Pencil, Trash2, X, Play, AlertCircle, Phone, Building2, Mail } from 'lucide-react';
// import { toast } from 'react-toastify';
import { createServiceOrder, registerNoService, hasActiveSchedule, hasActiveScheduleAsync } from '../services/ordemServicoService';
import { getClients } from '../services/clientStorage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SystemMessageBox } from './SystemMessageBox';

interface ScheduleListProps {
  schedules: Schedule[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
  onDeleteSchedule: (schedule: Schedule) => void;
  onScheduleUpdate: () => void;
  onOSStart: () => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  selectedDate,
  onScheduleClick,
  onDeleteSchedule,
  onScheduleUpdate,
  onOSStart,
}) => {
  const { role, companyId } = useAuth();
  const navigate = useNavigate();
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageConfig, setMessageConfig] = useState<{ title?: string; message: string; variant?: 'warning' | 'error' | 'info'; primaryLabel?: string; onPrimary?: () => void; secondaryLabel?: string; onSecondary?: () => void } | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showNoServiceModal, setShowNoServiceModal] = useState(false);
  const [noServiceReason, setNoServiceReason] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [hasActiveOS, setHasActiveOS] = useState(false);
  const [checkingActiveOS, setCheckingActiveOS] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = getClients();
        setClients(data);
        console.log('Clientes carregados no ScheduleList:', data.length);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    }
    fetchClients();
  }, []);

  function getClientById(id: string) {
    return clients.find(c => c.id === id);
  }

  // Adiciona event listeners para atualização de agendamentos
  useEffect(() => {
    const handleScheduleUpdate = (event: CustomEvent) => {
      console.log('ScheduleList recebeu evento scheduleUpdate:', event.detail);
      const { scheduleId, status } = event.detail;

      // Se o agendamento atual estiver selecionado e for atualizado, fecha o modal
      if (selectedSchedule?.id === scheduleId) {
        if (status === 'completed' || status === 'cancelled') {
          setShowActionsModal(false);
          setShowNoServiceModal(false);
        }
        // Atualiza o agendamento selecionado
        setSelectedSchedule(prev => prev ? { ...prev, status } : null);
      }

      // Atualiza a lista de agendamentos
      onScheduleUpdate();
    };

    const handleServiceOrderUpdate = (event: CustomEvent) => {
      console.log('ScheduleList recebeu evento serviceOrderUpdate:', event.detail);
      const { scheduleId, status } = event.detail;
      if (scheduleId && status) {
        // Se o agendamento atual estiver selecionado e for atualizado, fecha o modal
        if (selectedSchedule?.id === scheduleId) {
          if (status === 'completed' || status === 'cancelled') {
            setShowActionsModal(false);
            setShowNoServiceModal(false);
          }
          // Atualiza o agendamento selecionado
          setSelectedSchedule(prev => prev ? { ...prev, status } : null);
        }

        // Atualiza a lista de agendamentos
        onScheduleUpdate();
      }
    };

    const handleServiceOrderFinish = (event: CustomEvent) => {
      console.log('Evento de atualização de OS recebido:', event.detail);
      onScheduleUpdate();
    };

    window.addEventListener('scheduleUpdate', handleScheduleUpdate as EventListener);
    window.addEventListener('serviceOrderUpdate', handleServiceOrderUpdate as EventListener);
    window.addEventListener('serviceOrderFinish', handleServiceOrderFinish as EventListener);

    return () => {
      window.removeEventListener('scheduleUpdate', handleScheduleUpdate as EventListener);
      window.removeEventListener('serviceOrderUpdate', handleServiceOrderUpdate as EventListener);
      window.removeEventListener('serviceOrderFinish', handleServiceOrderFinish as EventListener);
    };
  }, [selectedSchedule, onScheduleUpdate]);

  console.log('ScheduleList recebeu schedules:', schedules);

  const sortedSchedules = useMemo(() => {
    console.log('Ordenando agendamentos...');
    return [...schedules].sort((a, b) => {
      // Coloca os agendamentos concluídos por último
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      // Ordena por horário
      return a.startTime.localeCompare(b.startTime);
    });
  }, [schedules]);

  console.log('Agendamentos ordenados:', sortedSchedules);

  const handleDelete = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation();
    onDeleteSchedule(schedule);
  };

  const handleEdit = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation();
    onScheduleClick(schedule);
  };

  const handleCardClick = async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowActionsModal(true);

    // Verifica assincronamente se há uma OS ativa para este agendamento
    setCheckingActiveOS(true);
    try {
      const isActive = await hasActiveScheduleAsync(schedule.id);
      setHasActiveOS(isActive);
    } catch (error) {
      console.error('Erro ao verificar OS ativa:', error);
      // Fallback para verificação síncrona
      setHasActiveOS(hasActiveSchedule(schedule.id));
    } finally {
      setCheckingActiveOS(false);
    }
  };

  const handleStartOS = async () => {
    if (selectedSchedule) {
      try {
        // A limpeza automática garante que não haverá conflitos de OS ativas

        // Verifica se o agendamento já está concluído
        if (selectedSchedule.status === 'completed') {
          // toast.info('Este agendamento já foi concluído.');
          console.log('Este agendamento já foi concluído.');
          return;
        }

        // Verifica se o agendamento já está em andamento
        if (selectedSchedule.status === 'in_progress') {
          // toast.info('Este agendamento já está em andamento.');
          console.log('Este agendamento já está em andamento.');
          return;
        }

        // Buscar dados completos do cliente usando o dataService (compatível com modo offline)
        try {
          const clients = await clientService.getClients();
          const client = clients.find(c => c.id === selectedSchedule.clientId);

          if (client) {
            localStorage.setItem('selectedClient', JSON.stringify({
              id: client.id,
              name: client.name || selectedSchedule.clientName,
              address: client.address || selectedSchedule.clientAddress,
              phone: client.phone || 'N/A',
              contact: client.contact || 'N/A',
              email: client.email || 'N/A',
              cnpj: client.cnpj || 'N/A',
              city: client.city || 'N/A',
              state: client.state || 'N/A',
              code: client.code || 'N/A',
              branch: client.branch || client.name || 'N/A'
            }));
          } else {
            // Fallback para dados do agendamento
            localStorage.setItem('selectedClient', JSON.stringify({
              id: selectedSchedule.clientId,
              name: selectedSchedule.clientName,
              address: selectedSchedule.clientAddress,
              phone: 'N/A',
              contact: 'N/A',
              email: 'N/A',
              cnpj: 'N/A',
              city: 'N/A',
              state: 'N/A',
              code: 'N/A',
              branch: selectedSchedule.clientName || 'N/A'
            }));
          }
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
          // Fallback para dados do agendamento
          localStorage.setItem('selectedClient', JSON.stringify({
            id: selectedSchedule.clientId,
            name: selectedSchedule.clientName,
            address: selectedSchedule.clientAddress,
            phone: 'N/A',
            contact: 'N/A',
            email: 'N/A',
            cnpj: 'N/A',
            city: 'N/A',
            state: 'N/A',
            code: 'N/A',
            branch: selectedSchedule.clientName || 'N/A'
          }));
        }

        // Cria a ordem de serviço
        const serviceOrder = await createServiceOrder(selectedSchedule, companyId || 'default');

        // Atualiza a interface
        // toast.success('Ordem de Serviço iniciada com sucesso!');
        console.log('Ordem de Serviço iniciada com sucesso!');
        setShowActionsModal(false);

        // Atualiza os agendamentos e muda para a tela de OS
        onScheduleUpdate();
        onOSStart();
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao iniciar Ordem de Serviço';
        console.error(msg);
        // Exibir mensagem ao usuário e redirecionar para Plano Mensal quando assinatura estiver inativa
        if (typeof window !== 'undefined') {
          try { alert(msg); } catch { }
          if (msg.toLowerCase().includes('assinatura inativa')) {
            window.location.href = '/configuracoes/plano-mensal';
          }
        }
      }
    }
  };

  const handleNoService = () => {
    setShowActionsModal(false);
    setShowNoServiceModal(true);
  };

  const handleNoServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSchedule && noServiceReason) {
      try {
        await registerNoService(selectedSchedule, noServiceReason);
        // toast.info('Não atendimento registrado com sucesso');
        console.log('Não atendimento registrado com sucesso');
        setShowNoServiceModal(false);
        setNoServiceReason('');
        onScheduleUpdate(); // Atualiza a lista de agendamentos
      } catch (error) {
        // toast.error('Erro ao registrar não atendimento');
        console.error('Erro ao registrar não atendimento');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Concluído
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelado
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Em Andamento
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Pendente
          </span>
        );
    }
  };

  const handleStartOrder = async (schedule: Schedule) => {
    try {
      // A limpeza automática garante que não haverá conflitos de OS ativas

      // Verifica se o agendamento já está em andamento
      if (await hasActiveSchedule(schedule.id)) {
        // toast.error('Este agendamento já está em andamento.');
        console.error('Este agendamento já está em andamento.');
        return;
      }

      // Registra o horário de início
      const now = new Date();
      localStorage.setItem('serviceStartTime', now.toISOString());

      // Tenta criar a nova ordem de serviço
      const newOrder = await createServiceOrder(schedule, companyId || 'default');
      console.log('Nova OS criada:', newOrder);

      // Mostra mensagem de sucesso
      // toast.success('Ordem de serviço iniciada com sucesso!');
      console.log('Ordem de serviço iniciada com sucesso!');

      // Fecha o modal de ações
      setShowActionsModal(false);

      // Muda para a tela de ordens de serviço
      onOSStart();
      onScheduleUpdate(); // Atualiza a lista de agendamentos
    } catch (error) {
      console.error('Erro ao iniciar ordem de serviço:', error);
      const msg = error instanceof Error ? error.message : 'Erro ao iniciar ordem de serviço';
      console.error(msg);
      // Exibir mensagem estilizada conforme papel e opcionalmente redirecionar
      if (msg.toLowerCase().includes('assinatura inativa')) {
        const isController = role === 'controlador';
        const isAdmin = role === 'admin';
        if (isController) {
          setMessageConfig({
            title: 'Atenção',
            message: 'Não é possível iniciar ordem de serviço, entre em contato com o seu gestor!',
            variant: 'warning',
            primaryLabel: 'Entendi',
            onPrimary: () => setMessageOpen(false),
          });
          setMessageOpen(true);
        } else if (isAdmin) {
          setMessageConfig({
            title: 'Assinatura inativa',
            message: 'Assinatura inativa. Não é possível iniciar ordem de serviço, escolha um plano!',
            variant: 'error',
            primaryLabel: 'Escolher plano',
            onPrimary: () => {
              setMessageOpen(false);
              navigate('/configuracoes/plano-mensal');
            },
            secondaryLabel: 'Cancelar',
            onSecondary: () => setMessageOpen(false),
          });
          setMessageOpen(true);
        } else {
          setMessageConfig({
            title: 'Atenção',
            message: 'Assinatura inativa. Entre em contato com o administrador.',
            variant: 'warning',
            primaryLabel: 'Ok',
            onPrimary: () => setMessageOpen(false),
          });
          setMessageOpen(true);
        }
      } else {
        setMessageConfig({
          title: 'Erro',
          message: msg,
          variant: 'error',
          primaryLabel: 'Ok',
          onPrimary: () => setMessageOpen(false),
        });
        setMessageOpen(true);
      }
    }
  };

  return (
    <>
      <div className="mt-6 pb-36">
        <h2 className="text-lg font-semibold mb-4">
          Agendamentos para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </h2>

        <div className="space-y-4">
          {sortedSchedules.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">Nenhum agendamento para esta data.</p>
            </div>
          ) : (
            sortedSchedules.map((schedule) => {
              const client = getClientById(schedule.client_id || schedule.clientId);
              return (
                <div
                  key={schedule.id}
                  onClick={() => handleCardClick(schedule)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        {getStatusBadge(schedule.status)}
                      </div>

                      <div className="flex items-start space-x-2 mb-2">
                        <Building2 className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          {client?.code && (
                            <span className="block text-xs text-blue-600 mb-0.5">Código: {client.code}</span>
                          )}
                          <span className="text-sm font-semibold text-gray-900">
                            {client ? (client.name || schedule.clientName) : (schedule.clientName || 'Cliente não encontrado')}
                          </span>
                        </div>
                      </div>

                      {client && client.contact && (
                        <div className="flex items-start space-x-2 mb-2">
                          <User className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-500">
                              Contato: {client.contact}
                            </span>
                          </div>
                        </div>
                      )}

                      {client && client.phone && (
                        <div className="flex items-start space-x-2 mb-2">
                          <Phone className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-500">
                              Tel: {client.phone}
                            </span>
                          </div>
                        </div>
                      )}

                      {client && client.email && (
                        <div className="flex items-start space-x-2 mb-2">
                          <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-500">
                              Email: {client.email}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {schedule.client_address || schedule.clientAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleEdit(e, schedule)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, schedule)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal de Ações */}
        {showActionsModal && selectedSchedule && (
          (() => {
            const client = getClientById(selectedSchedule.client_id || selectedSchedule.clientId);
            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ações do Agendamento
                    </h3>
                    <button
                      onClick={() => setShowActionsModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Informações do Cliente */}
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Dados do Cliente</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <div>
                          {client?.code && (
                            <span className="block text-xs text-blue-600">Código: {client.code}</span>
                          )}
                          <span className="text-sm font-semibold text-gray-900">
                            {client ? (client.name || selectedSchedule.clientName) : (selectedSchedule.clientName || 'Cliente não encontrado')}
                          </span>
                        </div>
                      </div>
                      {client && client.contact && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">Contato: {client.contact}</span>
                        </div>
                      )}
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {selectedSchedule.client_address || selectedSchedule.clientAddress}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          {client && client.phone ? client.phone : 'Não informado'}
                        </span>
                      </div>
                      {client && client.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">{client.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          Horário: {selectedSchedule.startTime} - {selectedSchedule.endTime}
                        </span>
                      </div>
                      <div className="mt-2">
                        {getStatusBadge(selectedSchedule.status)}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-3">
                    {selectedSchedule.status !== 'completed' && selectedSchedule.status !== 'cancelled' && (
                      <>
                        {checkingActiveOS ? (
                          <button
                            disabled
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Verificando...
                          </button>
                        ) : (hasActiveOS || selectedSchedule.status === 'in_progress') ? (
                          <button
                            onClick={() => {
                              setShowActionsModal(false);
                              onOSStart(); // Direciona para a página de atividade
                            }}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Continuar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartOrder(selectedSchedule)}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar OS
                          </button>
                        )}

                        <button
                          onClick={handleNoService}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Registrar Não Atendimento
                        </button>
                      </>
                    )}

                    {selectedSchedule.status === 'completed' && (
                      <div className="text-center text-sm text-gray-600">
                        Este agendamento já foi concluído.
                      </div>
                    )}

                    {selectedSchedule.status === 'cancelled' && (
                      <div className="text-center text-sm text-gray-600">
                        Este agendamento foi cancelado.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Modal de Não Atendimento */}
        {showNoServiceModal && selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Registrar Não Atendimento
                </h3>
                <button
                  onClick={() => {
                    setShowNoServiceModal(false);
                    setNoServiceReason('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleNoServiceSubmit}>
                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo do Não Atendimento
                  </label>
                  <textarea
                    id="reason"
                    rows={4}
                    value={noServiceReason}
                    onChange={(e) => setNoServiceReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descreva o motivo do não atendimento..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoServiceModal(false);
                      setNoServiceReason('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
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
    </>
  );
};
