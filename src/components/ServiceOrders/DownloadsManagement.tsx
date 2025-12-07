import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getAllStoredPDFs } from '../../services/pdfService';
import { Capacitor } from '@capacitor/core';
import { Download, Search, X, Calendar, User, FileText, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storageService';
import { billingService } from '../../services/billingService';
import { getClients } from '../../services/clientStorage';

interface StoredPDF {
  orderNumber: string;
  createdAt: string;
  clientName: string;
  serviceType: string;
  technicianName?: string;
}

const DownloadsManagement: React.FC = () => {
  const { role } = useAuth();
  const company = storageService.getCompany();
  const companyId: string = company?.id?.toString?.() || company?.cnpj || 'default-company';
  const [billingInactive, setBillingInactive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    orderNumber: '',
    clientName: '',
    serviceType: '',
    technicianName: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  });

  const [data, setData] = useState<StoredPDF[]>([]);
  const [filteredData, setFilteredData] = useState<StoredPDF[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para opções dos filtros
  const [clientOptions, setClientOptions] = useState<string[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<string[]>([]);
  const [technicianOptions, setTechnicianOptions] = useState<string[]>([]);

  useEffect(() => {
    loadPDFs();
    checkBillingStatus();
    loadFilterOptions();
  }, []);

  // Aplicar filtros automaticamente quando mudam
  useEffect(() => {
    handleSearch();
  }, [filters, data]);

  const checkBillingStatus = async () => {
    try {
      const status = await billingService.getStatus(companyId);
      setBillingInactive(!status?.active);
    } catch (e) {
      console.warn('Falha ao obter status de assinatura:', e);
      setBillingInactive(false);
    }
  };

  // Função para obter o nome do controlador de pragas (mesma lógica do PDF)
  const getTechnicianName = (): string => {
    try {
      // Buscar assinaturas do localStorage
      const signaturesData = JSON.parse(localStorage.getItem('safeprag_signatures') || '[]');
      const controladorData = signaturesData
        .filter((sig: any) => sig.signature_type === 'controlador')
        .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0] || null;

      // Buscar userData como fallback
      const userDataStr = localStorage.getItem('safeprag_user_data') || localStorage.getItem('userData');
      let userData = null;
      if (userDataStr) {
        try {
          userData = JSON.parse(userDataStr);
        } catch (e) {
          console.error('Erro ao parsear userData:', e);
        }
      }

      // Usa a mesma lógica do PDF: controladorData primeiro, depois userData
      return controladorData?.controlador_name || userData?.name || 'Não informado';
    } catch (error) {
      console.error('Erro ao obter nome do técnico:', error);
      return 'Não informado';
    }
  };

  const loadPDFs = async () => {
    setLoading(true);
    try {
      const storedPDFs = await getAllStoredPDFs();
      const pdfArray = Array.isArray(storedPDFs) ? storedPDFs : [];

      // Para cada PDF, se não tiver technicianName, busca dinamicamente
      const technicianName = getTechnicianName();
      const pdfsWithTechnician = pdfArray.map(pdf => ({
        ...pdf,
        technicianName: pdf.technicianName || technicianName
      }));

      setData(pdfsWithTechnician);
      setFilteredData(pdfsWithTechnician);
    } catch (error) {
      console.error('Erro ao carregar PDFs:', error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar opções para os filtros
  const loadFilterOptions = async () => {
    try {
      // Carregar clientes
      const clients = getClients();
      const uniqueClients = Array.from(new Set(clients.map(c => c.name).filter(Boolean)));
      setClientOptions(uniqueClients.sort());

      // Carregar tipos de serviço dos PDFs salvos
      const storedPDFs = await getAllStoredPDFs();
      const pdfArray = Array.isArray(storedPDFs) ? storedPDFs : [];
      const uniqueServices = Array.from(new Set(pdfArray.map((pdf: any) => pdf.serviceType).filter(Boolean)));
      setServiceTypeOptions((uniqueServices as string[]).sort());

      // Carregar nome do controlador
      const techName = getTechnicianName();
      if (techName && techName !== 'Não informado') {
        setTechnicianOptions([techName]);
      }
    } catch (error) {
      console.error('Erro ao carregar opções dos filtros:', error);
    }
  };

  const handleSearch = () => {
    if (!Array.isArray(data)) {
      console.error('Dados não estão em formato de array');
      return;
    }

    const filtered = data.filter(item => {
      if (filters.orderNumber && !item.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())) {
        return false;
      }

      if (filters.clientName && !item.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) {
        return false;
      }

      if (filters.serviceType && !item.serviceType.toLowerCase().includes(filters.serviceType.toLowerCase())) {
        return false;
      }

      // Filtrar por nome do controlador de pragas
      if (filters.technicianName && !item.technicianName?.toLowerCase().includes(filters.technicianName.toLowerCase())) {
        return false;
      }

      // Filtrar por data inicial
      if (filters.startDate && new Date(item.createdAt) < new Date(filters.startDate)) {
        return false;
      }

      // Filtrar por data final
      if (filters.endDate && new Date(item.createdAt) > new Date(filters.endDate)) {
        return false;
      }

      return true;
    });

    setFilteredData(filtered);
  };

  const handleClear = () => {
    setFilters({
      orderNumber: '',
      clientName: '',
      serviceType: '',
      technicianName: '',
      startDate: undefined,
      endDate: undefined
    });
    setFilteredData(Array.isArray(data) ? data : []);
  };

  const handleDownloadPDF = async (orderNumber: string) => {
    if (billingInactive && role !== 'cliente') {
      console.error('Assinatura inativa. Apenas clientes podem realizar downloads.');
      return;
    }

    try {
      console.log('🔽 Iniciando download para OS:', orderNumber);
      const platform = Capacitor.getPlatform();
      console.log('📱 Plataforma detectada:', platform);

      // Importa o indexedDBService
      const { indexedDBService } = await import('../../services/indexedDBService');

      // Inicializa o IndexedDB
      await indexedDBService.initDB();

      // Busca o PDF do IndexedDB
      const pdfData = await indexedDBService.getPDF(orderNumber);

      if (!pdfData || !pdfData.pdf) {
        console.error('❌ PDF não encontrado para a OS:', orderNumber);
        alert('PDF não encontrado. Tente gerar o relatório novamente.');
        return;
      }

      console.log('✅ PDF encontrado:', { orderNumber, clientName: pdfData.clientName });

      // Detecta se é mobile ou desktop
      const isMobile = platform === 'android' || platform === 'ios';

      if (isMobile) {
        // Mobile: Usa o serviço de compartilhamento
        console.log('📱 Modo Mobile: Usando compartilhamento');
        try {
          const { fileSharingService } = await import('../../services/fileSharingService');
          const dateObj = pdfData.createdAt ? new Date(pdfData.createdAt) : new Date();
          const dateStr = dateObj.toLocaleDateString('pt-BR').replace(/\//g, '-');
          const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
          const sanitizedClientName = pdfData.clientName ? pdfData.clientName.replace(/[^a-zA-Z0-9\s-]/g, '').trim() : 'Cliente';

          const success = await fileSharingService.shareFile({
            filename: `OS_${orderNumber}_${sanitizedClientName}_${dateStr}_${timeStr}.pdf`,
            data: pdfData.pdf,
            mimeType: 'application/pdf'
          });

          if (success) {
            console.log('✅ Compartilhamento realizado com sucesso');
          } else {
            console.error('❌ Falha ao compartilhar arquivo');
            alert('Erro ao compartilhar PDF. Tente novamente.');
          }
        } catch (error) {
          console.error('❌ Erro no compartilhamento mobile:', error);
          alert('Erro ao compartilhar PDF. Tente novamente.');
        }
      } else {
        // Desktop/Web: Download direto
        console.log('💻 Modo Desktop: Fazendo download direto');
        try {
          // Converte base64 para Blob
          const base64Data = pdfData.pdf;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          // Cria link de download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const dateObj = pdfData.createdAt ? new Date(pdfData.createdAt) : new Date();
          const dateStr = dateObj.toLocaleDateString('pt-BR').replace(/\//g, '-');
          const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
          const sanitizedClientName = pdfData.clientName ? pdfData.clientName.replace(/[^a-zA-Z0-9\s-]/g, '').trim() : 'Cliente';

          const fileName = `OS_${orderNumber}_${sanitizedClientName}_${dateStr}_${timeStr}.pdf`;

          link.href = url;
          link.download = fileName;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();

          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);

          console.log('✅ Download concluído:', fileName);
        } catch (downloadError) {
          console.error('❌ Erro no download direto:', downloadError);
          alert('Erro ao fazer download do PDF. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('❌ Erro geral ao processar PDF:', error);
      alert('Erro ao processar PDF. Verifique se o PDF foi gerado corretamente.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const hasActiveFilters = filters.orderNumber || filters.clientName || filters.serviceType || filters.startDate || filters.endDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Downloads</h1>
              <p className="text-gray-500 mt-1">Gerencie suas ordens de serviço</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{filteredData.length}</span>
              <span>documento{filteredData.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Billing Warning */}
          {billingInactive && role !== 'cliente' && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <div className="font-semibold text-amber-900">Assinatura inativa</div>
                <div className="text-sm text-amber-700 mt-1">
                  Acesso restrito. Somente clientes podem fazer downloads.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Filtros de Pesquisa</div>
                <div className="text-sm text-gray-500">
                  {hasActiveFilters ? 'Filtros ativos' : 'Clique para filtrar resultados'}
                </div>
              </div>
            </div>
            <div className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showFilters && (
            <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Número da O.S.
                  </label>
                  <Input
                    placeholder="Ex: 12345"
                    value={filters.orderNumber}
                    onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome do Cliente
                  </label>
                  <select
                    value={filters.clientName}
                    onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todos os clientes</option>
                    {clientOptions.map((client) => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tipo de Serviço
                  </label>
                  <select
                    value={filters.serviceType}
                    onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todos os serviços</option>
                    {serviceTypeOptions.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Controlador de Pragas
                  </label>
                  <select
                    value={filters.technicianName}
                    onChange={(e) => setFilters({ ...filters, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todos os controladores</option>
                    {technicianOptions.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={filters.startDate ? new Date(filters.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={filters.endDate ? new Date(filters.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Quick Date Range Buttons */}
              <div className="pt-2 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Períodos Rápidos</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      setFilters({ ...filters, startDate: today, endDate: today });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const lastWeek = new Date(today);
                      lastWeek.setDate(today.getDate() - 7);
                      setFilters({ ...filters, startDate: lastWeek, endDate: today });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Últimos 7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date(today);
                      lastMonth.setDate(today.getDate() - 30);
                      setFilters({ ...filters, startDate: lastMonth, endDate: today });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Últimos 30 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                      setFilters({ ...filters, startDate: firstDay, endDate: today });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Mês Atual
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={handleSearch}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <Search size={18} />
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 font-medium">Carregando PDFs...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500">
                {hasActiveFilters
                  ? 'Tente ajustar os filtros de busca'
                  : 'Nenhuma ordem de serviço disponível para download'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filteredData.map((item, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">OS #{item.orderNumber}</div>
                        <div className="text-sm text-gray-500">{formatDate(item.createdAt)}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadPDF(item.orderNumber)}
                        disabled={billingInactive && role !== 'cliente'}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <Download size={16} />
                        Baixar
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item.clientName}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item.serviceType}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Número OS
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Controlador de Pragas
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tipo de Serviço
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">#{item.orderNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{formatDate(item.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.clientName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 font-medium">{item.technicianName || 'Não informado'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{item.serviceType}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleDownloadPDF(item.orderNumber)}
                            disabled={billingInactive && role !== 'cliente'}
                            className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
                          >
                            <Download size={16} />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadsManagement;