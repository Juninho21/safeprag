import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
import { Trash2, Pencil } from 'lucide-react';
import { clientService } from '../services/dataService';

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
      setClient(initialState);
      setIsEditing(false);
      loadClients();
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error);
      // toast.error('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    
    try {
      console.log('📱 Excluindo cliente:', id);
      await clientService.deleteClient(id);

      console.log('✅ Cliente excluído com sucesso!');
      // toast.success('Cliente excluído com sucesso!');
      
      // Atualizar a lista de clientes
      await loadClients();
    } catch (error) {
      console.error('❌ Erro ao excluir cliente:', error);
      // toast.error('Erro ao excluir cliente');
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
    if (!client.branch.trim()) {
      // toast.error('Razão Social é obrigatória');
      return false;
    }
    if (!client.name.trim()) {
      // toast.error('Nome Fantasia é obrigatório');
      return false;
    }
    if (!client.cnpj.trim()) {
      // toast.error('CNPJ é obrigatório');
      return false;
    }
    if (!client.address.trim()) {
      // toast.error('Endereço é obrigatório');
      return false;
    }
    if (!client.contact.trim()) {
      // toast.error('Contato é obrigatório');
      return false;
    }
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cadastro de Cliente</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Razão Social</label>
            <input
              type="text"
              name="branch"
              value={client.branch}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
            <input
              type="text"
              name="name"
              value={client.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CNPJ</label>
            <input
              type="text"
              name="cnpj"
              value={client.cnpj}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Endereço</label>
            <input
              type="text"
              name="address"
              value={client.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bairro</label>
            <input
              type="text"
              name="neighborhood"
              value={client.neighborhood}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cidade</label>
            <input
              type="text"
              name="city"
              value={client.city}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <input
              type="text"
              name="state"
              value={client.state}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CEP</label>
            <input
              type="text"
              name="zip_code"
              value={client.zip_code}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contato</label>
            <input
              type="text"
              name="contact"
              value={client.contact}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="text"
              name="phone"
              value={client.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              name="email"
              value={client.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>

      {/* Lista de Clientes */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Clientes Cadastrados</h3>
        
        {/* Versão Desktop (tabela) */}
        <div className="hidden md:block overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Código</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Razão Social</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nome Fantasia</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">CNPJ</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contato</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Telefone</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-blue-600 bg-blue-50 sm:pl-6">
                        {client.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{client.branch}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{client.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{client.cnpj}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{client.contact}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{client.phone}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar cliente"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir cliente"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Versão Mobile (cards) */}
        <div className="md:hidden space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Cabeçalho do Card */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                        Código: {client.code}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><span className="font-medium">Razão Social:</span> {client.branch}</div>
                      <div><span className="font-medium">Nome Fantasia:</span> {client.name}</div>
                      <div><span className="font-medium">CNPJ:</span> {client.cnpj}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                      title="Editar cliente"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                      title="Excluir cliente"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Corpo do Card */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Endereço</div>
                    <div className="text-sm text-gray-900">{client.address}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Bairro</div>
                    <div className="text-sm text-gray-900">{client.neighborhood}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Cidade/Estado</div>
                    <div className="text-sm text-gray-900">{client.city} - {client.state}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">CEP</div>
                    <div className="text-sm text-gray-900">{client.zip_code}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Contato</div>
                    <div className="text-sm text-gray-900">{client.contact}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Telefone</div>
                    <div className="text-sm text-gray-900">{client.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">E-mail</div>
                    <div className="text-sm text-gray-900">{client.email}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
