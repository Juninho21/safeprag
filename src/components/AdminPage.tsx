import React, { useState, useEffect, useRef } from 'react';
// import { toast } from 'react-toastify';
import { AdminTabs } from './AdminTabs';

import BackupMaintenance from './BackupMaintenance/BackupMaintenance';
import { ClientForm } from './ClientForm';
import { ProductForm } from './ProductForm';
import { ImageUpload } from './ImageUpload';
import { Trash2, Eye, X, Building2, FileText, ShieldCheck, ChevronDown, Users, Pen } from 'lucide-react';
import { STORAGE_KEYS } from '../services/storageKeys';
import { Modal } from './Modal';
import { SuccessModal } from './SuccessModal';
import DownloadsManagement from './ServiceOrders/DownloadsManagement';
import AdminUsers from './AdminUsers';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCompany,
  saveCompany,
  uploadCompanyLogo
} from '../services/companyService';
import { useAuth } from '../contexts/AuthContext';


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
  const { companyId: authCompanyId } = useAuth();

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
        // Se o usuário já tem uma empresa vinculada, carrega ela
        // Se não (admin/dono), tenta carregar a empresa que está sendo editada (se houver ID no estado)
        const targetId = authCompanyId || companyData.id;

        if (targetId) {
          const remoteData = await getCompany(targetId);
          if (remoteData) {
            setCompanyData({
              ...emptyCompanyData,
              ...remoteData,
              environmental_license: {
                ...emptyCompanyData.environmental_license,
                ...(remoteData.environmental_license || {})
              },
              sanitary_permit: {
                ...emptyCompanyData.sanitary_permit,
                ...(remoteData.sanitary_permit || {})
              }
            });
            console.log('Dados da empresa carregados do Firestore:', remoteData);
            setShowSavedData(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
      }
    };
    loadCompanyData();
  }, [authCompanyId]); // Removido companyData.id para evitar loop, carrega apenas na montagem ou mudança de authCompanyId

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
    } else if (pathname.endsWith('/configuracoes/usuarios')) {
      setActiveTab('usuarios');
    } else if (pathname.endsWith('/configuracoes/usuarios')) {
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
    else if (activeTab === 'usuarios') path = '/configuracoes/usuarios';
    else if (activeTab === 'clientes') path = '/configuracoes/clientes';
    else if (activeTab === 'usuarios') path = '/configuracoes/usuarios';
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
    if (activeTab === 'empresa') {
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
      // Se não tiver ID, gera um novo
      const idToSave = companyData.id || authCompanyId || crypto.randomUUID();

      // Salvar no Firestore
      await saveCompany(idToSave, {
        ...companyData
      });

      // Atualiza o estado com o ID (caso seja novo)
      setCompanyData(prev => ({ ...prev, id: idToSave }));

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
    if (window.confirm('A exclusão de empresas deve ser feita pelo painel administrativo.')) {
      // Não implementado via frontend por segurança
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const targetId = companyData.id || authCompanyId;
      if (!targetId) {
        alert('Salve os dados da empresa antes de enviar o logo.');
        return;
      }

      // Upload para Firestore Storage
      const logoUrl = await uploadCompanyLogo(targetId, file);

      setCompanyData(prev => ({
        ...prev,
        logo_url: logoUrl
      }));

      // Atualiza o registro da empresa com a nova URL
      await saveCompany(targetId, { logo_url: logoUrl });

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
              <div className="space-y-6">
                {/* Dados da Empresa */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Dados da Empresa</h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex justify-center mb-6">
                        <ImageUpload
                          onFileSelect={handleLogoUpload}
                          currentImageUrl={companyData.logo_url || ""}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome da Empresa
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={companyData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Digite o nome da empresa"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="00.000.000/0000-00"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="(00) 00000-0000"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="contato@empresa.com"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Rua, Número, Bairro, Cidade - UF"
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Documentação */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Documentação</h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Licença Ambiental */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        Licença Ambiental
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                          <label htmlFor="environmentalLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Número da Licença
                          </label>
                          <input
                            type="text"
                            id="environmentalLicenseNumber"
                            name="environmental_license.number"
                            value={companyData.environmental_license.number}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="environmentalLicenseDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Validade
                          </label>
                          <input
                            type="date"
                            id="environmentalLicenseDate"
                            name="environmental_license.date"
                            value={companyData.environmental_license.date}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alvará Sanitário */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        Alvará Sanitário
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                          <label htmlFor="sanitaryPermitNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Número do Alvará
                          </label>
                          <input
                            type="text"
                            id="sanitaryPermitNumber"
                            name="sanitary_permit.number"
                            value={companyData.sanitary_permit.number}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="sanitaryPermitExpiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Validade
                          </label>
                          <input
                            type="date"
                            id="sanitaryPermitExpiryDate"
                            name="sanitary_permit.expiry_date"
                            value={companyData.sanitary_permit.expiry_date}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <div className="flex gap-3">
                        {showSavedData && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Excluir Dados
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-colors font-medium"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assinaturas */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Pen className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Assinaturas Digitais</h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecione o Tipo de Assinatura
                        </label>
                        <div className="relative">
                          <select
                            value={userData.signatureType}
                            onChange={(e) => {
                              handleSignatureTypeChange(e.target.value as 'controlador' | 'tecnico');
                            }}
                            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700 text-base transition-all cursor-pointer hover:border-blue-400"
                          >
                            <option value="controlador">Controlador de Pragas</option>
                            <option value="tecnico">Responsável Técnico</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                            <ChevronDown className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      {userData.signatureType === 'controlador' && (
                        <form onSubmit={handleSaveControlador} className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-200">
                            <Users className="h-5 w-5 text-gray-500" />
                            Dados do Controlador
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo
                              </label>
                              <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nome do profissional"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone
                              </label>
                              <input
                                type="tel"
                                value={userData.phone}
                                onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail
                              </label>
                              <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="email@exemplo.com"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assinatura Digital
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white hover:border-blue-400 transition-colors">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Pen className="w-4 h-4" />
                                    Desenhe no campo abaixo
                                  </span>
                                  <div className="flex gap-2">
                                    {userData.signature && (
                                      <button
                                        type="button"
                                        onClick={() => handleViewSignature('controlador')}
                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" /> Ver
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={clearControladorSignature}
                                      className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 flex items-center gap-1 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> Limpar
                                    </button>
                                  </div>
                                </div>
                                <canvas
                                  ref={canvasControladorRef}
                                  width={600}
                                  height={200}
                                  onMouseDown={startDrawingControlador}
                                  onMouseMove={drawControlador}
                                  onMouseUp={stopDrawingControlador}
                                  onMouseOut={stopDrawingControlador}
                                  onTouchStart={startDrawingControlador}
                                  onTouchMove={drawControlador}
                                  onTouchEnd={stopDrawingControlador}
                                  className="w-full h-48 bg-white cursor-crosshair touch-none rounded border border-gray-100 shadow-inner"
                                />
                                <p className="text-xs text-gray-400 mt-2 text-center">
                                  Use o mouse ou o dedo para assinar
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-6">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm font-medium transition-colors"
                            >
                              Salvar Controlador
                            </button>
                          </div>
                        </form>
                      )}

                      {userData.signatureType === 'tecnico' && (
                        <form onSubmit={handleSaveTecnico} className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-200">
                            <ShieldCheck className="h-5 w-5 text-gray-500" />
                            Dados do Responsável Técnico
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo
                              </label>
                              <input
                                type="text"
                                value={userData.tecnicoName}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nome do engenheiro/técnico"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                CREA / Registro
                              </label>
                              <input
                                type="text"
                                value={userData.tecnicoCrea}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoCrea: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Número do registro"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone
                              </label>
                              <input
                                type="tel"
                                value={userData.tecnicoPhone}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoPhone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail
                              </label>
                              <input
                                type="email"
                                value={userData.tecnicoEmail}
                                onChange={(e) => setUserData((prev) => ({ ...prev, tecnicoEmail: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="email@exemplo.com"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assinatura Digital
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white hover:border-blue-400 transition-colors">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Pen className="w-4 h-4" />
                                    Desenhe no campo abaixo
                                  </span>
                                  <div className="flex gap-2">
                                    {userData.tecnicoSignature && (
                                      <button
                                        type="button"
                                        onClick={() => handleViewSignature('tecnico')}
                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" /> Ver
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={clearTecnicoSignature}
                                      className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 flex items-center gap-1 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> Limpar
                                    </button>
                                  </div>
                                </div>
                                <canvas
                                  ref={canvasTecnicoRef}
                                  width={600}
                                  height={200}
                                  onMouseDown={startDrawingTecnico}
                                  onMouseMove={drawTecnico}
                                  onMouseUp={stopDrawingTecnico}
                                  onMouseOut={stopDrawingTecnico}
                                  onTouchStart={startDrawingTecnico}
                                  onTouchMove={drawTecnico}
                                  onTouchEnd={stopDrawingTecnico}
                                  className="w-full h-48 bg-white cursor-crosshair touch-none rounded border border-gray-100 shadow-inner"
                                />
                                <p className="text-xs text-gray-400 mt-2 text-center">
                                  Use o mouse ou o dedo para assinar
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-6">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm font-medium transition-colors"
                            >
                              Salvar Responsável Técnico
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
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
                <AdminUsers companyId={companyData.id} />
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
