// @ts-ignore
import html2pdf from 'html2pdf.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ServiceOrderPDFData } from '../types/pdf.types';
import { getNextOSNumber } from './counterService';
// Removido: imports do Supabase
import { fileSharingService } from './fileSharingService';
import { Capacitor } from '@capacitor/core';
import { indexedDBService } from './indexedDBService';
import { getCompany } from './companyService';

interface CompanyData {
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  email: string;
  logo_url?: string;
  environmental_license?: {
    number: string;
    date: string;
  };
  sanitary_permit?: {
    number: string;
    expiry_date: string;
  };
}


const COMPANY_STORAGE_KEY = 'safeprag_company_data';
const SERVICE_ORDERS_KEY = 'safeprag_service_orders';

// Helper para formatar data para nome de arquivo (DD-MM-YYYY)
const formatFilenameDate = (dateStr?: string): string => {
  if (!dateStr) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Se já estiver no formato brasileiro (com / ou -)
  if (dateStr.includes('/')) return dateStr.replace(/\//g, '-');
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) return dateStr;

  // Se estiver em ISO (YYYY-MM-DD)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

  return dateStr.replace(/\//g, '-');
};

// Função para compressão de imagem em Base64
const compressImage = async (base64Str: string, maxWidth = 800, maxQuality = 0.7): Promise<string> => {
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', maxQuality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

// Helper para construir o nome do arquivo padronizado
const constructFilename = async (
  orderNumber: string,
  date: string,
  technicianName?: string,
  clientName?: string
): Promise<string> => {
  try {
    const { storageService } = await import('./storageService');

    // Formatar data
    const formattedDate = formatFilenameDate(date);

    // Nome do técnico
    let techName = technicianName;

    // Se o nome do técnico não foi passado ou é inválido, tenta buscar nos dados locais
    if (!techName || techName === 'Não informado' || techName === 'Controlador') {
      try {
        // Tenta buscar da assinatura salva
        const signaturesData = JSON.parse(localStorage.getItem('safeprag_signatures') || '[]');
        const controladorSig = signaturesData
          .filter((sig: any) => sig.signature_type === 'controlador')
          .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0];

        if (controladorSig?.controlador_name) {
          techName = controladorSig.controlador_name;
        } else {
          // Tenta buscar do usuário logado
          const userData = storageService.getUserData();
          if (userData?.name) {
            techName = userData.name;
          }
        }
      } catch (e) {
        console.warn('Erro ao buscar fallback de nome de técnico', e);
      }
    }

    // Fallback final
    techName = techName || 'Controlador';

    // Sanitizar strings para nome de arquivo
    const safeClientName = (clientName || 'Cliente').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const safeTechName = techName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();

    // Formato: [Cliente] - [OS] - [Date] - [Tech]
    return `${safeClientName} - ${orderNumber} - ${formattedDate} - ${safeTechName}`;
  } catch (error) {
    console.warn('Erro ao construir nome do arquivo:', error);
    return `OS-${orderNumber}`;
  }
};

// Função para salvar o PDF no IndexedDB
export const storeServiceOrderPDF = async (pdfBlob: Blob, serviceData: ServiceOrderPDFData): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Converter Blob para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64PDF = (reader.result as string).split(',')[1];

          // Determinar o tipo de serviço principal para exibição
          // Se houver múltiplos serviços, usa o primeiro da lista
          // Caso contrário, usa o serviço único (compatibilidade)
          const serviceType = serviceData.services && serviceData.services.length > 0
            ? serviceData.services[0].type
            : (serviceData.service ? serviceData.service.type : 'Serviço');

          // Obter nome do controlador de pragas usando a MESMA lógica do PDF
          // Buscar assinaturas do localStorage
          const signaturesData = JSON.parse(localStorage.getItem('safeprag_signatures') || '[]');
          const controladorData = signaturesData
            .filter((sig: any) => sig.signature_type === 'controlador')
            .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0] || null;

          // Buscar userData como fallback
          const { STORAGE_KEYS } = await import('./storageKeys');
          const userDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA) || localStorage.getItem('userData');
          let userData = null;
          if (userDataStr) {
            try {
              userData = JSON.parse(userDataStr);
            } catch (e) {
              console.error('Erro ao parsear userData:', e);
            }
          }

          // Usa a mesma lógica do PDF: controladorData primeiro, depois userData
          const technicianName = controladorData?.controlador_name || userData?.name || 'Não informado';

          // Inicializar IndexedDB se necessário
          await indexedDBService.initDB();

          // Armazenar no IndexedDB
          await indexedDBService.storePDF({
            orderNumber: serviceData.orderNumber,
            pdf: base64PDF,
            createdAt: new Date().toISOString(),
            clientName: serviceData.client.name,
            serviceType: serviceType,
            clientCode: serviceData.client.code,
            services: serviceData.services || [serviceData.service],
            technicianName: technicianName,
            serviceDate: serviceData.date
          });
          resolve();
        } catch (innerError) {
          console.error('Erro interno ao armazenar PDF:', innerError);
          reject(innerError);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error('Erro ao iniciar armazenamento do PDF:', error);
      reject(error);
    }
  });
};

// Função para obter todos os PDFs armazenados
export const getAllStoredPDFs = async () => {
  try {
    // Inicializar IndexedDB se necessário
    await indexedDBService.initDB();

    // Buscar todos os PDFs do IndexedDB
    const pdfs = await indexedDBService.getAllPDFs();

    return pdfs.map(data => ({
      orderNumber: data.orderNumber,
      createdAt: data.createdAt,
      clientName: data.clientName,
      serviceType: data.serviceType,
      pdf: data.pdf,
      technicianName: data.technicianName,
      serviceDate: data.serviceDate
    }));
  } catch (error) {
    console.error('Erro ao recuperar PDFs:', error);
    return [];
  }
};

// Função para compartilhar PDF já salvo no localStorage
export const sharePDFFromStorage = async (orderNumber: string): Promise<void> => {
  try {
    // Inicializar IndexedDB se necessário
    await indexedDBService.initDB();

    // Buscar PDF do IndexedDB
    const pdfData = await indexedDBService.getPDF(orderNumber);

    if (!pdfData) {
      throw new Error('PDF não encontrado no armazenamento');
    }

    // Tenta usar a data do serviço (serviceDate) ou fallback para createdAt
    const dateStr = pdfData.serviceDate || (pdfData.createdAt ? new Date(pdfData.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'));

    // Tenta obter o nome do técnico do PDF, ou usa fallback
    let technicianName = pdfData.technicianName;

    // Se não tiver nome técnico no PDF (legado), tenta buscar das assinaturas ou user data
    if (!technicianName) {
      try {
        // Tenta buscar assinatura do controlador
        const signaturesString = localStorage.getItem('safeprag_signatures');
        const signaturesData = signaturesString ? JSON.parse(signaturesString) : [];
        const controladorSig = signaturesData
          .filter((sig: any) => sig.signature_type === 'controlador')
          .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0];

        if (controladorSig?.controlador_name) {
          technicianName = controladorSig.controlador_name;
        } else {
          // Tenta dados do usuário
          const userDataString = localStorage.getItem('safeprag_user_data') || localStorage.getItem('userData');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            if (userData?.name) technicianName = userData.name;
          }
        }
      } catch (e) {
        console.warn('Erro ao tentar recuperar technicianName fallback no share', e);
      }
    }

    // Construir nome do arquivo padrão
    const filename = await constructFilename(
      orderNumber,
      dateStr,
      technicianName,
      pdfData.clientName
    );

    if (Capacitor.isNativePlatform()) {
      const { fileSharingService } = await import('./fileSharingService');

      const success = await fileSharingService.shareFile({
        filename: `${filename}.pdf`,
        data: pdfData.pdf,
        mimeType: 'application/pdf'
      });

      if (!success) {
        throw new Error('Falha no compartilhamento do PDF');
      }
    } else {
      // Em plataformas web, fazer download
      await downloadPDFWeb(pdfData.pdf, orderNumber, filename);
    }
  } catch (error) {
    console.error('Erro ao compartilhar PDF do armazenamento:', error);
    throw error;
  }
};

// Função para baixar um PDF específico
export const downloadPDFFromStorage = async (orderNumber: string): Promise<void> => {
  try {
    // Inicializar IndexedDB se necessário
    await indexedDBService.initDB();

    // Buscar PDF do IndexedDB
    const pdfData = await indexedDBService.getPDF(orderNumber);

    if (!pdfData) {
      throw new Error('PDF não encontrado');
    }

    // Tenta usar a data do serviço (serviceDate) ou fallback para createdAt
    const dateStr = pdfData.serviceDate || (pdfData.createdAt ? new Date(pdfData.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'));

    // Construir nome do arquivo padrão
    const downloadFilename = await constructFilename(
      orderNumber,
      dateStr,
      pdfData.technicianName,
      pdfData.clientName
    );

    // Verificar se estamos em uma plataforma nativa (Capacitor)
    if (Capacitor.isNativePlatform()) {
      // Em dispositivos nativos, usar o serviço de compartilhamento
      try {
        const success = await fileSharingService.shareFile({
          filename: `${downloadFilename}.pdf`,
          data: pdfData.pdf,
          mimeType: 'application/pdf'
        });

        if (!success) {
          throw new Error('Falha no compartilhamento nativo');
        }
        return;
      } catch (shareError) {
        console.warn('Compartilhamento nativo falhou, tentando download direto:', shareError);
        // Continua para o fallback de download direto
      }
    }

    // Detecta se está rodando no Capacitor nativo (não PWA)
    const isCapacitor = !!(window as any).Capacitor;
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Só usa Capacitor se estiver realmente no app nativo, não no PWA
    if (isCapacitor && !isPWA) {
      // Para dispositivos móveis, usa uma abordagem mais direta
      try {
        const { FileService } = await import('./FileService');

        // Converte base64 diretamente para o FileService
        const fileName = downloadFilename;

        // Usa o Filesystem diretamente para evitar problemas com Blob
        const { Filesystem, Directory } = await import('@capacitor/filesystem');

        // Tenta salvar no diretório Downloads primeiro
        let result;
        try {
          result = await Filesystem.writeFile({
            path: `Download/${fileName}.pdf`,
            data: pdfData.pdf, // Usa diretamente os dados base64
            directory: Directory.ExternalStorage,
            recursive: true
          });
        } catch (externalError) {
          // Se falhar, tenta no diretório Documents
          result = await Filesystem.writeFile({
            path: `${fileName}.pdf`,
            data: pdfData.pdf,
            directory: Directory.Documents,
            recursive: true
          });
        }

        console.log('PDF salvo em:', result.uri);

        // Tenta abrir/compartilhar o arquivo
        try {
          await FileService.openPDF(result.uri);
        } catch (openError) {
          // Se não conseguir abrir, pelo menos informa que foi salvo
          console.log('PDF salvo com sucesso, mas não foi possível abri-lo automaticamente');
          throw new Error('PDF salvo com sucesso! Verifique a pasta Downloads ou Documentos do seu dispositivo.');
        }

      } catch (capacitorError) {
        console.error('Erro no Capacitor, tentando método web:', capacitorError);
        // Fallback para método web se o Capacitor falhar
        await downloadPDFWeb(pdfData.pdf, orderNumber, downloadFilename);
      }
    } else if (isPWA && isMobile) {
      // Para PWA em dispositivos móveis, usa uma abordagem otimizada
      try {
        await downloadPDFForPWA(pdfData.pdf, orderNumber, downloadFilename);
      } catch (pwaError) {
        console.error('Erro no PWA, usando método web padrão:', pwaError);
        await downloadPDFWeb(pdfData.pdf, orderNumber, downloadFilename);
      }
    } else {
      // Usa o método tradicional para navegadores web
      await downloadPDFWeb(pdfData.pdf, orderNumber, downloadFilename);
    }
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    throw error;
  }
};

// Função específica para PWA em dispositivos móveis
const downloadPDFForPWA = async (base64Data: string, orderNumber: string, name: string = `ordem-servico-${orderNumber}`): Promise<void> => {
  try {
    // Converte base64 para blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const fileName = name.endsWith('.pdf') ? name : `${name}.pdf`;

    // Tenta usar Web Share API se disponível (Android PWA)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Ordem de Serviço PDF',
          text: `PDF da Ordem de Serviço ${orderNumber}`,
          files: [file]
        });
        return;
      }
    }

    // Fallback: tenta usar File System Access API se disponível
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'PDF files',
            accept: { 'application/pdf': ['.pdf'] }
          }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (fsError) {
        console.log('File System Access API falhou:', fsError);
      }
    }

    // Fallback final: download tradicional
    await downloadPDFWeb(base64Data, orderNumber, name);

  } catch (error) {
    console.error('Erro no download PWA:', error);
    throw error;
  }
};

