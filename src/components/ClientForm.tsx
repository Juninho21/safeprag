import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
import { Trash2, Pencil, AlertTriangle, X } from 'lucide-react';
import { clientService } from '../services/dataService';
import { Modal } from './Modal';
import { SuccessModal } from './SuccessModal';

interface Client {
  id?: string;
  code: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  branch: string;
  contact: string;
  created_at?: string;
  updated_at?: string;
  city: string;
  state: string;
  neighborhood: string;
  zip_code: string;
}

const initialState: Client = {
  code: '',
  name: '',
  cnpj: '',
  phone: '',
  email: '',
  address: '',
  branch: '',
  contact: '',
  city: '',
  state: '',
  neighborhood: '',
  zip_code: '',
};

export const ClientForm: React.FC = () => {
  const [client, setClient] = useState<Client>(initialState);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | undefined>(undefined);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadClients = async () => {
    try {
      console.log('📱 Carregando clientes do localStorage...');
      const data = await clientService.getClients();

      // Mapear os dados para garantir que todos os campos estejam presentes
      const formattedClients = data.map(client => ({
        id: client.id,
        code: client.code || 'N/A',
        name: client.name,
        cnpj: client.cnpj || client.document || '',
        phone: client.phone,
        email: client.email,
        address: client.address,
        branch: client.branch || '',
        contact: client.contact || '',
        city: client.city || '',
        state: client.state || '',
        neighborhood: client.neighborhood || '',
        zip_code: client.zip_code || '',
        created_at: client.created_at,
        updated_at: client.updated_at
      }));

      setClients(formattedClients);
      console.log('✅ Clientes carregados:', formattedClients.length);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      setClients([]);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const generateSequentialCode = async (): Promise<string> => {
    try {
      const clients = await clientService.getClients();

      if (!clients || clients.length === 0) {
        return 'C0001';
      }

      // Encontrar o maior código numérico
      const codes = clients
        .map(c => c.code)
        .filter(code => code && code.startsWith('C'))
        .map(code => parseInt(code.substring(1)))
        .filter(num => !isNaN(num));

      const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
      const nextNumber = maxCode + 1;
      return `C${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar código sequencial:', error);
      return 'C0001';
    }
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) return;

      // Gerar código sequencial apenas para novos clientes
      const code = client.id ? client.code : await generateSequentialCode();

      const clientData = {
        id: client.id || Date.now().toString(),
        code: code,
        name: client.name,
        cnpj: client.cnpj,
        document: client.cnpj, // Para compatibilidade
        phone: client.phone,
        email: client.email,
        address: client.address,
        branch: client.branch,
        contact: client.contact,
        city: client.city,
        state: client.state,
        neighborhood: client.neighborhood,
        zip_code: client.zip_code,
        status: 'active' as const,
        created_at: client.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📱 Salvando cliente:', clientData);
      await clientService.saveClient(clientData);

      console.log('✅ Cliente salvo com sucesso!');
      // toast.success(isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
      setSuccessMessage(isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
      setIsSuccessModalOpen(true);
      setClient(initialState);
      setIsEditing(false);
      loadClients();
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error);
      // toast.error('Erro ao salvar cliente');
    }
  };

  const confirmDelete = (id: string | undefined) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      console.log('📱 Excluindo cliente:', pendingDeleteId);
      await clientService.deleteClient(pendingDeleteId);
      setConfirmOpen(false);
      setPendingDeleteId(undefined);
      await loadClients();
    } catch (error) {
      console.error('❌ Erro ao excluir cliente:', error);
      setConfirmOpen(false);
      setPendingDeleteId(undefined);
    }
  };

  const handleEdit = (clientToEdit: Client) => {
    setClient(clientToEdit);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setClient(initialState);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    // Nenhum campo é obrigatório conforme solicitação
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      await handleSave();

      loadClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setError('Erro ao salvar cliente. Por favor, tente novamente.');
      // toast.error('Erro ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.code || '').toLowerCase().includes(q) ||
      (c.branch || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.cnpj || '').toLowerCase().includes(q) ||
      (c.contact || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (p: number) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Cliente' : 'Cadastro de Clientes'}</h2>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <span className="text-red-700">{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                  <input type="text" name="branch" value={client.branch} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input type="text" name="name" value={client.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CNPJ/CPF</label>
                  <input type="text" name="cnpj" value={client.cnpj} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input type="text" name="address" value={client.address} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bairro</label>
                  <input type="text" name="neighborhood" value={client.neighborhood} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input type="text" name="city" value={client.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <input type="text" name="state" value={client.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CEP</label>
                  <input type="text" name="zip_code" value={client.zip_code} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contato</label>
                  <input type="text" name="contact" value={client.contact} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="text" name="phone" value={client.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input type="email" name="email" value={client.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading} className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {loading ? 'Salvando...' : isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-6">Clientes Cadastrados</h2>
            <div className="mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por código, razão, fantasia, CNPJ, contato, e-mail..."
                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-4">
              {paginatedClients.map((client) => (
                <div key={client.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{client.branch} <span className="text-gray-500 font-normal">({client.code})</span></h3>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-800" title="Editar cliente"><Pencil className="h-5 w-5" /></button>
                      <button onClick={() => confirmDelete(client.id)} className="text-red-600 hover:text-red-800" title="Excluir cliente"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p><span className="font-medium">Nome:</span> {client.name}</p>
                    <p><span className="font-medium">CNPJ/CPF:</span> {client.cnpj}</p>
                    <p><span className="font-medium">Contato:</span> {client.contact}</p>
                    <p><span className="font-medium">Telefone:</span> {client.phone}</p>
                    <p className="sm:col-span-2"><span className="font-medium">Endereço:</span> {client.address}, {client.neighborhood}, {client.city} - {client.state}, {client.zip_code}</p>
                  </div>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum cliente cadastrado ainda.</p>
              )}
            </div>
            {filteredClients.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => goToPage(1)} disabled={currentPage === 1} className={`px-3 py-1 rounded border ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'hover:bg-gray-50 border-gray-300'}`}>«</button>
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={`px-3 py-1 rounded border ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'hover:bg-gray-50 border-gray-300'}`}>Anterior</button>
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'hover:bg-gray-50 border-gray-300'}`}>Próxima</button>
                  <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'hover:bg-gray-50 border-gray-300'}`}>»</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <Modal isOpen={confirmOpen} onRequestClose={() => { setConfirmOpen(false); setPendingDeleteId(undefined); }}>
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar exclusão</h3>
              <p className="text-sm text-gray-600 mt-1">Esta ação não pode ser desfeita. Deseja realmente excluir este cliente?</p>
              {pendingDeleteId && (
                <p className="text-sm text-gray-800 mt-2">
                  {(() => {
                    const c = clients.find(x => x.id === pendingDeleteId);
                    return c ? `${c.code} - ${c.branch || c.name}` : pendingDeleteId;
                  })()}
                </p>
              )}
            </div>
            <button onClick={() => { setConfirmOpen(false); setPendingDeleteId(undefined); }} className="ml-auto text-gray-400 hover:text-gray-600" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setConfirmOpen(false); setPendingDeleteId(undefined); }} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Excluir</button>
          </div>
        </div>
      </Modal >

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </>
  );
};
