import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, Mail, User, FileText, Plus, X, Play, Package, Check, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// import { toast } from 'react-toastify';
import { SchedulingFilters } from '../../types/scheduling';
import { Schedule } from '../../types/schedule';
import { schedulingService } from '../../services/schedulingService';
import { hasActiveSchedule, hasActiveScheduleAsync } from '../../services/ordemServicoService';
import { NewScheduleModal } from './NewScheduleModal';
// Removido: import do supabase
import { generateServiceOrderPDF } from '../../services/pdfService';
import { activityService } from '../../services/activityService';
import { ServiceOrderPDFData } from '../../types/pdf.types';
import * as ordemServicoService from '../../services/ordemServicoService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SystemMessageBox } from '../../components/SystemMessageBox';

export function SchedulingPage() {
  const { role, companyId } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Schedule[]>([]);
  const [selectedClient, setSelectedClient] = useState<Schedule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityPageOpen, setIsActivityPageOpen] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [filters, setFilters] = useState<SchedulingFilters>({});
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [hasActiveOS, setHasActiveOS] = useState(false);
  const [checkingActiveOS, setCheckingActiveOS] = useState(false);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageConfig, setMessageConfig] = useState<{ title?: string; message: string; variant?: 'warning' | 'error' | 'info'; primaryLabel?: string; onPrimary?: () => void; secondaryLabel?: string; onSecondary?: () => void } | null>(null);

  useEffect(() => {
    loadSchedules();
  }, [filters]);

  useEffect(() => {
    if (isActivityPageOpen) {
      loadSchedules();
    }
  }, [isActivityPageOpen]);

  // Listener para atualizações de agendamento
  useEffect(() => {
    const handleScheduleUpdate = (event: CustomEvent) => {
      console.log('Evento scheduleUpdate recebido:', event.detail);
      const { scheduleId, status, schedule } = event.detail;

      console.log('Atualizando agendamento:', { scheduleId, status });

      // Atualiza o estado local
      setClients(prevClients => {
        console.log('Clientes antes da atualização:', prevClients.map(c => ({ id: c.id, status: c.status })));
        const updatedClients = prevClients.map(client =>
          client.id === scheduleId
            ? { ...client, status: status as Schedule['status'] }
            : client
        );
        console.log('Clientes após a atualização:', updatedClients.map(c => ({ id: c.id, status: c.status })));
        return updatedClients;
      });

      // Se o agendamento selecionado foi atualizado, atualiza ele também
      if (selectedClient && selectedClient.id === scheduleId) {
        console.log('Atualizando agendamento selecionado:', { selectedClientId: selectedClient.id, newStatus: status });
        setSelectedClient(prev => prev ? { ...prev, status: status as Schedule['status'] } : null);
      }
    };

    window.addEventListener('scheduleUpdate', handleScheduleUpdate as EventListener);

    return () => {
      window.removeEventListener('scheduleUpdate', handleScheduleUpdate as EventListener);
    };
  }, [selectedClient]);

  async function loadSchedules() {
    try {
      const data = await schedulingService.getSchedules(filters);
      setClients(data);

      if (isActivityPageOpen && selectedClient) {
        const updatedSelectedClient = data.find(client => client.id === selectedClient.id);
        if (updatedSelectedClient) {
          setSelectedClient(updatedSelectedClient);
        }
      }
    } catch (error) {
      // toast.error('Erro ao carregar agendamentos');
      console.error('Erro ao carregar agendamentos:', error);
    }
  }

  const handleClientClick = async (client: Schedule) => {
    setSelectedClient(client);
    setIsModalOpen(true);

    // Verifica assincronamente se há uma OS ativa para este agendamento
    setCheckingActiveOS(true);
    try {
      const isActive = await hasActiveScheduleAsync(client.id);
      setHasActiveOS(isActive);
    } catch (error) {
      console.error('Erro ao verificar OS ativa:', error);
      // Fallback para verificação síncrona
      const isActiveSync = await hasActiveSchedule(client.id);
      setHasActiveOS(isActiveSync);
    } finally {
      setCheckingActiveOS(false);
    }
  };

  const handleStartService = async () => {
    if (!selectedClient) return;

    try {
      await ordemServicoService.createServiceOrder(selectedClient, companyId || 'default');

      // 2. Atualiza o estado local para refletir o início do serviço
      const now = new Date();
      const formattedStartTime = format(now, 'HH:mm', { locale: ptBR });

      setStartTime(formattedStartTime);
      setClients(prevClients =>
        prevClients.map(c =>
          c.id === selectedClient.id
            ? { ...c, status: 'in_progress' as const, startTime: formattedStartTime }
            : c
        )
      );
      setSelectedClient(prev => prev ? {
        ...prev,
        status: 'in_progress' as const,
        startTime: formattedStartTime
      } : null);

      // 3. Abre a página de atividade
      setIsModalOpen(false);
      setIsActivityPageOpen(true);

    } catch (error: any) {
      console.error('Erro ao iniciar serviço:', error);
      const msg = error?.message ? String(error.message) : 'Erro ao iniciar serviço';
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
        return;
      }
      if (error?.message?.includes('duplicate key value violates unique constraint')) {
        console.error('Tentativa de iniciar uma segunda OS em andamento pelo mesmo usuário.');
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

  useEffect(() => {
    if (selectedClient) {
      setStartTime(selectedClient.startTime || null);
    }
  }, [selectedClient]);

  const handleFinishService = async () => {
    if (!selectedClient) return;

    console.log('Iniciando finalização do serviço para agendamento:', selectedClient);

    try {
      const now = new Date();
      const formattedEndTime = format(now, 'HH:mm', { locale: ptBR });
      setEndTime(formattedEndTime);

      const activeOrder = await activityService.getActiveServiceOrder();
      if (!activeOrder) {
        throw new Error("Nenhuma ordem de serviço ativa encontrada para finalizar.");
      }

      console.log('Ordem de serviço ativa encontrada:', activeOrder);

      const serviceList = await activityService.loadServiceList(activeOrder.id);
      const pestCounts = await activityService.loadPestCounts(activeOrder.id);
      const devices = await activityService.loadDevices(activeOrder.id);

      const pdfData: ServiceOrderPDFData = {
        orderNumber: activeOrder.id.substring(0, 8),
        date: format(new Date(), 'dd/MM/yyyy'),
        startTime: startTime || '',
        endTime: formattedEndTime,
        client: {
          name: selectedClient.clientName,
          address: selectedClient.clientAddress || '',
          city: '',
          contact: selectedClient.clientContact || '',
          phone: selectedClient.clientPhone || '',
          email: '',
          code: '',
          branch: '',
          document: ''
        },
        services: serviceList.map(item => ({
          type: item.serviceType,
          target: item.targetPest,
          product: item.product,
          location: item.location,
        })),
        devices: devices.map(d => ({
          type: d.type,
          quantity: parseInt(d.quantity || '0'),
          status: [],
          list: []
        })),
        pestCounts: pestCounts,
        observations: activeOrder.observations || '',
        signatures: {
          serviceResponsible: '',
          technicalResponsible: '',
          clientRepresentative: ''
        },
      };

      await generateServiceOrderPDF(pdfData, companyId || 'default');

      // Atualiza a OS para 'completed'
      console.log('Atualizando OS para concluído...');
      const { data: orderData, error: orderError } = await supabase
        .from('service_orders')
        .update({ status: 'completed', end_time: new Date().toISOString() })
        .eq('id', activeOrder.id);

      console.log('Resultado da atualização da OS:', { orderData, orderError });
      if (orderError) {
        throw new Error(`Erro ao atualizar a Ordem de Serviço: ${orderError.message}`);
      }

      // Atualiza o agendamento para 'completed'
      console.log('Atualizando agendamento para concluído... ID:', activeOrder.schedule_id);
      await schedulingService.updateScheduleStatus(activeOrder.schedule_id, 'completed');

      console.log('Agendamento atualizado para concluído com sucesso');

      activityService.cleanupActivityData(activeOrder.id);

      setIsActivityPageOpen(false);

      // Força recarregamento dos agendamentos para garantir sincronização
      console.log('Recarregando agendamentos...');
      await loadSchedules();

      console.log('Serviço finalizado com sucesso! O status foi atualizado automaticamente via evento.');

    } catch (error) {
      console.error('Erro ao finalizar serviço:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-36">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Agendamentos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('Testando evento manualmente...');
              const testEvent = new CustomEvent('scheduleUpdate', {
                detail: {
                  scheduleId: selectedClient?.id || 'test-id',
                  status: 'completed',
                  schedule: selectedClient,
                  timestamp: new Date().toISOString()
                }
              });
              window.dispatchEvent(testEvent);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Testar Evento
          </button>
          <button
            onClick={() => setIsNewScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="form-select"
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as Schedule['status'] }))}
            value={filters.status || ''}
          >
            <option value="">Todos os status</option>
            <option value="pending">Agendado</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluído</option>
          </select>

          <input
            type="date"
            className="form-input"
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
            value={filters.startDate || ''}
          />

          <input
            type="date"
            className="form-input"
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
            value={filters.endDate || ''}
          />
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <motion.div
            key={client.id}
            whileHover={{ scale: 1.02 }}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer
              ${client.status === 'completed' ? 'opacity-75' : ''}`}
            onClick={() => handleClientClick(client)}
          >
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold">{client.clientName}</h2>
            </div>

            <div className="space-y-2 text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{format(new Date(client.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>

              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{client.startTime} - {client.endTime}</span>
              </div>

              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{client.clientAddress}</span>
              </div>

              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                  ${client.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                    client.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}`}
                >
                  {client.status === 'pending' ? 'Agendado' :
                    client.status === 'in_progress' ? 'Em andamento' :
                      'Concluído'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {isModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-6 pb-20 max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Ações do Agendamento</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Dados do Cliente</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span>{selectedClient.clientName}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <span className="flex-1">{selectedClient.clientAddress}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span>Contato: {selectedClient.clientContact || 'Não informado'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{selectedClient.clientPhone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span>Horário: {selectedClient.startTime} - {selectedClient.endTime}</span>
                  </div>

                  {selectedClient.status === 'in_progress' && (
                    <div className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Em Andamento
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {checkingActiveOS ? (
                  <button
                    disabled
                    className="w-full px-4 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Verificando...
                  </button>
                ) : (hasActiveOS || selectedClient.status === 'in_progress') ? (
                  <button
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsActivityPageOpen(true);
                    }}
                  >
                    <Play className="w-5 h-5" />
                    Continuar
                  </button>
                ) : (
                  <button
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    onClick={handleStartService}
                    disabled={selectedClient.status !== 'pending'}
                  >
                    <Play className="w-5 h-5" />
                    Iniciar OS
                  </button>
                )}

                <button
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  onClick={() => {
                    // Implementar função de não atendimento
                    // toast.info('Funcionalidade em desenvolvimento');
                    console.log('Funcionalidade em desenvolvimento');
                  }}
                >
                  <X className="w-5 h-5" />
                  Registrar Não Atendimento
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Página de Atividade */}
      {isActivityPageOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-6 pb-20 max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
          >
            <h2 className="text-2xl font-bold mb-6">Ordem de Serviço</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Serviço *
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Selecione o tipo de serviço</option>
                  <option value="dedetizacao">Dedetização</option>
                  <option value="desratizacao">Desratização</option>
                  <option value="sanitizacao">Sanitização</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Praga Alvo *
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Selecione a praga alvo</option>
                  <option value="baratas">Baratas</option>
                  <option value="ratos">Ratos</option>
                  <option value="formigas">Formigas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local *
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Selecione o local</option>
                  <option value="interno">Área Interna</option>
                  <option value="externo">Área Externa</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foram utilizados produtos?
                </label>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-blue-600">Produtos Utilizados</span>
                  <button className="ml-auto text-blue-600">
                    Selecione um produto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  placeholder="Digite as observações aqui..."
                />
              </div>

              <div className="text-sm text-blue-600">
                OS em andamento - Iniciada às {selectedClient.startTime || startTime}
              </div>

              <div className="flex justify-end gap-3 sticky bottom-0 pt-4 mt-4 bg-white">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  onClick={handleFinishService}
                >
                  <Check className="w-5 h-5" />
                  Finalizar OS
                </button>
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Aprovar OS
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Novo Agendamento */}
      {isNewScheduleModalOpen && (
        <NewScheduleModal
          onClose={() => setIsNewScheduleModalOpen(false)}
          onSuccess={loadSchedules}
        />
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
}
