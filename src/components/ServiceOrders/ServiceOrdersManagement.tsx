import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DatePicker } from '../ui/date-picker';
import { getAllServiceOrders } from '../../services/ordemServicoService';
import { downloadPDFFromStorage, generateServiceOrderPDF } from '../../services/pdfService';
// import { toast } from 'react-toastify';
import { FileText, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceOrderDisplay {
  id: string;
  numOS: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  hasPDF: boolean;
}

const ServiceOrdersManagement = () => {
  const { companyId } = useAuth();
  console.log('ServiceOrdersManagement renderizado'); // Log para debug

  const [filters, setFilters] = useState({
    orderNumber: '',
    jde: '',
    fantasyName: '',
    startDate: null,
    endDate: null,
    technician: ''
  });

  const [data, setData] = useState<ServiceOrderDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [storedPDFs, setStoredPDFs] = useState<Record<string, any>>({});

  useEffect(() => {
    loadServiceOrders();
  }, []);

  const loadServiceOrders = () => {
    setLoading(true);
    try {
      // Carregar ordens de serviço do localStorage
      const orders = getAllServiceOrders();

      // Verificar PDFs armazenados
      const storedPDFsData = JSON.parse(localStorage.getItem('safeprag_service_order_pdfs') || '{}');
      setStoredPDFs(storedPDFsData);

      // Mapear ordens para o formato de exibição
      const displayOrders = orders.map(order => ({
        id: order.id,
        numOS: order.id.substring(0, 8).toUpperCase(),
        clientId: order.clientId,
        clientName: order.clientName,
        serviceType: order.serviceType || 'Serviço Padrão',
        date: order.date,
        startTime: order.startTime,
        endTime: order.endTime,
        status: order.status,
        hasPDF: !!storedPDFsData[order.id]
      }));

      setData(displayOrders);
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço:', error);
      // toast.error('Erro ao carregar ordens de serviço');
      console.error('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Carregar todas as ordens
    const orders = getAllServiceOrders();

    // Filtrar com base nos critérios
    const filtered = orders.filter(order => {
      // Filtrar por número da OS
      if (filters.orderNumber && !order.id.toLowerCase().includes(filters.orderNumber.toLowerCase())) {
        return false;
      }

      // Filtrar por código do cliente
      if (filters.jde && !order.clientId.toLowerCase().includes(filters.jde.toLowerCase())) {
        return false;
      }

      // Filtrar por nome fantasia
      if (filters.fantasyName && !order.clientName.toLowerCase().includes(filters.fantasyName.toLowerCase())) {
        return false;
      }

      // Filtrar por data inicial
      if (filters.startDate && new Date(order.date) < new Date(filters.startDate)) {
        return false;
      }

      // Filtrar por data final
      if (filters.endDate && new Date(order.date) > new Date(filters.endDate)) {
        return false;
      }

      // Filtrar por técnico (implementar quando houver campo de técnico)
      // if (filters.technician && !order.technician.toLowerCase().includes(filters.technician.toLowerCase())) {
      //   return false;
      // }

      return true;
    });

    // Verificar PDFs armazenados
    const storedPDFsData = JSON.parse(localStorage.getItem('safeprag_service_order_pdfs') || '{}');

    // Mapear para o formato de exibição
    const displayOrders = filtered.map(order => ({
      id: order.id,
      numOS: order.id.substring(0, 8).toUpperCase(),
      clientId: order.clientId,
      clientName: order.clientName,
      serviceType: order.serviceType || 'Serviço Padrão',
      date: order.date,
      startTime: order.startTime,
      endTime: order.endTime,
      status: order.status,
      hasPDF: !!storedPDFsData[order.id]
    }));

    setData(displayOrders);
  };

  const handleClear = () => {
    setFilters({
      orderNumber: '',
      jde: '',
      fantasyName: '',
      startDate: null,
      endDate: null,
      technician: ''
    });
  };

  const handleExport = () => {
    try {
      // Criar CSV com os dados filtrados
      const headers = ['Num. O.S.', 'Código do Cliente', 'Nome Fantasia', 'Tipo de Serviço', 'Data', 'Status'];
      const csvContent = [
        headers.join(','),
        ...data.map(item => [
          item.numOS,
          item.clientId,
          item.clientName,
          item.serviceType,
          item.date,
          item.status
        ].join(','))
      ].join('\n');

      // Criar blob e download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ordens_servico_${new Date().toISOString().split('T')[0]}.csv`);
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

  const handleViewServiceOrder = (id: string) => {
    try {
      // Verificar se já existe PDF armazenado
      if (storedPDFs[id]) {
        // Se existir, fazer download
        downloadPDFFromStorage(id);
      } else {
        // Se não existir, gerar novo PDF
        const orders = getAllServiceOrders();
        const order = orders.find(o => o.id === id);

        if (!order) {
          // toast.error('Ordem de serviço não encontrada');
          console.error('Ordem de serviço não encontrada');
          return;
        }

        // Preparar dados para o PDF
        const pdfData = {
          orderNumber: id,
          date: order.date,
          startTime: order.startTime,
          endTime: order.endTime,
          client: {
            code: order.clientId,
            name: order.clientName,
            address: order.clientAddress,
            branch: order.clientName,
            document: '',
            city: '',
            contact: '',
            phone: '',
            email: ''
          },
          service: {
            type: order.serviceType || 'Serviço Padrão',
            description: 'Controle de pragas',
            notes: order.notes || ''
          },
          // Incluir dados de contagem de pragas, se existirem
          pestCounts: order.pestCounts || [],
          signatures: {
            client: order.signatures?.client || '',
            technician: order.signatures?.technician || ''
          }
        };

        // Gerar PDF
        generateServiceOrderPDF(pdfData, companyId || 'default')
          .then(() => {
            // toast.success('PDF gerado com sucesso!');
            console.log('PDF gerado com sucesso!');
            loadServiceOrders(); // Recarregar para atualizar status de PDF
          })
          .catch(error => {
            console.error('Erro ao gerar PDF:', error);
            // toast.error('Erro ao gerar PDF');
            console.error('Erro ao gerar PDF');
          });
      }
    } catch (error) {
      console.error('Erro ao visualizar ordem de serviço:', error);
      // toast.error('Erro ao visualizar ordem de serviço');
      console.error('Erro ao visualizar ordem de serviço');
    }
  };

  const handleViewCertificate = (id: string) => {
    // Implementação futura para certificados
    // toast.info('Funcionalidade de certificado será implementada em breve');
    console.log('Funcionalidade de certificado será implementada em breve');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Input
          placeholder="Num. O.S."
          value={filters.orderNumber}
          onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
          className="w-full"
        />
        <Input
          placeholder="Código do Cliente"
          value={filters.jde}
          onChange={(e) => setFilters({ ...filters, jde: e.target.value })}
          className="w-full"
        />
        <Input
          placeholder="Nome Fantasia"
          value={filters.fantasyName}
          onChange={(e) => setFilters({ ...filters, fantasyName: e.target.value })}
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
        <Input
          placeholder="Controlador de Pragas"
          value={filters.technician}
          onChange={(e) => setFilters({ ...filters, technician: e.target.value })}
          className="w-full"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <Button
          onClick={handleSearch}
          className="w-full sm:w-auto"
        >
          PROCURAR
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          className="w-full sm:w-auto"
        >
          LIMPAR
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="w-full sm:w-auto"
        >
          EXPORTAR
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 bg-blue-100 rounded-lg">
          <p className="font-bold">Carregando ordens de serviço...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8">
          <p>Nenhuma ordem de serviço encontrada.</p>
        </div>
      ) : (
        <>
          {/* Cards para telas pequenas */}
          <div className="sm:hidden space-y-4">
            {data.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{item.numOS}</div>
                    <div className="text-sm text-gray-500">Código do Cliente: {item.clientId}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="warning"
                      onClick={() => handleViewServiceOrder(item.id)}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <FileText size={16} />
                      {item.hasPDF ? 'Ver PDF' : 'Gerar PDF'}
                    </Button>
                    {item.status === 'completed' && (
                      <Button
                        variant="success"
                        onClick={() => handleViewCertificate(item.id)}
                        size="sm"
                      >
                        CERTIFICADO
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <span className="text-gray-500">Nome Fantasia:</span>
                    <span className="ml-2">{item.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo de Serviço:</span>
                    <span className="ml-2">{item.serviceType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <span className="ml-2">{item.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 capitalize">{item.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tabela para telas maiores */}
      {!loading && data.length > 0 && (
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Num. O.S.</TableHead>
                <TableHead className="whitespace-nowrap">Código do Cliente</TableHead>
                <TableHead className="whitespace-nowrap">Nome Fantasia</TableHead>
                <TableHead className="whitespace-nowrap">Tipo de Serviço</TableHead>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="whitespace-nowrap">{item.numOS}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.clientId}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.clientName}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.serviceType}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.date}</TableCell>
                  <TableCell className="whitespace-nowrap capitalize">{item.status.replace('_', ' ')}</TableCell>
                  <TableCell className="whitespace-nowrap space-x-2">
                    <Button
                      variant="warning"
                      onClick={() => handleViewServiceOrder(item.id)}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {item.hasPDF ? <Download size={16} /> : <FileText size={16} />}
                      {item.hasPDF ? 'Download' : 'Gerar PDF'}
                    </Button>
                    {item.status === 'completed' && (
                      <Button
                        variant="success"
                        onClick={() => handleViewCertificate(item.id)}
                        size="sm"
                      >
                        CERTIFICADO
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ServiceOrdersManagement;