// Função auxiliar para download web
const downloadPDFWeb = async (base64Data: string, orderNumber: string, name: string = `ordem-servico-${orderNumber}`): Promise<void> => {
  try {
    // Converte base64 para blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Usa o nome passado ou gera um padrão
    const finalFilename = name.endsWith('.pdf') ? name : `${name}.pdf`;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro no download web:', error);
    throw error;
  }
}

export const generateServiceOrderPDF = async (
  serviceData: ServiceOrderPDFData,
  companyId: string
) => {
  // Verificação de assinatura antes de gerar PDF
  try {
    const { storageService } = await import('./storageService');
    const { billingService } = await import('./billingService');
    const userData = storageService.getUserData();
    const role = (userData?.role || 'cliente') as 'admin' | 'controlador' | 'cliente';

    if (role !== 'cliente') {
      try {
        const status = await billingService.getStatus(companyId);
        if (!status?.active) {
          throw new Error('Assinatura inativa. Geração de PDF bloqueada para administradores e controladores.');
        }
      } catch (e) {
        // Mensagem clara ao usuário
        const msg = e instanceof Error ? e.message : 'Falha ao validar assinatura';
        throw new Error(msg);
      }
    }
  } catch (precheckError) {
    console.error('[Billing] Bloqueio de geração de PDF:', precheckError);
    throw precheckError;
  }
  // Garantir que o array de serviços exista
  if (!serviceData.services) {
    // Se não existir, criar um array com o serviço único (para compatibilidade)
    serviceData.services = serviceData.service ? [serviceData.service] : [];
  }

  // Log dos dados recebidos
  console.log('Dados recebidos no pdfService:', serviceData);
  console.log('Dados do cliente recebidos:', serviceData.client);

  try {
    // Gerar número sequencial da OS
    const osNumber = getNextOSNumber();
    serviceData.orderNumber = osNumber.toString();

    // Buscar dados da empresa usando a função melhorada
    let companyData = await getCompanyData(companyId);

    // Buscar dados da assinatura do cliente do localStorage
    const clientSignatureData = localStorage.getItem('client_signature_data');
    let clientData = null;
    if (clientSignatureData) {
      try {
        clientData = JSON.parse(clientSignatureData);
      } catch (error) {
        console.error('Erro ao parsear dados da assinatura do cliente:', error);
      }
    }

    // Os dados do cliente agora vêm corretamente do App.tsx
    console.log('Dados do cliente recebidos para o PDF:', serviceData.client);

    // Buscar agendamentos do localStorage usando a chave correta
    const schedulesData = localStorage.getItem('safeprag_schedules') || localStorage.getItem('schedules');
    let schedules = [];
    if (schedulesData) {
      try {
        schedules = JSON.parse(schedulesData);
      } catch (error) {
        console.error('Erro ao parsear agendamentos:', error);
      }
    }

    // Buscar dados completos do cliente do localStorage usando a chave correta
    const clientsData = localStorage.getItem('safeprag_clients') || localStorage.getItem('clients');
    let clients = [];
    if (clientsData) {
      try {
        clients = JSON.parse(clientsData);
      } catch (error) {
        console.error('Erro ao parsear dados dos clientes:', error);
      }
    }

    // Encontrar o cliente específico
    const fullClientData = clients.find(client =>
      client.id === serviceData.clientCode ||
      client.code === serviceData.clientCode ||
      (serviceData.client && client.id === serviceData.client.id)
    );

    // Buscar ordens de serviço ativas do localStorage
    const activeOrdersData = localStorage.getItem('safeprag_service_orders') || localStorage.getItem('activeServiceOrders');
    let activeOrders = [];
    if (activeOrdersData) {
      try {
        activeOrders = JSON.parse(activeOrdersData);
      } catch (error) {
        console.error('Erro ao parsear ordens de serviço ativas:', error);
      }
    }

    // Verifica se existem dados retroativos no localStorage (múltiplas fontes)
    let retroactiveData = null;

    // Buscar dados retroativos da chave principal
    const retroactiveDataStr = localStorage.getItem('retroactive_service_data');
    if (retroactiveDataStr) {
      try {
        retroactiveData = JSON.parse(retroactiveDataStr);
      } catch (error) {
        console.error('Erro ao parsear dados retroativos principais:', error);
      }
    }

    // Buscar dados retroativos específicos do cliente
    const clientRetroactiveData = localStorage.getItem(`retroactiveData_${serviceData.clientCode}`);
    if (clientRetroactiveData && !retroactiveData) {
      try {
        retroactiveData = JSON.parse(clientRetroactiveData);
      } catch (error) {
        console.error('Erro ao parsear dados retroativos do cliente:', error);
      }
    }

    // Aplicar dados retroativos se existirem
    if (retroactiveData && retroactiveData.isRetroactive) {
      serviceData.date = retroactiveData.date || serviceData.date;
      serviceData.startTime = retroactiveData.startTime || serviceData.startTime;
      serviceData.endTime = retroactiveData.endTime || serviceData.endTime;

      // Aplicar outros dados retroativos se disponíveis
      if (retroactiveData.clientData) {
        serviceData.client = { ...serviceData.client, ...retroactiveData.clientData };
      }

      console.log('Dados retroativos aplicados ao PDF:', retroactiveData);
    }

    // Função para formatar data no padrão brasileiro (DD/MM/YYYY)
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        // Primeiro, verifica se a data já está no formato DD/MM/YYYY
        const brRegex = /^(\d{2})\/?(\d{2})\/?(\d{4})$/;
        const brMatch = dateStr.match(brRegex);

        if (brMatch) {
          // Já está no formato brasileiro, apenas padroniza
          return `${brMatch[1]}/${brMatch[2]}/${brMatch[3]}`;
        }

        // Verifica se está no formato YYYY-MM-DD (ISO)
        const isoRegex = /^(\d{4})-?(\d{2})-?(\d{2}).*$/;
        const isoMatch = dateStr.match(isoRegex);

        if (isoMatch) {
          // Converte de ISO para brasileiro
          return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
        }

        // Tenta interpretar a data usando o objeto Date
        const date = new Date(dateStr);

        if (!isNaN(date.getTime())) {
          // Formatação manual para garantir o padrão brasileiro DD/MM/YYYY
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
          const year = date.getFullYear();

          return `${day}/${month}/${year}`;
        }

        // Se chegou aqui, não conseguiu interpretar a data
        console.warn('Formato de data não reconhecido:', dateStr);
        return dateStr; // Retorna o texto original
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        return dateStr; // Em caso de erro, retorna o texto original
      }
    };

    // Função para formatar hora no padrão HH:mm (sem segundos)
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '--:--';
      // Se não for um horário válido (ex.: "N/A"), retorna o texto original
      const isValid = /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr);
      if (!isValid) return timeStr;
      try {
        const [hours, minutes] = timeStr.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      } catch (error) {
        console.error('Erro ao formatar hora:', error);
        return timeStr; // Em caso de erro, retorna o texto original
      }
    };

    // Função para calcular a duração foi removida conforme solicitado


    // Criar um elemento temporário para o relatório
    const reportElement = document.createElement('div');
    reportElement.className = 'report-container';

    // Adiciona estilos globais
    const style = document.createElement('style');
    style.textContent = `
      @page {
        margin: 10mm 10mm 10mm 10mm;
      }
      .report-container {
        padding: 0;
        font-family: Arial, sans-serif;
      }
      .section-container {
        page-break-inside: auto;
        break-inside: auto;
        margin-bottom: 10px;
      }
      .complementary-section {
        margin-top: 20px;
      }
      table {
        margin: 0;
        padding: 0;
        border-collapse: collapse;
        width: 100%;
        /* permitir que a tabela quebre entre páginas por padrão */
        page-break-inside: auto;
      }
      .bordered-table {
        border: 0.5px solid #999;
      }
      .bordered-table th, .bordered-table td {
        border: 0.5px solid #999;
      }
      /* Wrapper de cada bloco de tabela da contagem de pragas: nunca quebrar dentro */
      .table-wrapper {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      /* Evitar cortes dentro de cada linha da tabela, permitindo que a própria tabela quebre entre páginas e repetindo cabeçalho */
      thead { display: table-header-group !important; page-break-after: avoid; break-after: avoid; }
      tbody { display: table-row-group; }
      tfoot { display: table-footer-group; }
      table, thead, tbody, tfoot { 
        page-break-inside: auto; 
        break-inside: auto; 
      }
      tr { 
        page-break-inside: avoid !important; 
        break-inside: avoid !important; 
      }
      td, th { 
        page-break-inside: auto; 
        break-inside: auto; 
      }
      tbody tr:first-child { 
        page-break-before: avoid; 
        break-before: avoid; 
      }
      /* cabeçalho duplicado inserido via JS quando houver quebra de página */
      .thead-duplicate-row th {
        background-color: #1a73e8;
        color: #fff;
        border: 0.5px solid #999;
        padding: 3px;
        text-align: center;
        vertical-align: middle;
        line-height: 1.3;
      }
      /* linhas mais compactas na tabela de contagem de pragas */
      .pest-count-table th,
      .pest-count-table td {
        padding: 4px 3px;
      }
      .pest-count-table td {
        border: 0.5px solid #999;
        text-align: center;
        vertical-align: middle;
        line-height: 1.2;
      }
      /* Não permitir corte dentro da tabela de contagem de pragas */
      .pest-count-table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    document.head.appendChild(style);

    // Função auxiliar para converter URL de imagem em Base64 com compressão para o PDF
    const imageUrlToBase64 = async (url: string): Promise<string> => {
      if (!url) return '';
      // Se já for data URI (base64) e for imagem, tenta comprimir
      if (typeof url === 'string' && url.startsWith('data:image')) {
        return await compressImage(url, 500, 0.6);
      }
      if (typeof url === 'string' && url.startsWith('data:')) return url;

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        // Comprime o resultado do fetch
        return await compressImage(base64, 500, 0.6);
      } catch (error) {
        console.error('Erro ao converter imagem para base64:', error);

        // Fallback: Tentar via Canvas se for uma URL de imagem simples
        try {
          return new Promise((resolve) => {
            const img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
              } else {
                resolve('');
              }
            };
            img.onerror = () => resolve('');
            img.src = url;
          });
        } catch (e) {
          return '';
        }
      }
    };

    // Tentar carregar logo do backup se não existir
    if (!companyData?.logo_url) {
      try {
        console.log('📦 Tentando carregar dados do backup local (latest-backup.json)...');
        const backupRes = await fetch('/latest-backup.json');
        if (backupRes.ok) {
          const backup = await backupRes.json();
          // Tenta encontrar dados da empresa em chaves comuns
          const backupCompany = backup?.data?.COMPANY || backup?.data?.safeprag_company_data;

          if (backupCompany?.logo_url) {
            console.log('✅ Logo encontrado no backup local');
            if (!companyData) companyData = {} as CompanyData;
            companyData.logo_url = backupCompany.logo_url;

            // Preencher outros dados se faltarem
            if (!companyData.name) companyData.name = backupCompany.name;
            if (!companyData.cnpj) companyData.cnpj = backupCompany.cnpj;
            if (!companyData.phone) companyData.phone = backupCompany.phone;
            if (!companyData.email) companyData.email = backupCompany.email;
            if (!companyData.address) companyData.address = backupCompany.address;
          }
        }
      } catch (e) {
        console.warn('⚠️ Falha ao ler latest-backup.json:', e);
      }
    }

    // Converter logo para base64 se existir
    let logoBase64 = '';
    if (companyData?.logo_url) {
      logoBase64 = await imageUrlToBase64(companyData.logo_url);
    }
    // Cabeçalho principal
    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.margin = '0';
    header.style.padding = '0';

    // Criar tabela para alinhar conteúdo
    header.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 33%; vertical-align: top; padding: 0;">
            <img src="${logoBase64 || companyData?.logo_url || ''}" alt="Logo" style="width: 200px; margin-top: 2px; margin-bottom: 5px;">
          </td>
          <td style="width: 33%; text-align: center; vertical-align: middle;">
            <div style="font-size: 18px; font-weight: bold;">
              Ordem De Serviço
            </div>
          </td>
          <td style="width: 33%; text-align: right; vertical-align: top; padding: 0;">
            <div style="font-size: 12px; color: #000;">
              Nº O.S.: ${serviceData.orderNumber}
            </div>
          </td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 12px;">
        <tr>
          <td style="width: 70%; line-height: 1.3;">
            <div>${companyData?.name || ''}</div>
            <div>CNPJ: ${companyData?.cnpj || ''}</div>
            <div>Endereço: ${companyData?.address || ''}</div>
            <div>Telefone: ${companyData?.phone || ''}</div>
            <div>Email: ${companyData?.email || ''}</div>
          </td>
          <td style="width: 30%; text-align: right; line-height: 1.3;">
            <div>Data: ${formatDate(serviceData.date)}</div>
            <div>Hora Início: ${formatTime(serviceData.startTime)}</div>
            <div>Hora Fim: ${formatTime(serviceData.endTime)}</div>
          </td>
        </tr>
      </table>
    `;

    // Container para licenças
    const licensesContainer = document.createElement('div');
    licensesContainer.style.width = '100%';
    licensesContainer.style.display = 'flex';
    licensesContainer.style.justifyContent = 'space-between';
    licensesContainer.style.fontSize = '12px';
    licensesContainer.style.marginTop = '0px';
    licensesContainer.style.marginBottom = '5px';
    licensesContainer.style.paddingTop = '0px';
    licensesContainer.style.borderTop = 'none';

    // Licença Ambiental (sem prefixo LO)
    const environmentalLicense = document.createElement('div');
    environmentalLicense.innerHTML = companyData?.environmental_license?.number ?
      `Licença Ambiental: ${companyData.environmental_license.number} - Validade: ${formatDate(companyData.environmental_license.date)}` : '';

    // Alvará Sanitário
    const sanitaryPermit = document.createElement('div');
    sanitaryPermit.style.textAlign = 'right';
    sanitaryPermit.innerHTML = companyData?.sanitary_permit?.number ?
      `Alvará Sanitário: ${companyData.sanitary_permit.number} - Validade: ${formatDate(companyData.sanitary_permit.expiry_date)}` : '';

    licensesContainer.appendChild(environmentalLicense);
    licensesContainer.appendChild(sanitaryPermit);

    // Linha divisória
    const divider = document.createElement('div');
    // divider removido para não exibir linha acima do email
    divider.style.width = '0';
    divider.style.height = '0';
    divider.style.backgroundColor = 'transparent';
    divider.style.margin = '0';

    // Seção de serviço por contrato
    const serviceSection = document.createElement('div');
    serviceSection.style.marginTop = '10px';
    serviceSection.innerHTML = '';

    // Dados do cliente
    const clientSection = document.createElement('div');
    clientSection.style.margin = '0';
    clientSection.style.padding = '0';

    // Buscar dados completos do cliente do localStorage se disponível (checar múltiplas chaves)
    const selectedClientDataStr = localStorage.getItem('selectedClient') || localStorage.getItem('selected_client');
    let selectedClientData = null;
    if (selectedClientDataStr) {
      try {
        selectedClientData = JSON.parse(selectedClientDataStr);
      } catch (error) {
        console.error('Erro ao parsear dados do cliente selecionado:', error);
      }
    }

    // Usar dados completos do cliente se disponível, senão usar dados do serviceData.client
    const finalClientData = selectedClientData || serviceData.client || {};

    clientSection.innerHTML = `
      <div style="background-color: #1a73e8; color: white; padding: 3px 10px; margin: 10px 0; font-size: 13px; text-align: left;"><span style="transform: translateY(-6px); display: inline-block;">Dados Do Cliente</span></div>
      <table class="bordered-table" style="width: 100%; margin-top: 5px; font-size: 12px;">
        <tr>
          <td style="width: 50%; line-height: 1.4; padding: 8px;">
            <div><strong>Código:</strong> ${finalClientData?.code || finalClientData?.id || 'N/A'}</div>
            <div><strong>Razão Social:</strong> ${finalClientData?.razaoSocial || finalClientData?.branch || finalClientData?.name || 'N/A'}</div>
            <div><strong>Nome:</strong> ${finalClientData?.nomeFantasia || finalClientData?.fantasyName || finalClientData?.name || 'N/A'}</div>
            <div><strong>CNPJ/CPF:</strong> ${finalClientData?.cnpj || finalClientData?.document || 'N/A'}</div>
            <div><strong>Cidade/Estado:</strong> ${finalClientData?.cidade || finalClientData?.city || 'N/A'}</div>
          </td>
          <td style="width: 50%; line-height: 1.4; padding: 8px;">
            <div><strong>Endereço:</strong> ${finalClientData?.endereco || finalClientData?.address || 'N/A'}</div>
            <div><strong>Telefone:</strong> ${finalClientData?.telefone || finalClientData?.phone || 'N/A'}</div>
            <div><strong>Contato:</strong> ${finalClientData?.contato || finalClientData?.contact || 'N/A'}</div>
            <div><strong>Email:</strong> ${finalClientData?.email || 'N/A'}</div>
          </td>
        </tr>
      </table>
    `;

    // Informações dos serviços
    const servicesInfoSection = document.createElement('div');
    servicesInfoSection.style.marginTop = '20px';
    servicesInfoSection.innerHTML = `
      <div style="background-color: #1a73e8; color: white; padding: 3px 10px; margin: 10px 0; font-size: 13px; text-align: left;"><span style="transform: translateY(-6px); display: inline-block;">Informações Dos Serviços</span></div>
    `;

    // Tabela de serviço
    const serviceTable = document.createElement('div');
    serviceTable.style.marginTop = '20px';

    // Verifica se temos múltiplos serviços ou apenas um serviço legado
    const servicesToRender = serviceData.services && serviceData.services.length > 0
      ? serviceData.services
      : (serviceData.service ? [serviceData.service] : []);

    // Título da seção
    serviceTable.innerHTML = `
      <table class="bordered-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">
        <thead>
          <tr style="background-color: #1a73e8; color: white;">
            <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Serviço</span></th>
            <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Praga Alvo</span></th>
            <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Local</span></th>
          </tr>
        </thead>
        <tbody>
          ${servicesToRender.map(service => {
      if (service && service.type && service.target && service.location) {
        const formattedType = (service.type || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        return `
                <tr>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${formattedType.charAt(0).toUpperCase() + formattedType.slice(1)}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.target.charAt(0).toUpperCase() + service.target.slice(1)}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.location}</td>
                </tr>
              `;
      }
      return '';
    }).join('')}
        </tbody>
      </table>
    `;

    // Verifica se algum serviço tem produto associado
    const hasProducts = servicesToRender.some(service => service.product);

    // Se houver produtos, cria a tabela de produtos
    if (hasProducts) {
      const productsTable = document.createElement('div');
      productsTable.innerHTML = `
        <div style="background-color: #1a73e8; color: white; padding: 3px 10px; margin: 10px 0; font-size: 13px; text-align: left;"><span style="transform: translateY(-6px); display: inline-block;">Produtos Utilizados</span></div>
        <table class="bordered-table" style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #1a73e8; color: white;">
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Produto</span></th>
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Princípio Ativo</span></th>
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Grupo Químico</span></th>
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Registro</span></th>
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Lote</span></th>
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Validade</span></th>
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Quantidade</span></th>
              <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Diluente</span></th>
            </tr>
          </thead>
          <tbody>
            ${servicesToRender.map(service => {
        // Verifica se há um produto associado a este serviço
        if (!service.product) {
          return ''; // Não renderiza a linha se não houver produto
        }
        // Se houver produto, renderiza a linha da tabela
        return `
                <tr>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.product.name || ''}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.product.activeIngredient || ''}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.product.chemicalGroup || ''}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.product.registration || ''}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.product.batch || ''}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${formatDate(service.product.validity) || ''}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.product.quantity || ''}</td>
                  <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${service.product.dilution || ''}</td>
                </tr>
              `;
      }).join('')}
          </tbody>
        </table>
      `;
      serviceTable.appendChild(productsTable);
    } else if (serviceData.product) {
      // Compatibilidade com o formato antigo
      const legacyProductTable = document.createElement('div');
      legacyProductTable.innerHTML = `
        <div style="background-color: #1a73e8; color: white; padding: 3px 10px; margin: 10px 0; font-size: 13px; text-align: left;"><span style="transform: translateY(-6px); display: inline-block;">Produtos Utilizados</span></div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background-color: #1a73e8; color: white;">
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Produto</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Princípio Ativo</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Grupo Químico</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Registro</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Lote</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Validade</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Quantidade</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #ddd; vertical-align: middle;"><span style="transform: translateY(-6px); display: inline-block;">Diluente</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${serviceData.product.name || ''}</td>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${serviceData.product.activeIngredient || ''}</td>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${serviceData.product.chemicalGroup || ''}</td>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${serviceData.product.registration || ''}</td>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${serviceData.product.batch || ''}</td>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${formatDate(serviceData.product.validity) || ''}</td>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${serviceData.product.quantity || ''}</td>
                <td style="padding: 8px 3px; border: 0.5px solid #ddd; text-align: center; vertical-align: middle;">${serviceData.product.dilution || ''}</td>
            </tr>
          </tbody>
        </table>
      `;
      serviceTable.appendChild(legacyProductTable);
    }


    // Dispositivos monitorados - só cria se não for um dos tipos de serviço de tratamento ou inspeção
    let devicesSection = null;
    // Processando tipo de serviço
    const treatmentTypes = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_gel', 'inspeção', 'inspeçao'];

    // Criar a seção de dispositivos se houver dispositivos salvos
    if (serviceData.devices && serviceData.devices.length > 0) {
      devicesSection = document.createElement('div');
      devicesSection.style.marginTop = '8px';
      // Se a seção for muito alta, adiciona sugestão de quebra antes, evitando grande espaço em branco
      devicesSection.style.pageBreakBefore = 'auto';
      devicesSection.style.breakBefore = 'auto';
      const groupedDevices = serviceData.devices.reduce((acc: Record<string, any[]>, d: any) => {
        acc[d.type] = acc[d.type] || [];
        acc[d.type].push(d);
        return acc;
      }, {});

      const devicesHTML = `
        ${Object.entries(groupedDevices).map(([type, items], idx) => `
       <table class="devices-table bordered-table" style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 6px; page-break-inside: avoid; break-inside: avoid;">
            <thead style="display: table-header-group; page-break-after: avoid; break-after: avoid; page-break-inside: avoid;">
              <tr style="background-color: #1a73e8; color: white;">
                <th colspan="4" style="padding: 3px 8px; text-align: left; border: 0.5px solid #999; vertical-align: middle; line-height: 1.3;">
                  <span style="transform: translateY(-6px); display: inline-block;">Dispositivos Monitorados</span>
                </th>
              </tr>
              <tr style="background-color: #1a73e8; color: white;">
                <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.3;"><span style="transform: translateY(-6px); display: inline-block;">Dispositivos</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #999; width: 10%; vertical-align: middle; line-height: 1.3;"><span style="transform: translateY(-6px); display: inline-block;">Quantidade</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.3;"><span style="transform: translateY(-6px); display: inline-block;">Status</span></th>
                <th style="padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.3;"><span style="transform: translateY(-6px); display: inline-block;">Lista De Dispositivos</span></th>
              </tr>
            </thead>
            <tbody style="page-break-before: avoid; break-before: avoid;">
              ${items.map((device, rowIdx) => {
        const getSequences = (numbers: number[] = []): string => {
          if (!numbers || numbers.length === 0) return '';
          const sortedNumbers = [...numbers].sort((a, b) => a - b);
          const sequences: string[] = [];
          let start = sortedNumbers[0];
          let prev = start;
          for (let i = 1; i <= sortedNumbers.length; i++) {
            if (i === sortedNumbers.length || sortedNumbers[i] !== prev + 1) {
              if (start === prev) {
                sequences.push(start.toString());
              } else {
                sequences.push(`${start}-${prev}`);
              }
              if (i < sortedNumbers.length) {
                start = sortedNumbers[i];
                prev = start;
              }
            } else {
              prev = sortedNumbers[i];
            }
          }
          return sequences.join(', ');
        };

        return `
                  <tr style="page-break-inside: avoid; break-inside: avoid; ${'${rowIdx === 0 ? \'page-break-before: avoid; break-before: avoid;\' : \'\'}'}">
                    <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${type}</td>
                    <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">${device.quantity}</td>
                    <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;">
                      ${device.status
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((statusItem, index, array) => {
              const percentage = ((statusItem.count / device.quantity) * 100).toFixed(1);
              return `
                            <div style="font-size: 10px;">
                               ${statusItem.name} (${statusItem.count} - ${percentage}%)
                              ${index < array.length - 1 ? '<br><br>' : ''}
                            </div>
                          `;
            }).join('')}
                    </td>
                    <td style="padding: 8px 3px; border: 0.5px solid #999; text-align: left; vertical-align: top; column-count: 2; column-gap: 12px; white-space: normal; word-break: break-word;">
                      ${device.status
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((statusItem, index, array) => {
              const sequence = getSequences(statusItem.devices);
              return `
                            ${statusItem.name}:
                            <br>
                            ${sequence}
                            ${index < array.length - 1 ? '<br><br>' : ''}
                          `;
            }).join('')}
                    </td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        `).join('')}
      `;
      devicesSection.innerHTML = devicesHTML;
    }

    // Seção de informações complementares
    const complementarySection = document.createElement('div');
    complementarySection.className = 'section-container complementary-section';
    complementarySection.style.marginTop = '20px';



    // Observações (dinâmico e condicional)
    const observationsContainer = document.createElement('div');
    observationsContainer.style.marginBottom = '20px';
    // Evitar corte dentro de Observações e permitir que o conteúdo seguinte aproveite a mesma página
    observationsContainer.style.pageBreakInside = 'avoid';
    (observationsContainer.style as any).breakInside = 'avoid';
    observationsContainer.style.pageBreakBefore = 'auto';
    (observationsContainer.style as any).breakBefore = 'auto';
    observationsContainer.style.pageBreakAfter = 'auto';
    (observationsContainer.style as any).breakAfter = 'auto';
    const obsText = (serviceData.observations || '').trim();
    const hasObservations = obsText.length > 0;
    if (hasObservations) {
      observationsContainer.innerHTML = `
        <div style="background-color: #1a73e8; color: white; padding: 3px 10px; margin: 6px 0; font-size: 13px; text-align: left;"><span style="transform: translateY(-6px); display: inline-block;">Observações</span></div>
        <div style="border: 0.5px solid #ddd; padding: 1px 8px 12px 8px; margin-bottom: 6px; white-space: pre-line; word-break: break-word; line-height: 1.15; font-size: 11px; text-align: justify; hyphens: auto;">${obsText}</div>
      `;
      complementarySection.appendChild(observationsContainer);
    }

    // Assinaturas
    const signaturesSection = document.createElement('div');

    // Buscar dados do usuário do localStorage
    const userData = JSON.parse(localStorage.getItem('safeprag_user_data') || localStorage.getItem('userData') || '{}');

    signaturesSection.style.display = 'flex';
    signaturesSection.style.justifyContent = 'space-between';
    signaturesSection.style.width = '100%';
    signaturesSection.style.marginTop = '10px';
    signaturesSection.style.marginBottom = '20px';
    signaturesSection.style.padding = '0 20px';
    // Evitar quebra de página dentro da seção de assinaturas
    signaturesSection.style.pageBreakInside = 'avoid';
    (signaturesSection.style as any).breakInside = 'avoid';
    signaturesSection.style.pageBreakBefore = 'auto';
    (signaturesSection.style as any).breakBefore = 'auto';

    const signatureStyle = `
      padding-top: 5px;
      text-align: center;
      width: 180px;
    `;

    // Buscar assinaturas do localStorage
    const signaturesData = JSON.parse(localStorage.getItem('safeprag_signatures') || '[]');
    const controladorData = signaturesData
      .filter((sig: any) => sig.signature_type === 'controlador')
      .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0] || null;

    const tecnicoData = signaturesData
      .filter((sig: any) => sig.signature_type === 'tecnico')
      .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0] || null;

    // Comprimir assinaturas antes de incluir no PDF
    const controladorSig = await compressImage(controladorData?.controlador_signature || userData?.signature || '', 400, 0.6);
    const tecnicoSig = await compressImage(tecnicoData?.responsavel_tecnico_signature || userData?.tecnicoSignature || '', 400, 0.6);
    const clientSig = await compressImage(clientData?.signature || '', 400, 0.6);

    signaturesSection.innerHTML = `
      <div style="flex: 1; max-width: 180px;">
        <div style="${signatureStyle}">
          ${controladorSig ? `<img src="${controladorSig}" alt="Assinatura" style="width: 180px; height: 60px; margin-bottom: 5px; display: block;">` : `<div style="width: 180px; height: 60px; margin-bottom: 5px; display: block;"></div>`}
          <div style="font-weight: bold; margin-top: 5px;">Controlador De Pragas</div>
          <div style="font-size: 11px; margin-top: 2px;">${controladorData?.controlador_name || userData?.name || ''}</div>
          ${controladorData?.controlador_phone || userData?.phone ? `<div style="font-size: 11px; margin-top: 2px;">${controladorData?.controlador_phone || userData?.phone}</div>` : ''}
        </div>
      </div>
      <div style="flex: 1; max-width: 180px;">
        <div style="${signatureStyle}">
          ${tecnicoSig ? `<img src="${tecnicoSig}" alt="Assinatura" style="width: 180px; height: 60px; margin-bottom: 5px; display: block;">` : `<div style="width: 180px; height: 60px; margin-bottom: 5px; display: block;"></div>`}
          <div style="font-weight: bold; margin-top: 5px;">Responsável Técnico</div>
          <div style="font-size: 11px; margin-top: 2px;">${tecnicoData?.responsavel_tecnico_name || userData?.tecnicoName || ''}</div>
          <div style="font-size: 11px; margin-top: 2px;">${tecnicoData?.responsavel_tecnico_crea || userData?.tecnicoCrea ? `CREA ${tecnicoData?.responsavel_tecnico_crea || userData?.tecnicoCrea}` : ''}</div>
        </div>
      </div>
      <div style="flex: 1; max-width: 180px;">
        <div style="${signatureStyle}">
          ${clientSig ? `<img src="${clientSig}" alt="Assinatura" style="width: 180px; height: 60px; margin-bottom: 5px; display: block;">` : `<div style="width: 180px; height: 60px; margin-bottom: 5px; display: block;"></div>`}
          <div style="font-weight: bold; margin-top: 5px;">Contato Do Cliente</div>
          ${clientData?.contato ? `<div style="font-size: 11px; margin-top: 2px;">${clientData.contato}</div>` : ''}
          ${clientData?.phone ? `<div style="font-size: 11px; margin-top: 2px;">${clientData.phone.replace(/^\+55/, '')}</div>` : ''}
        </div>
      </div>
    `;
    complementarySection.appendChild(signaturesSection);

    // Seção de resumo de contagem de pragas
    let pestCountSection = null;
    console.log('Dados de contagem de pragas recebidos no PDF:', serviceData.pestCounts);

    // Verificar se existem dados de contagem de pragas no localStorage
    // Tenta buscar usando diferentes chaves possíveis para garantir compatibilidade
    const possibleKeys = ['pestCounts', 'safeprag_pest_counts', 'pest_counts', 'pest_count_data', 'safeprag_pest_count_data'];
    let localPestCounts = null;

    for (const key of possibleKeys) {
      const pestCountsStr = localStorage.getItem(key);
      if (pestCountsStr) {
        try {
          localPestCounts = JSON.parse(pestCountsStr);
          // Se existem dados no localStorage e não foram passados via serviceData, usá-los
          if (localPestCounts && (!serviceData.pestCounts || serviceData.pestCounts.length === 0)) {
            serviceData.pestCounts = localPestCounts;
            console.log(`Usando dados de contagem de pragas do localStorage (chave: ${key}):`, localPestCounts);
            break; // Encontrou dados válidos, sai do loop
          }
        } catch (error) {
          console.error(`Erro ao parsear dados de contagem de pragas (chave: ${key}):`, error);
        }
      }
    }

    // Verificar se há dados de contagem de pragas na ordem de serviço ativa
    const activeOrderStr = localStorage.getItem('active_service_order');
    if (activeOrderStr && (!serviceData.pestCounts || serviceData.pestCounts.length === 0)) {
      try {
        const activeOrder = JSON.parse(activeOrderStr);
        if (activeOrder && activeOrder.pestCounts && activeOrder.pestCounts.length > 0) {
          serviceData.pestCounts = activeOrder.pestCounts;
          console.log('Usando dados de contagem de pragas da ordem de serviço ativa:', activeOrder.pestCounts);
        }
      } catch (error) {
        console.error('Erro ao parsear dados da ordem de serviço ativa:', error);
      }
    }

    // Buscar dados de contagem de pragas das ordens de serviço ativas (múltiplas fontes)
    if (!serviceData.pestCounts || serviceData.pestCounts.length === 0) {
      // Buscar em activeOrders que foi carregado anteriormente
      const currentActiveOrder = activeOrders.find(order =>
        order.clientCode === serviceData.clientCode ||
        order.client?.code === serviceData.clientCode
      );

      if (currentActiveOrder && currentActiveOrder.pestCounts && currentActiveOrder.pestCounts.length > 0) {
        serviceData.pestCounts = currentActiveOrder.pestCounts;
        console.log('Usando dados de contagem de pragas de ordem ativa encontrada:', currentActiveOrder.pestCounts);
      }
    }

    // Verificar se há dados de contagem de pragas nos serviços ativos
    const pestCountsOrdersStr = localStorage.getItem(SERVICE_ORDERS_KEY);
    if (pestCountsOrdersStr && (!serviceData.pestCounts || serviceData.pestCounts.length === 0)) {
      try {
        const serviceOrders = JSON.parse(pestCountsOrdersStr);
        const activeOrder = serviceOrders.find((order: any) => order.status === 'in_progress');
        if (activeOrder && activeOrder.pestCounts && activeOrder.pestCounts.length > 0) {
          serviceData.pestCounts = activeOrder.pestCounts;
          console.log('Usando dados de contagem de pragas da ordem de serviço em andamento:', activeOrder.pestCounts);
        } else {
          // Verificar se há alguma ordem com dados de contagem de pragas
          const orderWithPestCounts = serviceOrders.find((order: any) => order.pestCounts && order.pestCounts.length > 0);
          if (orderWithPestCounts) {
            serviceData.pestCounts = orderWithPestCounts.pestCounts;
            console.log('Usando dados de contagem de pragas de outra ordem de serviço:', orderWithPestCounts.pestCounts);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados de contagem de pragas das ordens de serviço:', error);
      }
    }

    // Verificar se há dados de contagem de pragas em ordens de serviço em andamento
    const ongoingOrdersStr = localStorage.getItem('ongoing_service_orders');
    if (ongoingOrdersStr && (!serviceData.pestCounts || serviceData.pestCounts.length === 0)) {
      try {
        const ongoingOrders = JSON.parse(ongoingOrdersStr);
        // Buscar na ordem de serviço correspondente ao cliente atual
        const currentOrder = ongoingOrders.find(order =>
          order.clientCode === serviceData.clientCode ||
          order.client?.code === serviceData.clientCode
        );
        if (currentOrder && currentOrder.pestCounts && currentOrder.pestCounts.length > 0) {
          serviceData.pestCounts = currentOrder.pestCounts;
          console.log('Usando dados de contagem de pragas de ordem em andamento:', currentOrder.pestCounts);
        }
      } catch (error) {
        console.error('Erro ao parsear ordens de serviço em andamento:', error);
      }
    }

    // Buscar dados de contagem de pragas específicos do cliente no localStorage
    if (!serviceData.pestCounts || serviceData.pestCounts.length === 0) {
      const clientPestCountsStr = localStorage.getItem(`pestCounts_${serviceData.clientCode}`);
      if (clientPestCountsStr) {
        try {
          const clientPestCounts = JSON.parse(clientPestCountsStr);
          if (clientPestCounts && clientPestCounts.length > 0) {
            serviceData.pestCounts = clientPestCounts;
            console.log('Usando dados de contagem de pragas específicos do cliente:', clientPestCounts);
          }
        } catch (error) {
          console.error('Erro ao parsear dados de contagem de pragas do cliente:', error);
        }
      }
    }

    // Log para verificar os dados de contagem de pragas antes de criar a tabela
    console.log('Dados de contagem de pragas antes de criar a tabela:', JSON.stringify(serviceData.pestCounts || []));

    // Se ainda não tiver dados de contagem de pragas, verificar se há dados no formato antigo
    if (!serviceData.pestCounts || serviceData.pestCounts.length === 0) {
      const oldFormatPestCountsStr = localStorage.getItem('pest_counts_data');
      if (oldFormatPestCountsStr) {
        try {
          const oldFormatPestCounts = JSON.parse(oldFormatPestCountsStr);
          if (oldFormatPestCounts && Array.isArray(oldFormatPestCounts)) {
            // Converter formato antigo para o novo formato
            serviceData.pestCounts = oldFormatPestCounts.map((item, index) => ({
              deviceType: 'Armadilha',
              deviceNumber: index + 1,
              pests: Object.entries(item).map(([name, count]) => ({
                name,
                count: Number(count)
              })).filter(pest => pest.count > 0)
            })).filter(device => device.pests.length > 0);

            console.log('Convertendo dados de contagem de pragas do formato antigo:', serviceData.pestCounts);
          }
        } catch (error) {
          console.error('Erro ao parsear dados de contagem de pragas no formato antigo:', error);
        }
      }
    }

    // Criar seção de contagem de pragas por dispositivo SOMENTE se houver pragas com contagem > 0
    let hasPestsWithCount = false;

    if (serviceData.pestCounts && serviceData.pestCounts.length > 0) {
      console.log('Processando dados de contagem de pragas para o PDF...');

      // Verificar se há pelo menos um dispositivo com pragas contadas
      for (const device of serviceData.pestCounts) {
        if (device.pests && device.pests.some(pest => pest.count > 0)) {
          hasPestsWithCount = true;
          break;
        }
      }

      // Criar a seção SOMENTE se houver pragas com contagem > 0
      if (hasPestsWithCount) {
        pestCountSection = document.createElement('div');
        pestCountSection.className = 'section-container';
        pestCountSection.style.marginTop = '20px';

        // Título removido: usando título dentro do thead da tabela conforme solicitado

        // Não inserir quebra de página automática antes da tabela; confiar nas regras de 'avoid' para melhor aproveitamento de página
        // (removido page-break forçado)

        // CSS para evitar quebra dentro de linhas e manter visual consistente
        const styleEl = document.createElement('style');
        styleEl.textContent = `
          .table-wrapper { page-break-inside: avoid; break-inside: avoid; margin-bottom: 1px; }
          .pest-count-table tr, .pest-count-table td { page-break-inside: avoid; break-inside: avoid; }
          .pest-count-table thead { background-color: #1a73e8; color: white; }
          .pest-count-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 1px; table-layout: fixed; border: 0.5px solid #999; }
          /* Cabeçalho mantém altura moderada para legibilidade */
          .pest-count-table th { padding: 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.2; box-sizing: border-box; }
          /* Linhas do corpo com altura reduzida ~50% */
          .pest-count-table td { padding: 4px 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.0; box-sizing: border-box; word-break: break-word; }
          /* Células que usam rowspan (tipo/número) alinham no topo com leve respiro */
          .pest-count-table td[rowspan] { vertical-align: top; padding-top: 6px; border: 0.5px solid #999; }
          .pest-count-table thead tr:first-child th[colspan="4"] { width: 100%; border: 0.5px solid #999; }
          /* Variante compacta para aproveitar melhor o espaço quando necessário */
          .pest-count-table.compact { font-size: 9.5px; }
          .pest-count-table.compact th, .pest-count-table.compact td { padding: 2px 2px; line-height: 1.05; }
        `;
        pestCountSection.appendChild(styleEl);
        // Anexar seção ao DOM (oculta) para medições corretas durante a construção
        const stagingContainer = document.createElement('div');
        stagingContainer.style.position = 'absolute';
        stagingContainer.style.visibility = 'hidden';
        stagingContainer.style.left = '-10000px';
        stagingContainer.style.top = '0';
        stagingContainer.style.width = '794px';
        stagingContainer.appendChild(pestCountSection);
        document.body.appendChild(stagingContainer);

        // Função que cria uma nova tabela com cabeçalho repetido
        const createPestCountTable = (compact: boolean = false) => {
          const tbl = document.createElement('table');
          tbl.className = 'pest-count-table';
          // Proteção adicional contra corte da tabela na quebra de página
          tbl.style.pageBreakInside = 'avoid';
          (tbl.style as any).breakInside = 'avoid';
          tbl.style.pageBreakBefore = 'auto';
          (tbl.style as any).breakBefore = 'auto';
          tbl.style.pageBreakAfter = 'auto';
          (tbl.style as any).breakAfter = 'auto';
          if (compact) tbl.classList.add('compact');
          tbl.innerHTML = '<colgroup>' +
            '<col style="width: 32%">' +
            '<col style="width: 18%">' +
            '<col style="width: 32%">' +
            '<col style="width: 18%">' +
            '</colgroup>' +
            '<thead style="display: table-header-group; page-break-after: avoid; break-after: avoid; page-break-inside: avoid;">' +
            '<tr style="background-color: #1a73e8; color: white;">' +
            '<th colspan="4" style="padding: 3px 8px; text-align: left; border: 0.5px solid #999; vertical-align: middle; line-height: 1.2;"><span style="transform: translateY(-3px); display: inline-block;">Contagem de Pragas por Dispositivo</span></th>' +
            '</tr>' +
            '<tr style="background-color: #1a73e8; color: white;">' +
            '<th style="padding: 4px 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.0;"><span style="transform: translateY(-3px); display: inline-block;">Tipo de Dispositivo</span></th>' +
            '<th style="padding: 4px 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.0;"><span style="transform: translateY(-3px); display: inline-block;">Número Dispositivo</span></th>' +
            '<th style="padding: 4px 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.0;"><span style="transform: translateY(-3px); display: inline-block;">Tipo de Praga</span></th>' +
            '<th style="padding: 4px 3px; text-align: center; border: 0.5px solid #999; vertical-align: middle; line-height: 1.0;"><span style="transform: translateY(-3px); display: inline-block;">Quantidade</span></th>' +
            '</tr>' +
            '</thead>' +
            '<tbody></tbody>';
          return tbl;
        };

        // Heurística para quebrar entre blocos de dispositivos evitando cortar linhas
        const estimatedRowHeight = 12; // altura aproximada com padding reduzido (4px) e line-height menor
        const headerHeight = 44; // cabeçalho com duas linhas mais compactas
        const pageHeightPx = 1122; // A4 @96dpi (aprox.)
        const topBottomMargins = 114; // 10mm topo (~38px) + 20mm base (~76px) ≈ 114px
        const usablePageHeight = pageHeightPx - topBottomMargins;
        const pageSafetyBuffer = 0; // sem folga extra entre blocos
        const tableBottomMargin = 4; // margem inferior mínima
        const paginationReservePx = 8; // reserva pequena para numeração/rodapé
        const pageBreakSpacerPx = 0; // não reservar espaço extra; usamos margem mínima dinâmica
        // Medir espaço já ocupado antes da seção de pragas para melhor aproveitamento da página
        const initialUsedHeightOnPage = (() => {
          try {
            const pre = document.createElement('div');
            pre.className = 'report-container';
            pre.style.position = 'absolute';
            pre.style.visibility = 'hidden';
            pre.style.left = '-10000px';
            pre.style.top = '0';
            pre.style.width = '794px'; // largura A4

            // Seções anteriores ao bloco de pragas
            const s1 = document.createElement('div');
            s1.className = 'section-container';
            s1.appendChild(header.cloneNode(true));
            s1.appendChild(licensesContainer.cloneNode(true));
            s1.appendChild(clientSection.cloneNode(true));
            pre.appendChild(s1);

            const s2 = document.createElement('div');
            s2.className = 'section-container';
            s2.appendChild(serviceSection.cloneNode(true));
            s2.appendChild(servicesInfoSection.cloneNode(true));
            s2.appendChild(serviceTable.cloneNode(true));
            pre.appendChild(s2);

            if (devicesSection) {
              const s3 = document.createElement('div');
              s3.className = 'section-container';
              s3.appendChild(devicesSection.cloneNode(true));
              pre.appendChild(s3);
            }

            document.body.appendChild(pre);
            const totalHeight = pre.getBoundingClientRect().height;
            document.body.removeChild(pre);
            const remainder = totalHeight % usablePageHeight;
            return remainder;
          } catch (err) {
            console.warn('Falha ao medir espaço restante antes da seção de pragas:', err);
            return 0;
          }
        })();

        let usedHeightOnPage = initialUsedHeightOnPage;
        let hasHeaderOnCurrentPage = false; // controla repetição do cabeçalho apenas quando há nova página

        serviceData.pestCounts.forEach(device => {
          // Ignora dispositivos sem pragas
          if (!device.pests || device.pests.length === 0) return;
          const pestsWithCount = device.pests.filter(pest => pest.count > 0);
          if (pestsWithCount.length === 0) return;

          // Caixa oculta para medir altura real do bloco completo do dispositivo
          const measureBox = document.createElement('div');
          measureBox.style.position = 'absolute';
          measureBox.style.visibility = 'hidden';
          measureBox.style.left = '-10000px';
          measureBox.style.top = '0';
          // Anexa ao container de staging para garantir que estilos sejam aplicados
          stagingContainer.appendChild(measureBox);

          const measureDeviceBlockHeight = (rowsCount: number, includeHeader: boolean, compact: boolean = false) => {
            const tbl = createPestCountTable(compact);
            if (!includeHeader) {
              const thead = tbl.querySelector('thead');
              if (thead) thead.remove();
            }
            const tbody = tbl.querySelector('tbody')!;
            pestsWithCount.slice(0, rowsCount).forEach((pest, idx) => {
              const tr = document.createElement('tr');
              let rowHtml = '';
              if (idx === 0) {
                rowHtml += `<td rowspan="${rowsCount}" style="padding: 4px 3px; border: 0.5px solid #999; text-align: center; vertical-align: top;"><span style="display:inline-block; transform: translateY(-5px);">${device.deviceType || 'Armadilha luminosa'}</span></td>`;
                rowHtml += `<td rowspan="${rowsCount}" style="padding: 4px 3px; border: 0.5px solid #999; text-align: center; vertical-align: top;"><span style="display:inline-block; transform: translateY(-5px);">${device.deviceNumber}</span></td>`;
              }
              rowHtml += `<td style="padding: 4px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;"><span style="display:inline-block; transform: translateY(-5px);">${pest.name}</span></td>`;
              rowHtml += `<td style="padding: 4px 3px; border: 0.5px solid #999; text-align: center; vertical-align: middle;"><span style="display:inline-block; transform: translateY(-5px);">${pest.count}</span></td>`;
              tr.innerHTML = rowHtml;
              tbody.appendChild(tr);
            });
            measureBox.appendChild(tbl);
            const h = tbl.getBoundingClientRect().height;
            measureBox.removeChild(tbl);
            return h;
          };

          // Decidir se cabe o bloco inteiro na página atual
          let includeHeader = !hasHeaderOnCurrentPage; // cabeçalho apenas no primeiro bloco da página
          let useCompactForThisBlock = false;
          let blockHeight = measureDeviceBlockHeight(pestsWithCount.length, includeHeader);
          const minBottomWhitespace = 8; // folga mínima dinâmica
          const projectedTotal = usedHeightOnPage + blockHeight + tableBottomMargin + paginationReservePx;
          const leftover = usablePageHeight - projectedTotal;
          const needBreakBefore = projectedTotal > usablePageHeight || leftover < minBottomWhitespace;

          if (needBreakBefore) {
            // Tentar variante compacta para encaixar no final da página
            const compactHeight = measureDeviceBlockHeight(pestsWithCount.length, includeHeader, true);
            const compactProjected = usedHeightOnPage + compactHeight + tableBottomMargin + paginationReservePx;
            const compactLeftover = usablePageHeight - compactProjected;
            if (compactProjected <= usablePageHeight && compactLeftover >= 6) {
              useCompactForThisBlock = true;
              blockHeight = compactHeight;
            } else {
              // Quebra antes do bloco para mantê-lo inteiro na próxima página
              const brk = document.createElement('div');
              brk.className = 'html2pdf__page-break';
              pestCountSection.appendChild(brk);
              usedHeightOnPage = 0;
              hasHeaderOnCurrentPage = false;
              includeHeader = true;
              blockHeight = measureDeviceBlockHeight(pestsWithCount.length, includeHeader);
            }
          }

          // Monta a tabela real do dispositivo (bloco indivisível)
          const currentTable = createPestCountTable(useCompactForThisBlock);
          if (!includeHeader) {
            const thead = currentTable.querySelector('thead');
            if (thead) thead.remove();
          }
          const currentTbody = currentTable.querySelector('tbody')!;
          pestsWithCount.forEach((pest, idx) => {
            const tr = document.createElement('tr');
            let rowHtml = '';
            if (idx === 0) {
              rowHtml += `<td rowspan="${pestsWithCount.length}" style="border: 0.5px solid #999;"><span style="display:inline-block; transform: translateY(-5px);">${device.deviceType || 'Armadilha luminosa'}</span></td>`;
              rowHtml += `<td rowspan="${pestsWithCount.length}" style="border: 0.5px solid #999;"><span style="display:inline-block; transform: translateY(-5px);">${device.deviceNumber}</span></td>`;
            }
            rowHtml += `<td style="border: 0.5px solid #999;"><span style="display:inline-block; transform: translateY(-5px);">${pest.name}</span></td>`;
            rowHtml += `<td style="border: 0.5px solid #999;"><span style="display:inline-block; transform: translateY(-5px);">${pest.count}</span></td>`;
            tr.innerHTML = rowHtml;
            currentTbody.appendChild(tr);
          });

          // Anexa o bloco/tabela do dispositivo
          const wrap = document.createElement('div');
          wrap.className = 'table-wrapper';
          // Garantir que o bloco inteiro (wrapper + tabela) não seja dividido
          wrap.style.pageBreakInside = 'avoid';
          (wrap.style as any).breakInside = 'avoid';
          wrap.style.pageBreakBefore = 'auto';
          (wrap.style as any).breakBefore = 'auto';
          wrap.style.pageBreakAfter = 'auto';
          (wrap.style as any).breakAfter = 'auto';
          wrap.appendChild(currentTable);
          pestCountSection.appendChild(wrap);

          // Atualiza estado de página atual usando altura real renderizada para evitar acumular erro
          const actualBlockHeight = wrap.getBoundingClientRect().height;
          usedHeightOnPage += actualBlockHeight + pageSafetyBuffer;
          if (includeHeader) {
            hasHeaderOnCurrentPage = true;
          }

          // Remover caixa de medição
          measureBox.remove();
        });
        // Remover container de staging após construir toda a seção
        try { document.body.removeChild(stagingContainer); } catch { }

        // Log para debug das tabelas geradas
        console.log('Tabelas de contagem de pragas geradas (paginadas):', pestCountSection.innerHTML);
        console.log('Dados de contagem de pragas processados:', serviceData.pestCounts);
      }
    }

    // Log para debug da tabela de contagem de pragas
    console.log('Tabela de contagem de pragas gerada:', serviceData.pestCounts || []);
    console.log('Seção de contagem de pragas criada:', !!pestCountSection);
    console.log('Há pragas com contagem > 0:', hasPestsWithCount);

    // Montar o conteúdo do relatório com containers de seção
    // Primeiro, criar um array com as seções para facilitar a manipulação
    const reportSections = [
      `<div class="section-container">
        ${header.outerHTML}
        ${licensesContainer.outerHTML}
        ${clientSection.outerHTML}
      </div>`,
      `<div class="section-container">
        ${serviceSection.outerHTML}
        ${servicesInfoSection.outerHTML}
        ${serviceTable.outerHTML}
      </div>`
    ];

    // Adicionar seção de dispositivos se existir
    if (devicesSection) {
      reportSections.push(`<div class="section-container">
        ${devicesSection.outerHTML}
      </div>`);
    }

    // Adicionar a seção de contagem de pragas ao relatório SOMENTE se houver pragas com contagem > 0
    if (pestCountSection && hasPestsWithCount) {
      // Sem quebra forçada: o algoritmo interno decide se deve iniciar nova página
      reportSections.push(`<div class="section-container">
        ${pestCountSection.outerHTML}
      </div>`);
      console.log('Seção de contagem de pragas adicionada ao relatório');
    } else {
      console.log('Seção de contagem de pragas não adicionada ao relatório: não há pragas com contagem positiva');
    }

    // Adicionar seção complementar com blocos indivisíveis (Observações e Assinaturas)
    {
      const pageHeightPx = 1122; // A4 @96dpi (aprox.)
      const topBottomMargins = 114; // 10mm topo (~38px) + 20mm base (~76px) ≈ 114px
      const usablePageHeight = pageHeightPx - topBottomMargins;
      const paginationReservePx = 8;
      const minBottomWhitespace = 10;

      // Medir altura acumulada até aqui para saber o restante na última página
      const pre = document.createElement('div');
      pre.className = 'report-container';
      pre.style.position = 'absolute';
      pre.style.visibility = 'hidden';
      pre.style.left = '-10000px';
      pre.style.top = '0';
      pre.style.width = '794px';
      // Seções já montadas
      const s1 = document.createElement('div'); s1.className = 'section-container';
      s1.appendChild(header.cloneNode(true));
      s1.appendChild(licensesContainer.cloneNode(true));
      s1.appendChild(clientSection.cloneNode(true));
      pre.appendChild(s1);
      const s2 = document.createElement('div'); s2.className = 'section-container';
      s2.appendChild(serviceSection.cloneNode(true));
      s2.appendChild(servicesInfoSection.cloneNode(true));
      s2.appendChild(serviceTable.cloneNode(true));
      pre.appendChild(s2);
      if (devicesSection) { const s3 = document.createElement('div'); s3.className = 'section-container'; s3.appendChild(devicesSection.cloneNode(true)); pre.appendChild(s3); }
      if (pestCountSection && hasPestsWithCount) { const s4 = document.createElement('div'); s4.className = 'section-container'; s4.appendChild(pestCountSection.cloneNode(true)); pre.appendChild(s4); }
      document.body.appendChild(pre);
      const totalHeightSoFar = pre.getBoundingClientRect().height;
      document.body.removeChild(pre);
      let remainder = totalHeightSoFar % usablePageHeight;

      // Função utilitária para medir altura do bloco
      const measureBlock = (el: HTMLElement) => {
        const box = document.createElement('div');
        box.className = 'section-container';
        box.style.position = 'absolute'; box.style.visibility = 'hidden';
        box.style.left = '-10000px'; box.style.top = '0'; box.style.width = '794px';
        box.appendChild(el.cloneNode(true));
        document.body.appendChild(box);
        const h = box.getBoundingClientRect().height;
        document.body.removeChild(box);
        return h;
      };

      const obsHeight = hasObservations ? measureBlock(observationsContainer) : 0;
      const needBreakBeforeObs = hasObservations ? ((remainder + obsHeight + paginationReservePx) > usablePageHeight || (usablePageHeight - (remainder + obsHeight + paginationReservePx)) < minBottomWhitespace) : false;
      if (needBreakBeforeObs) { remainder = 0; }
      if (hasObservations) {
        remainder = (remainder + obsHeight + paginationReservePx) % usablePageHeight;
      }

      const signHeight = measureBlock(signaturesSection);
      const needBreakBeforeSign = (remainder + signHeight + paginationReservePx) > usablePageHeight || (usablePageHeight - (remainder + signHeight + paginationReservePx)) < minBottomWhitespace;
      if (needBreakBeforeSign) { remainder = 0; }

      const finalComplementaryHTML = [
        '<div class="section-container">',
        (hasObservations && needBreakBeforeObs) ? '<div class="html2pdf__page-break"></div>' : '',
        hasObservations ? observationsContainer.outerHTML : '',
        needBreakBeforeSign ? '<div class="html2pdf__page-break"></div>' : '',
        signaturesSection.outerHTML,
        '</div>'
      ].join('');

      reportSections.push(finalComplementaryHTML);
    }

    // Juntar todas as seções
    reportElement.innerHTML = reportSections.join('\n');

    // Log para verificar se a seção de contagem de pragas foi adicionada
    console.log('Seções do relatório:', reportSections.length, 'incluindo contagem de pragas:', !!pestCountSection);

    // Log para debug da estrutura final do relatório
    console.log('Estrutura do relatório PDF com tabela de contagem de pragas forçada:', reportElement.innerHTML);

    // Log para debug da estrutura final do relatório
    console.log('Estrutura do relatório PDF:', {
      hasDevicesSection: !!devicesSection,
      hasPestCountSection: !!pestCountSection,
      pestCountsData: serviceData.pestCounts
    });

    // Preparar dados para o nome do arquivo
    // Buscar assinaturas do localStorage (logica movida para uso no nome do arquivo)
    const techSignaturesData = JSON.parse(localStorage.getItem('safeprag_signatures') || '[]');
    const techControladorData = techSignaturesData
      .filter((sig: any) => sig.signature_type === 'controlador')
      .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0] || null;

    // Buscar userData como fallback
    const techUserData = JSON.parse(localStorage.getItem('safeprag_user_data') || localStorage.getItem('userData') || '{}');

    const technicianName = techControladorData?.controlador_name || techUserData?.name || 'Não informado';

    // Construir nome do arquivo
    const filename = await constructFilename(
      serviceData.orderNumber,
      serviceData.date,
      technicianName,
      serviceData.client.name
    );

    // Opções do PDF
    const pdfOptions = {
      margin: [10, 10, 20, 10],
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.85 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794 // A4 width in pixels at 96 DPI
      },
      // Respeita apenas as regras CSS de quebra para permitir repetição do thead
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.table-wrapper', '.devices-table', '.pest-count-table'] },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    // Gerar o PDF
    const pdf = await html2pdf()
      .set(pdfOptions)
      .from(reportElement)
      .toPdf()
      .get('pdf');

    // Limpa os dados retroativos após gerar o PDF
    localStorage.removeItem('retroactive_service_data');

    // Adicionar numeração de páginas no canto inferior direito
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.text(
        `${i}/${totalPages}`,
        pageWidth - 12,
        pageHeight - 4,
        { align: 'right' }
      );
    }

    // Salva no localStorage
    const pdfBlob = pdf.output('blob');
    await storeServiceOrderPDF(pdfBlob, serviceData);

    // Retornar o blob do PDF
    return pdfBlob;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

// Função para gerar e compartilhar PDF de ordem de serviço
export const generateAndShareServiceOrderPDF = async (
  serviceData: ServiceOrderPDFData,
  shouldShare: boolean = true
): Promise<Blob> => {
  try {
    // Obter companyId do storageService
    const { storageService } = await import('./storageService');
    const company = storageService.getCompany();
    const companyId = company?.id?.toString?.() || company?.cnpj || 'default-company';

    // Gerar o PDF
    const pdfBlob = await generateServiceOrderPDF(serviceData, companyId);

    // Buscar tecnico para o nome do arquivo
    const signaturesData = JSON.parse(localStorage.getItem('safeprag_signatures') || '[]');
    const controladorData = signaturesData
      .filter((sig: any) => sig.signature_type === 'controlador')
      .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0] || null;
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const technicianName = controladorData?.controlador_name || userData?.name;

    const filename = await constructFilename(
      serviceData.orderNumber,
      serviceData.date,
      technicianName,
      serviceData.client?.name
    );

    // Se estiver em plataforma nativa e shouldShare for true, perguntar se deseja compartilhar
    if (Capacitor.isNativePlatform() && shouldShare) {
      const shouldShareFile = confirm('Deseja compartilhar o PDF da ordem de serviço?');

      if (shouldShareFile) {
        try {
          // Converter blob para base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              // Remove o prefixo 'data:application/pdf;base64,'
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
          });

          reader.readAsDataURL(pdfBlob);
          const base64Data = await base64Promise;

          const success = await fileSharingService.shareFile({
            filename: `${filename}.pdf`,
            data: base64Data,
            mimeType: 'application/pdf'
          });

          if (!success) {
            throw new Error('Falha no compartilhamento');
          }

          return pdfBlob;
        } catch (shareError) {
          console.warn('Compartilhamento falhou, fazendo download:', shareError);
          // Fallback para download se o compartilhamento falhar
          await downloadPDFFromStorage(serviceData.orderNumber);
        }
      }
    } else if (shouldShare) {
      // Se for Web, faz o download direto
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    return pdfBlob;
  } catch (error) {
    console.error('Erro ao gerar e compartilhar PDF:', error);
    throw error;
  }
};



// Função para gerar PDF editável usando pdf-lib
export const generateEditableServiceOrderPDF = async (
  serviceData: ServiceOrderPDFData
): Promise<void> => {
  // Verificação de assinatura antes de gerar PDF editável
  try {
    const { storageService } = await import('./storageService');
    const { billingService } = await import('./billingService');
    const userData = storageService.getUserData();
    const role = (userData?.role || 'cliente') as 'admin' | 'controlador' | 'cliente';
    const company = storageService.getCompany();
    const companyId: string = company?.id?.toString?.() || company?.cnpj || 'default-company';
    if (role !== 'cliente') {
      const status = await billingService.getStatus(companyId);
      if (!status?.active) {
        throw new Error('Assinatura inativa. Geração de PDF bloqueada para administradores e controladores.');
      }
    }
  } catch (precheckError) {
    console.error('[Billing] Bloqueio de geração de PDF (editável):', precheckError);
    throw precheckError;
  }

  let companyId = 'default-company';
  try {
    const { storageService } = await import('./storageService');
    const company = storageService.getCompany();
    companyId = company?.id?.toString?.() || company?.cnpj || 'default-company';
  } catch (e) {
    console.warn('Erro ao obter companyId para PDF editável:', e);
  }

  try {
    // Buscar dados da empresa
    const companyData = await getCompanyData(companyId);

    // Criar novo documento PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Definir fonte
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Cabeçalho da empresa
    page.drawText(companyData?.name || 'Nome da Empresa', {
      x: 50,
      y: height - 50,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    if (companyData?.cnpj) {
      page.drawText(`CNPJ: ${companyData.cnpj}`, {
        x: 50,
        y: height - 75,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    // Título do documento
    page.drawText('ORDEM DE SERVIÇO', {
      x: width / 2 - 80,
      y: height - 120,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Número da OS
    page.drawText(`Nº: ${serviceData.orderNumber}`, {
      x: width - 150,
      y: height - 120,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Campos editáveis da empresa
    const form = pdfDoc.getForm();

    // Campo para nome da empresa
    const companyNameField = form.createTextField('company_name');
    companyNameField.setText(companyData?.name || '');
    companyNameField.addToPage(page, {
      x: 150,
      y: height - 55,
      width: 200,
      height: 20,
      borderColor: rgb(0, 0, 0),
      backgroundColor: rgb(0.95, 0.95, 0.95)
    });

    // Campo para CNPJ da empresa
    const companyCnpjField = form.createTextField('company_cnpj');
    companyCnpjField.setText(companyData?.cnpj || '');
    companyCnpjField.addToPage(page, {
      x: 100,
      y: height - 80,
      width: 150,
      height: 20,
      borderColor: rgb(0, 0, 0),
      backgroundColor: rgb(0.95, 0.95, 0.95)
    });

    // Campo para número da OS
    const osNumberField = form.createTextField('os_number');
    osNumberField.setText(serviceData.orderNumber);
    osNumberField.addToPage(page, {
      x: width - 100,
      y: height - 125,
      width: 80,
      height: 20,
      borderColor: rgb(0, 0, 0),
      backgroundColor: rgb(0.95, 0.95, 0.95)
    });

    // Dados do cliente
    let yPosition = height - 180;

    page.drawText('DADOS DO CLIENTE:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    yPosition -= 30;

    if (serviceData.client) {
      // Campo para nome do cliente
      page.drawText('Nome:', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      });

      const clientNameField = form.createTextField('client_name');
      clientNameField.setText(serviceData.client.name || '');
      clientNameField.addToPage(page, {
        x: 90,
        y: yPosition - 5,
        width: 200,
        height: 20,
        borderColor: rgb(0, 0, 0),
        backgroundColor: rgb(0.95, 0.95, 0.95)
      });

      yPosition -= 35;

      // Campo para endereço
      page.drawText('Endereço:', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      });

      const clientAddressField = form.createTextField('client_address');
      clientAddressField.setText(serviceData.client.address || '');
      clientAddressField.addToPage(page, {
        x: 110,
        y: yPosition - 5,
        width: 300,
        height: 20,
        borderColor: rgb(0, 0, 0),
        backgroundColor: rgb(0.95, 0.95, 0.95)
      });

      yPosition -= 35;

      // Campo para telefone
      page.drawText('Telefone:', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      });

      const clientPhoneField = form.createTextField('client_phone');
      clientPhoneField.setText(serviceData.client.phone || '');
      clientPhoneField.addToPage(page, {
        x: 110,
        y: yPosition - 5,
        width: 150,
        height: 20,
        borderColor: rgb(0, 0, 0),
        backgroundColor: rgb(0.95, 0.95, 0.95)
      });
    }

    // Seção de assinaturas
    yPosition = 150;

    page.drawText('ASSINATURAS:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Assinatura do técnico
    page.drawText('Técnico:', {
      x: 50,
      y: yPosition - 40,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    page.drawLine({
      start: { x: 100, y: yPosition - 45 },
      end: { x: 250, y: yPosition - 45 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });

    // Assinatura do cliente
    page.drawText('Cliente:', {
      x: 300,
      y: yPosition - 40,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    page.drawLine({
      start: { x: 350, y: yPosition - 45 },
      end: { x: 500, y: yPosition - 45 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });

    // Gerar o PDF
    const pdfBytes = await pdfDoc.save();

    // Construir nome do arquivo
    // Recarregar userData para garantir que temos o nome
    // Recarregar userData para garantir que temos o nome
    const { storageService } = await import('./storageService');
    const userForName = storageService.getUserData();
    const technicianName = userForName?.name;
    const filename = await constructFilename(
      serviceData.orderNumber,
      serviceData.date,
      technicianName
    );

    const filenameEditable = `${filename} - Editavel`;

    // Download do PDF
    if (Capacitor.isNativePlatform()) {
      // Converter para base64
      const base64Data = btoa(String.fromCharCode(...pdfBytes));

      const success = await fileSharingService.shareFile({
        filename: `${filenameEditable}.pdf`,
        data: base64Data,
        mimeType: 'application/pdf'
      });

      if (!success) {
        throw new Error('Falha no compartilhamento do PDF editável');
      }
    } else {
      // Download para web
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filenameEditable}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

  } catch (error) {
    console.error('Erro ao gerar PDF editável:', error);
    throw error;
  }
};

// Função para buscar dados da empresa do Firestore ou localStorage
const getCompanyData = async (companyId?: string): Promise<CompanyData | null> => {
  try {
    // Se tiver ID, tenta buscar do Firestore primeiro
    if (companyId) {
      try {
        console.log('📱 Buscando dados da empresa do Firestore:', companyId);
        const firestoreData = await getCompany(companyId);
        if (firestoreData) {
          console.log('✅ Dados da empresa carregados do Firestore');
          return firestoreData as CompanyData;
        }
      } catch (firestoreError) {
        console.warn('⚠️ Falha ao buscar do Firestore, tentando localStorage:', firestoreError);
      }
    }

    console.log('📱 Carregando dados da empresa do localStorage');

    // Busca do localStorage como fallback
    const localData = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (localData) {
      const parsedData = JSON.parse(localData);
      console.log('Dados da empresa carregados do localStorage:', parsedData);
      return parsedData;
    }

    console.log('Nenhum dado da empresa encontrado');
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    return null;
  }
};

export const saveClientSignature = async (orderId: string, clientInfo: {
  name: string;
  phone: string;
  emails: string[];
  signature: string;
}) => {
  try {
    const savedOrders = localStorage.getItem('serviceOrders');
    if (!savedOrders) return;

    const orders = JSON.parse(savedOrders);
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          clientInfo: {
            name: clientInfo.name,
            phone: clientInfo.phone,
            emails: clientInfo.emails,
            signature: clientInfo.signature,
            timestamp: new Date().toISOString()
          }
        };
        return updatedOrder;
      }
      return order;
    });

    localStorage.setItem('serviceOrders', JSON.stringify(updatedOrders));
    return true;
  } catch (error) {
    console.error('Erro ao salvar assinatura:', error);
    throw error;
  }
};

export const updateClientSignature = async (orderId: string, clientInfo: {
  name: string;
  phone: string;
  emails: string[];
  signature: string;
}) => {
  try {
    const savedOrders = localStorage.getItem('serviceOrders');
    if (!savedOrders) return;

    const orders = JSON.parse(savedOrders);
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          clientInfo: {
            name: clientInfo.name,
            contact: clientInfo.phone,
            email: clientInfo.emails.join(', '),
            signature: clientInfo.signature
          }
        };
        return updatedOrder;
      }
      return order;
    });

    localStorage.setItem('serviceOrders', JSON.stringify(updatedOrders));
    return true;
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    throw error;
  }
}

// Função para mostrar opções de compartilhamento após finalizar ordem de serviço
export const showShareOptionsAfterFinishServiceOrder = async (
  serviceData: ServiceOrderPDFData
): Promise<void> => {
  try {
    // Verificar se estamos em plataforma nativa
    if (Capacitor.isNativePlatform()) {
      // Mostrar opções de compartilhamento para dispositivos móveis
      const options = [
        'Gerar e Compartilhar PDF',
        'Gerar PDF Editável',
        'Salvar PDF Localmente',
        'Cancelar'
      ];

      // Simular um ActionSheet nativo (em uma implementação real, usaria Capacitor ActionSheet)
      const choice = await new Promise<number>((resolve) => {
        const message = `Ordem de Serviço ${serviceData.orderNumber} finalizada!\n\nEscolha uma opção:`;
        const optionsText = options.map((opt, index) => `${index + 1}. ${opt}`).join('\n');

        const userChoice = prompt(`${message}\n\n${optionsText}\n\nDigite o número da opção (1-${options.length}):`);
        const choiceNumber = parseInt(userChoice || '4') - 1;
        resolve(Math.max(0, Math.min(choiceNumber, options.length - 1)));
      });

      switch (choice) {
        case 0: // Gerar e Compartilhar PDF
          await generateAndShareServiceOrderPDF(serviceData, true);
          break;
        case 1: // Gerar PDF Editável
          await generateEditableServiceOrderPDF(serviceData);
          break;
        case 2: // Salvar PDF Localmente
          await generateAndShareServiceOrderPDF(serviceData, false);
          break;
        case 3: // Cancelar
        default:
          console.log('Operação cancelada pelo usuário');
          break;
      }
    } else {
      // Para plataformas web, mostrar opções simplificadas
      const shouldGenerate = confirm(
        `Ordem de Serviço ${serviceData.orderNumber} finalizada!\n\nDeseja gerar o PDF agora?`
      );

      if (shouldGenerate) {
        const shouldMakeEditable = confirm(
          'Deseja gerar um PDF editável ou um PDF padrão?\n\nOK = PDF Editável\nCancelar = PDF Padrão'
        );

        if (shouldMakeEditable) {
          await generateEditableServiceOrderPDF(serviceData);
        } else {
          await generateAndShareServiceOrderPDF(serviceData, false);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao mostrar opções de compartilhamento:', error);
    // Fallback: gerar PDF padrão
    try {
      await generateAndShareServiceOrderPDF(serviceData, false);
    } catch (fallbackError) {
      console.error('Erro no fallback de geração de PDF:', fallbackError);
      throw new Error('Não foi possível gerar o PDF da ordem de serviço');
    }
  }
};