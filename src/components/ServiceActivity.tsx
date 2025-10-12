import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle, ThumbsUp, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { LocationSelector } from './LocationSelector';
import { DeviceSelector } from './DeviceSelector';
import { StatusSelector } from './StatusSelector';
import { QuantityInput } from './QuantityInput';
import { DeviceGrid } from './DeviceGrid';
import { DeviceSummary } from './DeviceSummary';
import { ProductSelector } from './ProductSelector';
import { ServiceItem } from '../types/pdf.types';
import RetroactiveServiceModal from './RetroactiveServiceModal';
import { PestCountingSection } from './ServiceActivity/PestCountingSection';
import { PestCountingModal } from './ServiceActivity/PestCountingModal';
import { format } from 'date-fns';

import { Pest, DevicePestCount } from '../types/pest.types';
import { activityService, ServiceListItem, ActivityState } from '../services/activityService';
import { STORAGE_KEYS } from '../services/storageKeys';

interface ServiceActivityProps {
  serviceType: string;
  targetPest: string;
  location: string;
  observations: string;
  applicationMethod: string;
  productAmount: string;
  state: any;
  startTime: Date | null;
  endTime: Date | null;
  isLoading: boolean;
  showDeviceModal: boolean;
  onServiceTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTargetPestChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onApplicationMethodChange: (value: string) => void;
  onProductAmountChange: (value: string) => void;
  onObservationsChange: (value: string) => void;
  onOpenDeviceModal: () => void;
  onCloseDeviceModal: () => void;
  onFinishOS: () => void;
  onApproveOS: () => void;
  onProductSelect: (product: any) => void;
  onDeviceChange: (device: string) => void;
  onStatusChange: (status: string) => void;
  onQuantityChange: (quantity: string) => void;
  onDeviceClick: (deviceId: number) => void;
  onSelectAll: () => void;
  onSaveDevices: () => void;
  canFinishOS: () => boolean;
  canSave: boolean;
  onProductClear?: () => void;
}

// Interface para um serviço individual na lista de serviços
// Interface ServiceListItem movida para activityService.ts

