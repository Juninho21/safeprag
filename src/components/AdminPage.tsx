import React, { useState, useEffect, useRef } from 'react';
// import { toast } from 'react-toastify';
import { AdminTabs } from './AdminTabs';

import BackupMaintenance from './BackupMaintenance/BackupMaintenance';
import { ClientForm } from './ClientForm';
import { ProductForm } from './ProductForm';
import { ImageUpload } from './ImageUpload';
import { Trash2, Pen, Eye, X } from 'lucide-react';
import { STORAGE_KEYS, backupAllData, restoreBackup } from '../services/storageKeys';
import { Modal } from './Modal';
import { SuccessModal } from './SuccessModal';
import DownloadsManagement from './ServiceOrders/DownloadsManagement';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCompanyFromLocalStorage as getCompanyBackup,
  saveCompanyToLocalStorage as saveCompanyBackup,
  deleteCompanyFromLocalStorage as deleteCompanyBackup,
  uploadCompanyLogoToLocalStorage as uploadLogoBackup
} from '../services/companyService';


interface CompanyData {
  id?: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string;
  environmental_license: {
    number: string;
    date: string;
  };
  sanitary_permit: {
    number: string;
    expiry_date: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface UserData {
  name: string;
  phone: string;
  email: string;
  signatureType: 'controlador' | 'tecnico';
  tecnicoName?: string;
  tecnicoCrea?: string;
  tecnicoPhone?: string;
  tecnicoEmail?: string;
  signature?: string;
  tecnicoSignature?: string;
}


const emptyCompanyData: CompanyData = {
  name: '',
  cnpj: '',
  phone: '',
  email: '',
  address: '',
  logo_url: '',
  environmental_license: {
    number: '',
    date: ''
  },
  sanitary_permit: {
    number: '',
    expiry_date: ''
  }
};

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('empresa');
  const location = useLocation();
  const navigate = useNavigate();

  const [showSavedData, setShowSavedData] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>(() => {
    const savedData = localStorage.getItem(STORAGE_KEYS.COMPANY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          ...emptyCompanyData,
          ...parsed,
          environmental_license: {
            ...emptyCompanyData.environmental_license,
            ...parsed.environmental_license
          },
          sanitary_permit: {
            ...emptyCompanyData.sanitary_permit,
            ...parsed.sanitary_permit
          }
        };
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        return emptyCompanyData;
      }
    }
    return emptyCompanyData;
  });
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_DATA) || localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : {
      name: '',
      phone: '',
      email: '',
      signatureType: 'controlador',
      tecnicoName: '',
      tecnicoCrea: '',
      tecnicoPhone: '',
      tecnicoEmail: '',
      signature: undefined,
      tecnicoSignature: undefined,
    };
  });

  const canvasControladorRef = useRef<HTMLCanvasElement>(null);
  const canvasTecnicoRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingControlador, setIsDrawingControlador] = useState(false);
  const [lastControladorX, setLastControladorX] = useState(0);
  const [lastControladorY, setLastControladorY] = useState(0);
  const [isDrawingTecnico, setIsDrawingTecnico] = useState(false);
  const [lastTecnicoX, setLastTecnicoX] = useState(0);
  const [lastTecnicoY, setLastTecnicoY] = useState(0);

  const [isSignatureViewModalOpen, setIsSignatureViewModalOpen] = useState(false);
  const [signatureViewImageSrc, setSignatureViewImageSrc] = useState<string | undefined>(undefined);
  const [signatureViewTitle, setSignatureViewTitle] = useState('');

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
  };

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        // Carregar dados APENAS do localStorage (arquivo JSON de backup)
        const localData = getCompanyBackup();
        if (localData) {
          setCompanyData({
            ...emptyCompanyData,
            ...localData,
            environmental_license: {
              ...emptyCompanyData.environmental_license,
              ...(localData.environmental_license || {})
            },
            sanitary_permit: {
              ...emptyCompanyData.sanitary_permit,
              ...(localData.sanitary_permit || {})
            }
          });
          console.log('Dados da empresa carregados do arquivo JSON de backup:', localData);
          setShowSavedData(true);
        } else {
          // Se não há dados, mantém campos vazios (sem dados padrão)
          console.log('Nenhum dado da empresa encontrado no arquivo JSON de backup');
          setCompanyData(emptyCompanyData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        setCompanyData(emptyCompanyData);
      }
    };
    loadCompanyData();
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.endsWith('/configuracoes/empresa')) {
      setActiveTab('empresa');
    } else if (pathname.endsWith('/configuracoes/produtos')) {
      setActiveTab('produtos');
    } else if (pathname.endsWith('/configuracoes/downloads')) {
      setActiveTab('downloads');
    } else if (pathname.endsWith('/configuracoes/clientes')) {
      setActiveTab('clientes');
    } else if (pathname.endsWith('/configuracoes/assinaturas')) {
      setActiveTab('usuarios');
    } else if (pathname.endsWith('/configuracoes/backup')) {
      setActiveTab('backup');
    }
  }, [location.pathname]);

  useEffect(() => {
    let path = '/configuracoes/empresa';
    if (activeTab === 'empresa') path = '/configuracoes/empresa';
    else if (activeTab === 'produtos') path = '/configuracoes/produtos';
    else if (activeTab === 'downloads') path = '/configuracoes/downloads';
    else if (activeTab === 'clientes') path = '/configuracoes/clientes';
    else if (activeTab === 'usuarios') path = '/configuracoes/assinaturas';
    else if (activeTab === 'backup') path = '/configuracoes/backup';

    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'userData') {
      setUserData(prev => ({ ...prev, signatureType: 'controlador' }));
    }
  }, [activeTab]);

  useEffect(() => {
    // Carregar dados salvos quando a aba for aberta
    if (activeTab === 'userData') {
      const savedData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || localStorage.getItem('userData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setUserData(prev => ({
          ...prev,
          ...parsedData,
          signatureType: prev.signatureType // Mantém o tipo selecionado
        }));
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'usuarios') {
      // Carregar dados do localStorage para preencher o formulário de assinaturas
      const savedData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || localStorage.getItem('userData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setUserData(prev => ({
          ...prev,
          ...parsedData,
          signatureType: prev.signatureType // Mantém o tipo selecionado
        }));
      }
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyData.name || !companyData.cnpj || !companyData.phone || !companyData.address || !companyData.email) {
      // toast.error('Por favor, preencha todos os campos obrigatórios');
      console.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    try {
      // Salvar no localStorage
      await saveCompanyBackup(companyData);

      console.log('Dados da empresa salvos com sucesso!');
      setShowSavedData(true);
      showSuccess('Dados da empresa salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      // toast.error('Erro ao salvar dados da empresa');
      console.error('Erro ao salvar dados da empresa');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir os dados da empresa?')) {
      try {
        // Deletar do localStorage
        deleteCompanyBackup();

        // Resetar o estado
        setCompanyData(emptyCompanyData);
        setShowSavedData(false);
        // toast.success('Dados da empresa excluídos com sucesso!');
        console.log('Dados da empresa excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir dados da empresa:', error);
      }
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      // URL base64 para localStorage
      const logoUrl = await uploadLogoBackup(file);
      setCompanyData(prev => ({
        ...prev,
        logo_url: logoUrl
      }));
      console.log('Logo da empresa atualizado com sucesso!');
      showSuccess('Logo da empresa atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'environmental_license') {
        setCompanyData(prev => ({
          ...prev,
          environmental_license: {
            ...prev.environmental_license,
            [child]: value
          }
        }));
      } else if (parent === 'sanitary_permit') {
        setCompanyData(prev => ({
          ...prev,
          sanitary_permit: {
            ...prev.sanitary_permit,
            [child]: value
          }
        }));
      }
    } else {
      setCompanyData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBackup = () => {
    try {
      const backup = backupAllData();
      const backupStr = JSON.stringify(backup);
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sulpest_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // toast.success('Backup realizado com sucesso!');
      console.log('Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      // toast.error('Erro ao gerar backup');
      console.error('Erro ao gerar backup');
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        restoreBackup(backup);

        // Recarregar dados da empresa após o restore
        const localData = getCompanyBackup();
        if (localData) {
          setCompanyData({
            ...emptyCompanyData,
            ...localData,
            environmental_license: {
              ...emptyCompanyData.environmental_license,
              ...(localData.environmental_license || {})
            },
            sanitary_permit: {
              ...emptyCompanyData.sanitary_permit,
              ...(localData.sanitary_permit || {})
            }
          });
          setShowSavedData(true);
          console.log('Dados da empresa carregados do backup:', localData);
        }

        // toast.success('Backup restaurado com sucesso!');
        console.log('Backup restaurado com sucesso!');
      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        // toast.error('Erro ao restaurar backup');
        console.error('Erro ao restaurar backup');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveControlador = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Salvar no localStorage
      const updatedUserData = {
        ...userData,
        signature: userData.signature
      };
      // Persistir em ambas as chaves para compatibilidade
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      // toast.success('Dados do Controlador salvos com sucesso!');
      console.log('Dados do Controlador salvos com sucesso!');
      showSuccess('Dados do Controlador salvos com sucesso!');
    } catch (error) {
      // toast.error('Erro ao salvar dados do Controlador');
      console.error('Erro ao salvar dados do Controlador');
    }
  };

  const handleSaveTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Salvar no localStorage
      const updatedUserData = {
        ...userData,
        tecnicoName: userData.tecnicoName,
        tecnicoCrea: userData.tecnicoCrea,
        tecnicoPhone: userData.tecnicoPhone,
        tecnicoEmail: userData.tecnicoEmail,
        tecnicoSignature: userData.tecnicoSignature
      };
      // Persistir em ambas as chaves para compatibilidade
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      // toast.success('Dados do Responsável Técnico salvos com sucesso!');
      console.log('Dados do Responsável Técnico salvos com sucesso!');
      showSuccess('Dados do Responsável Técnico salvos com sucesso!');
    } catch (error) {
      // toast.error('Erro ao salvar dados do Responsável Técnico');
      console.error('Erro ao salvar dados do Responsável Técnico');
    }
  };

  const handleSignatureTypeChange = (type: 'controlador' | 'tecnico') => {
    setUserData(prev => ({ ...prev, signatureType: type }));
  };

  const startDrawingControlador = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasControladorRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    setIsDrawingControlador(true);
    setLastControladorX(x);
    setLastControladorY(y);
  };

  const drawControlador = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingControlador || !canvasControladorRef.current) return;

    const canvas = canvasControladorRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.beginPath();
    ctx.moveTo(lastControladorX, lastControladorY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastControladorX(x);
    setLastControladorY(y);
  };

  const startDrawingTecnico = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasTecnicoRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    setIsDrawingTecnico(true);
    setLastTecnicoX(x);
    setLastTecnicoY(y);
  };

  const drawTecnico = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingTecnico || !canvasTecnicoRef.current) return;

    const canvas = canvasTecnicoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.beginPath();
    ctx.moveTo(lastTecnicoX, lastTecnicoY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastTecnicoX(x);
    setLastTecnicoY(y);
  };

  const stopDrawingControlador = () => {
    if (isDrawingControlador && canvasControladorRef.current) {
      setIsDrawingControlador(false);
      const signatureData = canvasControladorRef.current.toDataURL();
      setUserData(prev => ({ ...prev, signature: signatureData }));
    }
  };

  const clearControladorSignature = () => {
    if (canvasControladorRef.current) {
      const ctx = canvasControladorRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasControladorRef.current.width, canvasControladorRef.current.height);
        setUserData(prev => ({ ...prev, signature: undefined }));
      }
    }
  };

  const stopDrawingTecnico = () => {
    if (isDrawingTecnico && canvasTecnicoRef.current) {
      setIsDrawingTecnico(false);
      const signatureData = canvasTecnicoRef.current.toDataURL();
      setUserData(prev => ({ ...prev, tecnicoSignature: signatureData }));
    }
  };

  const clearTecnicoSignature = () => {
    if (canvasTecnicoRef.current) {
      const ctx = canvasTecnicoRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasTecnicoRef.current.width, canvasTecnicoRef.current.height);
        setUserData(prev => ({ ...prev, tecnicoSignature: undefined }));
      }
    }
  };

  const handleViewSignature = (type: 'controlador' | 'tecnico') => {
    if (type === 'controlador' && userData.signature) {
      setSignatureViewImageSrc(userData.signature);
      setSignatureViewTitle('Assinatura do Controlador');
      setIsSignatureViewModalOpen(true);
    } else if (type === 'tecnico' && userData.tecnicoSignature) {
      setSignatureViewImageSrc(userData.tecnicoSignature);
      setSignatureViewTitle('Assinatura do Responsável Técnico');
      setIsSignatureViewModalOpen(true);
    } else {
      // toast.info('Nenhuma assinatura salva para visualizar.');
      console.log('Nenhuma assinatura salva para visualizar.');
    }
  };

  return (
    <div className="w-full max-w-none px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Seção de Migração */}
        {/* <div className="col-span-1 md:col-span-2">
          <MigrationTool />
        </div> */}

        {/* Seção da Empresa */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2 xl:col-span-3">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center">Empresa</h2>
          </div>

          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-4 sm:mt-6">
            {activeTab === 'empresa' && (
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-6">
                    <ImageUpload
                      onFileSelect={handleLogoUpload}
                      currentImageUrl={companyData.logo_url || ""}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={companyData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        id="cnpj"
                        name="cnpj"
                        value={companyData.cnpj}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={companyData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={companyData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={companyData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Licença Ambiental */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Licença Ambiental</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="environmentalLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Número da Licença Ambiental
                        </label>
                        <input
                          type="text"
                          id="environmentalLicenseNumber"
                          name="environmental_license.number"
                          value={companyData.environmental_license.number}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="environmentalLicenseDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Validade da Licença Ambiental
                        </label>
                        <input
                          type="date"
                          id="environmentalLicenseDate"
                          name="environmental_license.date"
                          value={companyData.environmental_license.date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alvará Sanitário */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Alvará Sanitário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sanitaryPermitNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Número do Alvará Sanitário
                        </label>
                        <input
                          type="text"
                          id="sanitaryPermitNumber"
                          name="sanitary_permit.number"
                          value={companyData.sanitary_permit.number}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="sanitaryPermitExpiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Validade do Alvará Sanitário
                        </label>
                        <input
                          type="date"
                          id="sanitaryPermitExpiryDate"
                          name="sanitary_permit.expiry_date"
                          value={companyData.sanitary_permit.expiry_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 space-x-3">
                    {showSavedData && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Excluir
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'clientes' && (
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Clientes</h2>
                <ClientForm />
              </div>
            )}

            {activeTab === 'produtos' && (
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Produtos</h2>
                <ProductForm />
              </div>
            )}



            {activeTab === 'usuarios' && (
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Usuários</h2>
                <div className="space-y-8">
                  <div className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Usuário/Assinatura
                        </label>
                        <select
                          value={userData.signatureType}
                          onChange={(e) => {
                            handleSignatureTypeChange(e.target.value as 'controlador' | 'tecnico');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="controlador">Controlador de pragas</option>
                          <option value="tecnico">Responsável técnico</option>
                        </select>
                      </div>

                      {userData.signatureType === 'controlador' && (
                        <form onSubmit={handleSaveControlador} className="border border-gray-200 rounded-lg p-4 space-y-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Dados do Controlador de Pragas
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome do Controlador de Pragas
                              </label>
                              <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone do Controlador de pragas
                              </label>
                              <input
                                type="tel"
                                value={userData.phone}
                                onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail do controlador de pragas
                              </label>
                              <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assinatura do controlador de pragas
                              </label>
                              <div className="border border-gray-300 rounded-md p-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-500">
                                    <Pen className="inline-block w-4 h-4 mr-1" />
                                    Desenhe sua assinatura abaixo
                                  </span>
                                  <div className="flex space-x-2">
                                    {userData.signature && (
                                      <button
                                        type="button"
                                        onClick={() => handleViewSignature('controlador')}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                                      >
                                        <Eye className="w-4 h-4 mr-1" /> Visualizar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={clearControladorSignature}
                                      className="text-sm text-red-600 hover:text-red-700 flex items-center"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" /> Limpar
                                    </button>
                                  </div>
                                </div>
                                <canvas
                                  ref={canvasControladorRef}
                                  width={400}
                                  height={200}
                                  onMouseDown={startDrawingControlador}
                                  onMouseMove={drawControlador}
                                  onMouseUp={stopDrawingControlador}
                                  onMouseOut={stopDrawingControlador}
                                  onTouchStart={startDrawingControlador}
                                  onTouchMove={drawControlador}
                                  onTouchEnd={stopDrawingControlador}
                                  className="border border-gray-200 rounded w-full bg-white cursor-crosshair"
                                  style={{ touchAction: 'none' }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Salvar Dados do Controlador
                            </button>
                          </div>
                        </form>
                      )}

                      {userData.signatureType === 'tecnico' && (
                        <form onSubmit={handleSaveTecnico} className="border border-gray-200 rounded-lg p-4 space-y-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Dados do Responsável Técnico
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome do Responsável Técnico
                              </label>
                              <input
                                type="text"
                                value={userData.tecnicoName}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                CREA
                              </label>
                              <input
                                type="text"
                                value={userData.tecnicoCrea}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoCrea: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone do Responsável Técnico
                              </label>
                              <input
                                type="tel"
                                value={userData.tecnicoPhone}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoPhone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail do Responsável Técnico
                              </label>
                              <input
                                type="email"
                                value={userData.tecnicoEmail}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoEmail: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assinatura do Respnsável Técnico
                              </label>
                              <div className="border border-gray-300 rounded-md p-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-500">
                                    <Pen className="inline-block w-4 h-4 mr-1" />
                                    Desenhe sua assinatura abaixo
                                  </span>
                                  <div className="flex space-x-2">
                                    {userData.tecnicoSignature && (
                                      <button
                                        type="button"
                                        onClick={() => handleViewSignature('tecnico')}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                                      >
                                        <Eye className="w-4 h-4 mr-1" /> Visualizar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={clearTecnicoSignature}
                                      className="text-sm text-red-600 hover:text-red-700 flex items-center"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" /> Limpar
                                    </button>
                                  </div>
                                </div>
                                <canvas
                                  ref={canvasTecnicoRef}
                                  width={400}
                                  height={200}
                                  onMouseDown={startDrawingTecnico}
                                  onMouseMove={drawTecnico}
                                  onMouseUp={stopDrawingTecnico}
                                  onMouseOut={stopDrawingTecnico}
                                  onTouchStart={startDrawingTecnico}
                                  onTouchMove={drawTecnico}
                                  onTouchEnd={stopDrawingTecnico}
                                  className="border border-gray-200 rounded w-full bg-white cursor-crosshair"
                                  style={{ touchAction: 'none' }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Salvar Dados do Técnico
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Downloads</h2>
                <DownloadsManagement />
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="bg-white shadow rounded-lg p-3 sm:p-6">
                <BackupMaintenance />
              </div>
            )}


          </div>
        </div>

        {/* Seção de Usuário */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* ... existing code ... */}
        </div>
      </div>

      {/* Modal de Visualização da Assinatura */}
      <Modal
        isOpen={isSignatureViewModalOpen}
        onRequestClose={() => setIsSignatureViewModalOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{signatureViewTitle}</h2>
            <button
              onClick={() => setIsSignatureViewModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex justify-center">
            {signatureViewImageSrc ? (
              <img
                src={signatureViewImageSrc}
                alt="Assinatura Salva"
                style={{ maxWidth: '100%', maxHeight: '400px', background: 'white' }}
                className="border border-gray-200 rounded"
              />
            ) : (
              <p>Nenhuma assinatura disponível.</p>
            )}
          </div>
        </div>
      </Modal>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </div>
  );
};
