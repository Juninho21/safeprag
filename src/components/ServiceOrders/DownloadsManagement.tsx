import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DatePicker } from '../ui/date-picker';
import { getAllServiceOrders } from '../../services/ordemServicoService';
import { downloadPDFFromStorage, getAllStoredPDFs } from '../../services/pdfService';
import { fileSharingService } from '../../services/fileSharingService';
import { Capacitor } from '@capacitor/core';
// import { toast } from 'react-toastify';
import { Download, FileText, Search, X, Share as ShareIcon } from 'lucide-react';

interface StoredPDF {
  orderNumber: string;
  createdAt: string;
  clientName: string;
  serviceType: string;
}

interface DownloadsManagementProps {
  // Propriedades adicionais podem ser adicionadas conforme necessário
}

const DownloadsManagement: React.FC<DownloadsManagementProps> = () => {
  const [filters, setFilters] = useState({
    orderNumber: '',
    clientName: '',
    serviceType: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  });

  const [data, setData] = useState<StoredPDF[]>([]);
  const [filteredData, setFilteredData] = useState<StoredPDF[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPDFs = async () => {
      await loadPDFs();
    };
    fetchPDFs();
  }, []);

  const loadPDFs = async () => {
    setLoading(true);
    try {
      // Carregar todos os PDFs armazenados (função agora é assíncrona)
      const storedPDFs = await getAllStoredPDFs();
      // Garantir que sempre seja um array
      const pdfArray = Array.isArray(storedPDFs) ? storedPDFs : [];
      setData(pdfArray);
      setFilteredData(pdfArray);
    } catch (error) {
      console.error('Erro ao carregar PDFs:', error);
      // toast.error('Erro ao carregar PDFs');
      console.error('Erro ao carregar PDFs');
      // Em caso de erro, inicializar com arrays vazios
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!Array.isArray(data)) {
      console.error('Dados não estão em formato de array');
      return;
    }
    
    const filtered = data.filter(item => {
      // Filtrar por número da OS
      if (filters.orderNumber && !item.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())) {
        return false;
      }
      
      // Filtrar por nome do cliente
      if (filters.clientName && !item.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) {
        return false;
      }
      
      // Filtrar por tipo de serviço
      if (filters.serviceType && !item.serviceType.toLowerCase().includes(filters.serviceType.toLowerCase())) {
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
      startDate: undefined,
      endDate: undefined
    });
    // Garantir que data seja um array antes de atribuir
    setFilteredData(Array.isArray(data) ? data : []);
  };

  const handleExport = () => {
    try {
      // Verificar se filteredData é um array
      if (!Array.isArray(filteredData)) {
        console.error('Dados filtrados não estão em formato de array');
        return;
      }
      
      // Criar CSV com os dados filtrados
      const headers = ['Num. O.S.', 'Data de Criação', 'Nome do Cliente', 'Tipo de Serviço'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
          item.orderNumber,
          new Date(item.createdAt).toLocaleDateString('pt-BR'),
          item.clientName,
          item.serviceType
        ].join(','))
      ].join('\n');
      
      // Criar blob e download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `downloads_os_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // toast.success('Dados exportados com sucesso!');
      console.log('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      // toast.error('Erro ao exportar dados');
      console.error('Erro ao exportar dados');
    }
  };

  const handleDownloadPDF = async (orderNumber: string) => {
    try {
      console.log('Iniciando compartilhamento para OS:', orderNumber);
      console.log('Plataforma detectada:', Capacitor.getPlatform());
      
      // Verificar se o serviço está disponível
      if (!fileSharingService) {
        console.error('Serviço de compartilhamento não disponível');
        return;
      }
      
      // Verificar se o compartilhamento é suportado
      if (!fileSharingService.isSharingSupported()) {
        console.log('Compartilhamento não suportado, fazendo download direto');
        // Fallback para download direto usando localStorage
        try {
          const storedPDFs = JSON.parse(localStorage.getItem('safeprag_service_order_pdfs') || '{}');
          const pdfData = storedPDFs[orderNumber]?.pdf;
          if (pdfData) {
            const blob = new Blob([pdfData], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `OS_${orderNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('Download direto concluído');
          } else {
            console.error('PDF não encontrado para download direto');
          }
        } catch (downloadError) {
          console.error('Erro no download direto:', downloadError);
        }
        return;
      }
      
      // Usa o novo serviço de compartilhamento
      console.log('Chamando serviço de compartilhamento...');
      const success = await fileSharingService.shareServiceOrderPDF(orderNumber);
      
      if (success) {
        console.log('Compartilhamento realizado com sucesso');
      } else {
        console.error('Falha ao compartilhar arquivo');
      }
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      
      // Tratamento de erros mais específico
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('PDF salvo com sucesso')) {
        // Se o erro na verdade indica sucesso (arquivo salvo mas não aberto)
        console.log(errorMessage);
      } else if (errorMessage.includes('PDF não encontrado')) {
        console.error('PDF não encontrado. Tente gerar o relatório novamente.');
      } else if (errorMessage.includes('listener failed to fetch')) {
        console.error('Erro de conectividade. Tente novamente ou use o navegador padrão.');
      } else {
        console.error(`Erro ao processar PDF: ${errorMessage}`);
      }
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl font-bold mb-4">Downloads de Ordens de Serviço</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Input
          placeholder="Número da O.S."
          value={filters.orderNumber}
          onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
          className="w-full"
        />
        <Input
          placeholder="Nome do Cliente"
          value={filters.clientName}
          onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
          className="w-full"
        />
        <Input
          placeholder="Tipo de Serviço"
          value={filters.serviceType}
          onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
          className="w-full"
        />
        <DatePicker
          placeholder="Data Inicial"
          value={filters.startDate}
          onChange={(date) => setFilters({ ...filters, startDate: date })}
        />
        <DatePicker
          placeholder="Data Final"
          value={filters.endDate}
          onChange={(date) => setFilters({ ...filters, endDate: date })}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <Button 
          onClick={handleSearch}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Search size={16} />
          PROCURAR
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClear}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <X size={16} />
          LIMPAR
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExport}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Download size={16} />
          EXPORTAR CSV
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 bg-blue-100 rounded-lg">
          <p className="font-bold">Carregando PDFs...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-8 bg-gray-100 rounded-lg">
          <p>Nenhum PDF encontrado.</p>
        </div>
      ) : (
        <>
          {/* Cards para telas pequenas */}
          <div className="sm:hidden space-y-4">
            {filteredData.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">OS: {item.orderNumber}</div>
                    <div className="text-sm text-gray-500">Data: {formatDate(item.createdAt)}</div>
                  </div>
                  <Button 
                    variant="warning"
                    onClick={() => handleDownloadPDF(item.orderNumber)}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <ShareIcon size={16} />
                    Compartilhar
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-500">Cliente:</span>
                    <span className="ml-2">{item.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo de Serviço:</span>
                    <span className="ml-2">{item.serviceType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela para telas maiores */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Num. O.S.</TableHead>
                  <TableHead className="whitespace-nowrap">Data de Criação</TableHead>
                  <TableHead className="whitespace-nowrap">Nome do Cliente</TableHead>
                  <TableHead className="whitespace-nowrap">Tipo de Serviço</TableHead>
                  <TableHead className="whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="whitespace-nowrap">{item.orderNumber}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.clientName}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.serviceType}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button 
                        variant="warning"
                        onClick={() => handleDownloadPDF(item.orderNumber)}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ShareIcon size={16} />
                        Compartilhar PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default DownloadsManagement;