const ServiceActivity: React.FC<ServiceActivityProps> = ({
  serviceType,
  targetPest,
  location,
  observations,
  applicationMethod,
  productAmount,
  state,
  startTime,
  endTime,
  isLoading,
  showDeviceModal,
  onServiceTypeChange,
  onTargetPestChange,
  onLocationChange,
  onApplicationMethodChange,
  onProductAmountChange,
  onObservationsChange,
  onOpenDeviceModal,
  onCloseDeviceModal,
  onFinishOS,
  onApproveOS,
  onProductSelect,
  onDeviceChange,
  onStatusChange,
  onQuantityChange,
  onDeviceClick,
  onSelectAll,
  onSaveDevices,
  canFinishOS,
  canSave,
  onProductClear
}) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Adicionar log para debug dos valores
  console.log('Valor atual de serviceType:', serviceType);
  
  const isTreatmentService = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_com_gel'].includes(serviceType.toLowerCase());
  const showProductSelector = isTreatmentService || serviceType.toLowerCase() === 'monitoramento';
  
  // Adicionar logs para debug
  console.log('isTreatmentService:', isTreatmentService);
  console.log('showProductSelector:', showProductSelector);
  console.log('Lista de serviços de tratamento:', ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_com_gel']);
  
  const [showNewPestInput, setShowNewPestInput] = useState(false);
  const [newPest, setNewPest] = useState('');
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newService, setNewService] = useState('');
  const [localStartTime, setLocalStartTime] = useState<Date | null>(startTime);
  const [showRetroactiveModal, setShowRetroactiveModal] = useState(false);
  const [showPestCountingModal, setShowPestCountingModal] = useState(false);
  
  // Estado para gerenciar múltiplos serviços
  const [serviceList, setServiceList] = useState<ServiceListItem[]>([]);
  
  // Estado para gerenciar contagem de pragas
  const [pestCounts, setPestCounts] = useState<DevicePestCount[]>([]);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
  
  // Lista inicial de pragas comuns
  const initialPests = [
    'Roedores',
    'Baratas',
    'Moscas',
    'Formigas',
    'Cupins',
    'Aranhas',
    'Escorpiões',
    'Percevejos',
    'Pulgas',
    'Carrapatos',
    'Traças',
    'Vespas',
  ];

  const [availablePests, setAvailablePests] = useState<string[]>(initialPests);
  
  // Lista inicial de tipos de serviço
  const initialServiceTypes = [
    'Inspeção',
    'Monitoramento',
    'Pulverização',
    'Atomização',
    'Termonebulização',
    'Polvilhamento',
    'Iscagem com gel',
  ];

  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(initialServiceTypes);
  
  // Função para salvar as contagens de pragas no localStorage
  const handleSavePestCounts = (counts: DevicePestCount[]) => {
    setPestCounts(counts);
    
    try {
      // Salvar contagens de pragas no localStorage
      localStorage.setItem(STORAGE_KEYS.PEST_COUNTS, JSON.stringify(counts));
      console.log('Contagens de pragas salvas no localStorage:', counts);
    } catch (error) {
      console.error('Erro ao salvar contagens de pragas no localStorage:', error);
    }
  };

  // Carrega dados do Supabase ao montar o componente
  useEffect(() => {
    const loadActivityData = async () => {
      try {
        // Buscar ordem de serviço ativa
        const activeOrder = await activityService.getActiveServiceOrder();
        if (activeOrder) {
          // Carregar estado da atividade
          const activityState = await activityService.loadActivityState(activeOrder.id);
          if (activityState) {
            if (activityState.localStartTime) {
              setLocalStartTime(activityState.localStartTime);
            }
            setAvailablePests(activityState.availablePests);
            setAvailableServiceTypes(activityState.availableServiceTypes);
            setShowNewPestInput(activityState.showNewPestInput);
            setNewPest(activityState.newPest || '');
            setShowNewServiceInput(activityState.showNewServiceInput);
            setNewService(activityState.newService || '');
          }
          
          // Carregar lista de serviços
          const savedServiceList = await activityService.loadServiceList(activeOrder.id);
          if (savedServiceList.length > 0) {
            setServiceList(savedServiceList);
            const currentId = activityState?.currentServiceId || savedServiceList[0].id;
            setCurrentServiceId(currentId);
          } else {
            // Inicializar com serviço atual ou vazio
            const initialService: ServiceListItem = {
              id: Date.now().toString(),
              serviceType: serviceType || '',
              targetPest: targetPest || '',
              location: location || '',
              product: state.selectedProduct,
              productAmount: productAmount || ''
            };
            setServiceList([initialService]);
            setCurrentServiceId(initialService.id);
          }
          
          // Carregar contagens de pragas do localStorage
          try {
            if (!endTime && (!activeOrder.status || activeOrder.status === 'in_progress')) {
              const savedPestCountsStr = localStorage.getItem(STORAGE_KEYS.PEST_COUNTS);
              if (savedPestCountsStr) {
                const savedPestCounts = JSON.parse(savedPestCountsStr);
                setPestCounts(savedPestCounts);
                console.log('Contagens de pragas carregadas do localStorage:', savedPestCounts);
              }
            } else {
              // OS já finalizada: iniciar contagens vazias no modal e ignorar localStorage
              setPestCounts([]);
              console.log('OS finalizada - contagens de pragas iniciam vazias (localStorage ignorado)');
            }
          } catch (error) {
            console.error('Erro ao carregar contagens de pragas do localStorage:', error);
          }
          
          // Carregar horário de início da ordem
          if (activeOrder.start_time) {
            setLocalStartTime(new Date(activeOrder.start_time));
          }
        } else {
          // Sem ordem ativa, inicializar com dados vazios
          const emptyService: ServiceListItem = {
            id: Date.now().toString(),
            serviceType: '',
            targetPest: '',
            location: '',
            product: null,
            productAmount: ''
          };
          setServiceList([emptyService]);
          setCurrentServiceId(emptyService.id);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da atividade:', error);
        // Fallback para inicialização básica
        const emptyService: ServiceListItem = {
          id: Date.now().toString(),
          serviceType: '',
          targetPest: '',
          location: '',
          product: null,
          productAmount: ''
        };
        setServiceList([emptyService]);
        setCurrentServiceId(emptyService.id);
      }
    };
    
    loadActivityData();
  }, []);
  
  // Funções para gerenciar múltiplos serviços
  const addNewService = () => {
    const newServiceItem: ServiceListItem = {
      id: Date.now().toString(),
      serviceType: '',
      targetPest: '',
      location: '',
      product: null,
      productAmount: ''
    };
    setServiceList([...serviceList, newServiceItem]);
    setCurrentServiceId(newServiceItem.id);
    
    // Limpa os campos do formulário para o novo serviço
    onServiceTypeChange({ target: { value: '' } } as React.ChangeEvent<HTMLSelectElement>);
    onTargetPestChange('');
    onLocationChange('');
    onProductAmountChange('');
    onProductSelect(null);
  };
  
  const removeService = (id: string) => {
    const updatedList = serviceList.filter(service => service.id !== id);
    setServiceList(updatedList);
    
    // Se removeu o serviço atual, seleciona o primeiro da lista
    if (id === currentServiceId && updatedList.length > 0) {
      setCurrentServiceId(updatedList[0].id);
      const currentService = updatedList[0];
      
      // Atualiza os campos do formulário com os dados do serviço selecionado
      onServiceTypeChange({ target: { value: currentService.serviceType } } as React.ChangeEvent<HTMLSelectElement>);
      onTargetPestChange(currentService.targetPest);
      onLocationChange(currentService.location);
      onProductAmountChange(currentService.productAmount);
      onProductSelect(currentService.product);
    }
  };
  
  const selectService = (id: string) => {
    setCurrentServiceId(id);
    const selectedService = serviceList.find(service => service.id === id);
    if (selectedService) {
      // Atualiza os campos do formulário com os dados do serviço selecionado
      onServiceTypeChange({ target: { value: selectedService.serviceType } } as React.ChangeEvent<HTMLSelectElement>);
      onTargetPestChange(selectedService.targetPest);
      onLocationChange(selectedService.location);
      onProductAmountChange(selectedService.productAmount);
      onProductSelect(selectedService.product);
    }
  };
  
  // Função para salvar estado da atividade no localStorage
  const saveActivityState = async () => {
    try {
      const activeOrder = await activityService.getActiveServiceOrder();
      if (activeOrder) {
        const activityState: ActivityState = {
          currentServiceId,
          availablePests,
          availableServiceTypes,
          showNewPestInput,
          newPest,
          showNewServiceInput,
          newService,
          localStartTime
        };
        await activityService.saveActivityState(activeOrder.id, activityState);
      }
    } catch (error) {
      console.error('Erro ao salvar estado da atividade:', error);
    }
  };

  // Atualiza o serviço atual na lista quando os campos mudam
  useEffect(() => {
    if (currentServiceId) {
      setServiceList(prevList => {
        const updatedList = prevList.map(service => {
          // Definir os tipos de serviço que usam produto
          const productServiceTypes = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_com_gel', 'monitoramento'];

          // Verificar se o tipo de serviço DO ITEM da lista usa produto
          const itemUsesProduct = productServiceTypes.includes(service.serviceType.toLowerCase());

          return service.id === currentServiceId 
            ? {
                ...service,
                serviceType,
                targetPest,
                location,
                // Incluir o produto SOMENTE se o tipo de serviço do item usar produto E houver um produto selecionado
                product: itemUsesProduct ? state.selectedProduct : null,
                productAmount
              }
            : service;
        });
        
        // Salvar lista de serviços no localStorage
        const saveServiceList = async () => {
          try {
            const activeOrder = await activityService.getActiveServiceOrder();
            if (activeOrder) {
              await activityService.saveServiceList(activeOrder.id, updatedList);
            }
          } catch (error) {
            console.error('Erro ao salvar lista de serviços:', error);
          }
        };
        saveServiceList();
        
        return updatedList;
      });
    }
  }, [serviceType, targetPest, location, state.selectedProduct, productAmount, currentServiceId]);

  // Salvar estado da atividade quando houver mudanças
  useEffect(() => {
    saveActivityState();
  }, [currentServiceId, availablePests, availableServiceTypes, showNewPestInput, newPest, showNewServiceInput, newService, localStartTime]);

  // Atualiza quando receber evento de início de OS
  useEffect(() => {
    const handleServiceStart = (event: CustomEvent) => {
      console.log('ServiceActivity recebeu evento de início de OS:', event.detail);
      if (event.detail?.startTime) {
        setLocalStartTime(new Date(event.detail.startTime));
      }

      // Resetar todos os campos quando iniciar uma nova OS
      if (!event.detail?.isRetroactive) {
        // Limpa os campos do formulário para a nova OS
        onServiceTypeChange({ target: { value: '' } } as React.ChangeEvent<HTMLSelectElement>);
        onTargetPestChange('');
        onLocationChange('');
        onApplicationMethodChange('');
        onProductAmountChange('');
        onObservationsChange('');
        onProductSelect(null);

        // Limpa a lista de serviços e cria um novo serviço vazio
        const emptyService: ServiceListItem = {
          id: Date.now().toString(),
          serviceType: '',
          targetPest: '',
          location: '',
          product: null,
          productAmount: ''
        };
        setServiceList([emptyService]);
        setCurrentServiceId(emptyService.id);

        // Limpa as contagens de pragas e reseta as listas dinâmicas
        setPestCounts([]);
        // Garante que o resumo não reapareça por dados antigos
        localStorage.removeItem(STORAGE_KEYS.PEST_COUNTS);
        setAvailablePests(initialPests); // Reseta a lista de pragas dinâmicas
        setAvailableServiceTypes(initialServiceTypes); // Reseta a lista de tipos de serviço dinâmicos

        // Limpa outros estados locais
        setShowNewPestInput(false);
        setNewPest('');
        setShowNewServiceInput(false);
        setNewService('');

        console.log('Todos os campos foram resetados para a nova OS');
      }
    };

    window.addEventListener('serviceStart', handleServiceStart as EventListener);
    return () => {
      window.removeEventListener('serviceStart', handleServiceStart as EventListener);
    };
  }, [onServiceTypeChange, onTargetPestChange, onLocationChange, onApplicationMethodChange,
      onProductAmountChange, onObservationsChange, onProductSelect]);

  // Atualiza o localStartTime quando o startTime prop muda
  useEffect(() => {
    if (startTime) {
      setLocalStartTime(startTime);
    }
  }, [startTime]);

  // Limpar dados da página quando a OS for finalizada ou uma nova for iniciada
  useEffect(() => {
    const handleServiceActivityCleanup = (event: CustomEvent) => {
      console.log('Limpando dados da página de atividade:', event.detail);
      
      // Se for uma nova ordem, limpa tudo exceto o que será preenchido automaticamente
      const isNewOrder = event.detail?.newOrder;
      
      // Limpa todos os campos do formulário
      onServiceTypeChange({ target: { value: '' } } as React.ChangeEvent<HTMLSelectElement>);
      onTargetPestChange('');
      onLocationChange('');
      onApplicationMethodChange('');
      onProductAmountChange('');
      onObservationsChange('');
      onProductSelect(null);

      // Limpa a lista de serviços e cria um novo serviço vazio
      const emptyService: ServiceListItem = {
        id: Date.now().toString(),
        serviceType: '',
        targetPest: '',
        location: '',
        product: null,
        productAmount: ''
      };
      setServiceList([emptyService]);
      setCurrentServiceId(emptyService.id);

      // Limpa as contagens de pragas e reseta as listas dinâmicas
      setPestCounts([]);
      setAvailablePests(initialPests);
      setAvailableServiceTypes(initialServiceTypes);
      // Garante que o resumo não reapareça por dados antigos
      localStorage.removeItem(STORAGE_KEYS.PEST_COUNTS);

      // Limpa outros estados locais
      setShowNewPestInput(false);
      setNewPest('');
      setShowNewServiceInput(false);
      setNewService('');
      
      // Se for finalização de OS, limpa o horário de início também
      if (!isNewOrder) {
        setLocalStartTime(null);
      }

      console.log(`Dados da página de atividade limpos para ${isNewOrder ? 'nova OS' : 'finalização de OS'}`);
    };

    const handleServiceOrderFinished = (event: CustomEvent) => {
      // Só recarrega a página se não for uma OS retroativa
      if (event.detail?.success && !event.detail?.isRetroactive) {
        setPestCounts([]);
        // Dados agora são gerenciados pelo Supabase
        window.location.reload();
      }
    };

    window.addEventListener('serviceActivityCleanup', handleServiceActivityCleanup as EventListener);
    window.addEventListener('serviceOrderFinished', handleServiceOrderFinished as EventListener);
    
    return () => {
      window.removeEventListener('serviceActivityCleanup', handleServiceActivityCleanup as EventListener);
      window.removeEventListener('serviceOrderFinished', handleServiceOrderFinished as EventListener);
    };
  }, [onServiceTypeChange, onTargetPestChange, onLocationChange, onApplicationMethodChange,
      onProductAmountChange, onObservationsChange, onProductSelect]);

  // Converte a lista de serviços para JSON para ser acessada pelo App.tsx
  const serviceListJson = JSON.stringify(serviceList);

  // Função para lidar com os dados retroativos
  const handleRetroactiveData = async (data: {
    date: string;
    startTime: string;
    endTime: string;
    duration: string;
  }) => {
    console.log('Dados retroativos:', data);
    
    // Cria objetos Date para início e fim
    const startDate = new Date(`${data.date}T${data.startTime}:00`);
    setLocalStartTime(startDate);
    
    // Armazena os dados retroativos no localStorage para uso na geração do PDF
    localStorage.setItem('retroactive_service_data', JSON.stringify({
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      isRetroactive: true
    }));
    
    // Salvar dados retroativos no Supabase
    try {
      const activeOrder = await activityService.getActiveServiceOrder();
      if (activeOrder) {
        await activityService.savePestCounts(activeOrder.id, pestCounts);
        await activityService.saveServiceList(activeOrder.id, serviceList);
        if (localStartTime) {
          await activityService.saveStartTime(activeOrder.id, localStartTime);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar dados retroativos:', error);
    }
    
    // Dispara evento de início de OS com data retroativa
    const startEvent = new CustomEvent('serviceStart', {
      detail: {
        startTime: startDate.toISOString(),
        isRetroactive: true,
        date: data.date,
        endTime: data.endTime
      }
    });
    window.dispatchEvent(startEvent);
    
    // Se tiver horário de fim, também dispara evento de finalização
    if (data.endTime) {
      const endDate = new Date(`${data.date}T${data.endTime}:00`);
      
      // Dispara evento de finalização com pequeno atraso para garantir que o início seja processado primeiro
      setTimeout(() => {
        const endEvent = new CustomEvent('serviceOrderFinished', {
          detail: {
            success: true,
            isRetroactive: true,
            endTime: endDate.toISOString()
          }
        });
        window.dispatchEvent(endEvent);
      }, 500);
    }
  };
  
  // Carregar contagens de pragas do Supabase ao iniciar
  useEffect(() => {
    const loadSavedCounts = async () => {
      try {
        const activeOrder = await activityService.getActiveServiceOrder();
        if (activeOrder && !endTime) {
          const counts = await activityService.loadPestCounts(activeOrder.id);
          setPestCounts(counts);
        } else {
          // OS finalizada: garantir que o modal inicie vazio
          setPestCounts([]);
        }
      } catch (error) {
        console.error('Erro ao carregar contagens salvas:', error);
      }
    };
    loadSavedCounts();
  }, [endTime]);

  // Função para adicionar nova praga à lista
  const handleAddNewPest = () => {
    const trimmedPest = newPest.trim();
    if (trimmedPest && !availablePests.find(pest => pest.toLowerCase() === trimmedPest.toLowerCase())) {
      setAvailablePests([...availablePests, trimmedPest]);
      onTargetPestChange(trimmedPest); // Seleciona a nova praga automaticamente
      setNewPest('');
      // Ocultar o input e botões após a adição bem-sucedida
      setShowNewPestInput(false);
    } else if (trimmedPest) {
      // Opcional: adicionar feedback visual se a praga já existe
      console.log('Praga já existe na lista');
      // Limpar o campo e ocultar mesmo se já existir
      setNewPest('');
      setShowNewPestInput(false);
    }
  };

  // Função para remover uma praga adicionada dinamicamente
  const handleRemovePest = (pestToRemove: string) => {
    // Adicionar confirmação ou feedback visual aqui se necessário
    const updatedPests = availablePests.filter(pest => pest !== pestToRemove);
    setAvailablePests(updatedPests);

    // Se a praga removida for a praga alvo atual, limpa a seleção
    if (targetPest.toLowerCase() === pestToRemove.toLowerCase()) {
      onTargetPestChange('');
    }
  };

  // Função para adicionar novo tipo de serviço à lista
  const handleAddNewServiceType = () => {
    const trimmedServiceType = newService.trim();
    if (trimmedServiceType && !availableServiceTypes.find(type => type.toLowerCase() === trimmedServiceType.toLowerCase())) {
      setAvailableServiceTypes([...availableServiceTypes, trimmedServiceType]);
      // onServiceTypeChange({ target: { value: trimmedServiceType } } as React.ChangeEvent<HTMLSelectElement>); // Seleciona o novo tipo automaticamente
      // Removi a seleção automática para seguir o padrão atual do campo de serviço que não seleciona
      setNewService('');
      // Ocultar o input e botões após a adição bem-sucedida
      setShowNewServiceInput(false);
    } else if (trimmedServiceType) {
      console.log('Tipo de serviço já existe na lista');
      // Limpar o campo e ocultar mesmo se já existir
      setNewService('');
      setShowNewServiceInput(false);
    }
  };

  // Função para remover um tipo de serviço adicionado dinamicamente
  const handleRemoveServiceType = (serviceTypeToRemove: string) => {
    const updatedServiceTypes = availableServiceTypes.filter(type => type !== serviceTypeToRemove);
    setAvailableServiceTypes(updatedServiceTypes);

    // Se o tipo de serviço removido for o tipo de serviço atual, limpa a seleção
    if (serviceType.toLowerCase() === serviceTypeToRemove.toLowerCase()) {
      onServiceTypeChange({ target: { value: '' } } as React.ChangeEvent<HTMLSelectElement>);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-52" ref={dashboardRef} data-service-list={serviceListJson}>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Ordem de Serviço</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRetroactiveModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              title="Criar OS retroativa"
            >
              <Calendar className="h-4 w-4" />
              <span>OS Retroativa</span>
            </button>
            {localStartTime && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Início: </span>
                {localStartTime.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Lista de serviços adicionados - mostrar apenas se houver serviços com tipo definido */}
        {/* Ocultado da interface */}
        {serviceList.some(service => service.serviceType) && (
          <div className="mb-6 border rounded-lg p-4 bg-gray-50" style={{ display: 'none' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">Serviços Adicionados</h3>
              <button
                onClick={addNewService}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                Adicionar Serviço
              </button>
            </div>
            <div className="space-y-2">
              {serviceList.map((service) => (
                <div 
                  key={service.id} 
                  className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${service.id === currentServiceId ? 'bg-blue-100 border border-blue-300' : 'bg-white border'}`}
                  onClick={() => selectService(service.id)}
                >
                  <div>
                    <div className="font-medium">{service.serviceType ? service.serviceType.charAt(0).toUpperCase() + service.serviceType.slice(1) : 'Novo Serviço'}</div>
                    <div className="text-sm text-gray-600">
                      {service.targetPest ? `Alvo: ${service.targetPest}` : ''}
                      {service.location ? ` | Local: ${service.location}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeService(service.id);
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                    disabled={serviceList.length <= 1}
                    title={serviceList.length <= 1 ? "Pelo menos um serviço é necessário" : "Remover serviço"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campo Tipo de Serviço */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Serviço *
          </label>
          <select
            value={serviceType}
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (selectedValue === 'novo_servico') {
                setShowNewServiceInput(true);
                onServiceTypeChange({ target: { value: '' } } as React.ChangeEvent<HTMLSelectElement>);
                if (onProductClear) onProductClear();
              } else {
                setShowNewServiceInput(false);
                console.log('Valor selecionado:', selectedValue);
                onServiceTypeChange(e);

                // Verifica se o novo tipo de serviço usa produto
                const treatmentTypes = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_com_gel'];
                const isProductService = treatmentTypes.includes(selectedValue.toLowerCase()) || selectedValue.toLowerCase() === 'monitoramento';

                // Se o tipo de serviço não usa produto, limpa a seleção de produto
                if (!isProductService) {
                  if (onProductClear) onProductClear();
                }
              }
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Selecione o tipo de serviço</option>
            {availableServiceTypes.map(type => {
              // Garantir que o valor seja exatamente como esperado
              const value = type.toLowerCase()
                .replace(/ç/g, 'c')
                .replace(/ã/g, 'a')
                .replace(/õ/g, 'o')
                .replace(/á/g, 'a')
                .replace(/é/g, 'e')
                .replace(/í/g, 'i')
                .replace(/ó/g, 'o')
                .replace(/ú/g, 'u')
                .replace(/ /g, '_');
              console.log('Opção:', type, 'Valor gerado:', value);
              return (
                <option key={type} value={value}>{type}</option>
              );
            })}
            <option value="novo_servico">+ Adicionar novo serviço</option>
          </select>

          {showNewServiceInput && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                 onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewServiceType();
                  }
                }}
                placeholder="Digite o novo tipo de serviço"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAddNewServiceType}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setNewService('');
                    setShowNewServiceInput(false);
                  }}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de tipos de serviço adicionados dinamicamente com botão de remover - SEMPRE VISÍVEL SE HOUVER TIPOS ADICIONADOS */}
          {availableServiceTypes.length > initialServiceTypes.length && (
             <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Tipos de serviço adicionados dinamicamente:</p>
              <ul className="space-y-2">
                {availableServiceTypes
                  .filter(type => !initialServiceTypes.includes(type)) // Filtra apenas os tipos não iniciais
                  .map(type => (
                    <li key={type} className="flex justify-between items-center text-base text-gray-700 bg-white p-3 rounded-md shadow-sm border border-gray-200">
                      <span>{type}</span>
                      <button
                        onClick={() => handleRemoveServiceType(type)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remover tipo de serviço"
                      >
                         <Trash2 size={18} />
                      </button>
                    </li>
                  ))
                }
              </ul>
            </div>
          )}

        </div>

        {/* Campo Praga Alvo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Praga Alvo *
          </label>
          <select
            value={targetPest}
            onChange={(e) => {
              if (e.target.value === 'nova_praga') {
                setShowNewPestInput(true);
                onTargetPestChange(''); // Limpa a seleção atual ao escolher adicionar nova
              } else {
                setShowNewPestInput(false); // Oculta o input de nova praga ao selecionar uma existente
                onTargetPestChange(e.target.value);
              }
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Selecione a praga alvo</option>
            {availablePests.map(pest => (
              <option key={pest} value={pest.toLowerCase()}>{pest}</option>
            ))}
            <option value="nova_praga">+ Adicionar nova praga</option>
          </select>

          {showNewPestInput && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={newPest}
                onChange={(e) => setNewPest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewPest();
                  }
                }}
                placeholder="Digite a nova praga alvo"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAddNewPest}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setNewPest('');
                    setShowNewPestInput(false);
                  }}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          
          {/* Lista de pragas adicionadas dinamicamente com botão de remover - SEMPRE VISÍVEL SE HOUVER PRAGAS ADICIONADAS */}
          {availablePests.length > initialPests.length && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Pragas adicionadas dinamicamente:</p>
              <ul className="space-y-2">
                {availablePests
                  .filter(pest => !initialPests.includes(pest)) // Filtra apenas as pragas não iniciais
                  .map(pest => (
                    <li key={pest} className="flex justify-between items-center text-base text-gray-700 bg-white p-3 rounded-md shadow-sm border border-gray-200">
                      <span>{pest}</span>
                      <button
                        onClick={() => handleRemovePest(pest)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remover praga"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))
                }
              </ul>
            </div>
          )}
        </div>

        {/* Campo Local */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Local *
          </label>
          <LocationSelector
            value={location}
            onChange={onLocationChange}
          />
        </div>

        {/* Seleção de Produto */}
        {showProductSelector && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Foram utilizados produtos?</h4>
            <ProductSelector onProductSelect={onProductSelect} />
          </div>
        )}

        {/* Campo Quantidade de Produto */}
        {state.selectedProduct && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de Produto ({state.selectedProduct.quantity})
            </label>
            <div className="relative">
              <input
                type="number"
                value={productAmount}
                onChange={(e) => onProductAmountChange(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-16"
                placeholder={`Digite a quantidade em ${state.selectedProduct.quantity}`}
              />
              <div className="absolute inset-y-0 right-0 mt-1 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{state.selectedProduct.quantity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Grid de seletores */}
        {!isTreatmentService && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={onOpenDeviceModal}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-center"
              >
                Selecionar Dispositivos
              </button>
              <button
                onClick={() => {
                  if (endTime) {
                    // Se a OS já foi finalizada, garantir que o modal abra vazio
                    setPestCounts([]);
                  }
                  setShowPestCountingModal(true);
                }}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-center"
              >
                Contagem de Pragas
              </button>
            </div>
          </div>
        )}

        {/* Campo de Observações */}
        <div className="mb-4">
          <label
            htmlFor="observations"
            className="block text-lg font-semibold text-gray-700 mb-2"
          >
            Observações
          </label>
          <textarea
            id="observations"
            value={observations}
            onChange={(e) => onObservationsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            rows={3}
            placeholder="Digite as observações aqui..."
          />
        </div>

        {startTime && !endTime && (
          <div className="text-green-600 font-medium mb-4">
            OS em andamento - Iniciada às {startTime.toLocaleTimeString()}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 mt-6">
          <button
            onClick={() => {
              // Verifica se os campos obrigatórios estão preenchidos
              if (serviceType && targetPest && location) {
                // Adiciona o serviço atual à lista e cria um novo serviço vazio
                addNewService();
                
                // Limpa todos os campos do formulário
                onServiceTypeChange({ target: { value: '' } } as React.ChangeEvent<HTMLSelectElement>);
                onTargetPestChange('');
                onLocationChange('');
                onApplicationMethodChange('');
                onProductAmountChange('');
                onObservationsChange('');
                onProductSelect(null);
                
                // Exibe mensagem de sucesso
                const toast = document.createElement('div');
                // toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
        // toast.textContent = 'Serviço adicionado com sucesso!';
                document.body.appendChild(toast);
                setTimeout(() => {
                  document.body.removeChild(toast);
                }, 3000);
              } else {
                // Exibe mensagem de erro
                const toast = document.createElement('div');
                // toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
        // toast.textContent = 'Preencha os campos obrigatórios: Tipo de Serviço, Praga Alvo e Local';
                document.body.appendChild(toast);
                setTimeout(() => {
                  document.body.removeChild(toast);
                }, 3000);
              }
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="h-5 w-5" />
            Salvar Serviço
          </button>
          <button
            onClick={onApproveOS}
            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 font-medium"
          >
            <ThumbsUp className="h-5 w-5" />
            Aprovar OS
          </button>
          <button
            onClick={() => {
              setPestCounts([]);
              // Dados agora são gerenciados pelo Supabase
              onFinishOS();
            }}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            disabled={!canFinishOS()}
          >
            <CheckCircle className="h-5 w-5" />
            {isLoading ? (
              <span>Finalizando...</span>
            ) : (
              <span>Finalizar OS</span>
            )}
          </button>
        </div>
      </div>

      {/* Modal de OS Retroativa */}
      {showRetroactiveModal && (
        <RetroactiveServiceModal
          isOpen={showRetroactiveModal}
          onClose={() => setShowRetroactiveModal(false)}
          onSave={handleRetroactiveData}
        />
      )}

      {/* Modal de Contagem de Pragas */}
      <PestCountingModal
        isOpen={showPestCountingModal}
        onClose={() => setShowPestCountingModal(false)}
        devices={
          (state.savedDevices || []).filter((device: any) => {
            const status = device.status;
            const statusList = Array.isArray(status) ? status : (status ? [status] : []);
            // Dispositivos com refil/atrativo substituído ou com "Praga encontrada"
            const hasEligibleStatus =
              statusList.includes('Refil substituído') ||
              statusList.includes('Atrativo biológico substituído') ||
              statusList.includes('Praga encontrada');
            // Exclui dispositivos inativos
            return hasEligibleStatus && !statusList.includes('inativo');
          })
        }
        onSavePestCounts={handleSavePestCounts}
        savedPestCounts={endTime ? [] : pestCounts}
      />

      {/* Modal de Dispositivos */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Selecionar Dispositivos</h2>
              <button
                onClick={onCloseDeviceModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {/* Seletor de Dispositivo primeiro */}
              <div className="mb-6">
                <DeviceSelector
                  selectedDevice={state.selectedDevice}
                  onDeviceChange={onDeviceChange}
                  disabled={isLoading}
                />
              </div>

              {/* Status do Dispositivo */}
              <div className="mb-6">
                <StatusSelector
                  selectedStatus={state.selectedStatus}
                  onStatusChange={onStatusChange}
                  onSelectAll={onSelectAll}
                  disabled={isLoading}
                  selectedDevice={state.selectedDevice}
                />
              </div>

              {/* Quantidade */}
              <div className="mb-6">
                <QuantityInput
                  quantity={state.quantity}
                  onQuantityChange={onQuantityChange}
                  selectedDevice={state.selectedDevice}
                  disabled={isLoading}
                />
              </div>

              {/* Grid de Dispositivos */}
              <DeviceGrid
                devices={state.devices || []}
                onDeviceClick={onDeviceClick}
                selectedDeviceId={state.selectedDevice ? state.selectedDevice.id : null}
              />

              {/* Dispositivos Salvos */}
              {state.savedDevices.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Dispositivos Salvos</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <DeviceSummary 
                      devices={state.savedDevices} 
                      selectedProduct={state.selectedProduct} 
                    />
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-3">
                <button
                  onClick={onSaveDevices}
                  disabled={!canSave}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Salvar Dispositivos
                </button>
                <button
                  onClick={onCloseDeviceModal}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo das contagens de pragas (sempre visível) */}
      {pestCounts.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Resumo de Contagem de Pragas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {pestCounts.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                  <h4 className="font-medium text-gray-800">{item.deviceType} {item.deviceNumber}</h4>
                  <ul className="mt-2 space-y-1">
                    {item.pests.map((pest, pestIndex) => (
                      <li key={pestIndex} className="text-sm text-gray-600 flex justify-between">
                        <span>{pest.name}</span>
                        <span className="font-medium">{pest.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceActivity;
