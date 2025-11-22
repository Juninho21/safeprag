import React, { useEffect, useState, useMemo } from 'react';
import { listUsers, createUser, updateUserRole, deleteUser, AdminUser } from '../../services/adminApi';
import { auth } from '../../config/firebase';
import { Modal } from '../Modal';
import {
  X,
  Search,
  UserPlus,
  Filter,
  Shield,
  Briefcase,
  User,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { RequireRole } from '../Auth/RequireRole';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany } from '../../services/companyService';
import type { Company } from '../../types/company.types';

const ROLES: AdminUser['role'][] = ['admin', 'controlador', 'cliente'];

export default function AdminUsers({ companyId: propCompanyId }: { companyId?: string }) {
  const { companyId: authCompanyId } = useAuth();
  const companyId = propCompanyId || authCompanyId;
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminUser['role'] | 'all'>('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'cliente' as AdminUser['role']
  });

  // Selected User for Actions
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Load Data
  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers(100, companyId || undefined);
      setUsers(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Erro ao listar usuários');
      }
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    async function loadCompany() {
      if (companyId) {
        try {
          const companyData = await getCompany(companyId);
          setCompany(companyData);
        } catch (e) {
          // eslint-disable-next-line no-undef
          console.error('Erro ao carregar empresa:', e);
        }
      }
    }
    loadCompany();
    refresh();
  }, [companyId, refresh]);

  // Handlers
  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.email || !formData.password) {
        throw new Error('Informe email e senha temporária');
      }
      await createUser({ ...formData, companyId: companyId || undefined });
      setSuccess('Usuário criado com sucesso!');
      setIsCreateModalOpen(false);
      setFormData({ email: '', password: '', displayName: '', role: 'cliente' });
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
      // eslint-disable-next-line no-undef
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError(null);
    try {
      await updateUserRole(selectedUser.uid, formData.role);
      setSuccess('Função atualizada com sucesso!');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Erro ao atualizar papel');
    } finally {
      setLoading(false);
      // eslint-disable-next-line no-undef
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    try {
      await deleteUser(selectedUser.uid);
      setSuccess('Usuário removido com sucesso!');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Erro ao excluir usuário');
    } finally {
      setLoading(false);
      // eslint-disable-next-line no-undef
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = (
        (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Helper for Badges
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" /> Admin</span>;
      case 'controlador':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Briefcase className="w-3 h-3 mr-1" /> Controlador</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><User className="w-3 h-3 mr-1" /> Cliente</span>;
    }
  };

  return (
    <RequireRole allow={["admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-sm text-gray-500 mt-1">
              {company ? `Empresa: ${company.name}` : 'Gerencie o acesso e permissões do sistema'}
            </p>
          </div>
          <Button onClick={() => {
            setFormData({ email: '', password: '', displayName: '', role: 'cliente' });
            setIsCreateModalOpen(true);
          }} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
            <AlertCircle className="text-red-500 w-5 h-5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-center gap-3">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as AdminUser['role'] | 'all')}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
            >
              <option value="all">Todas as Funções</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Carregando usuários...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Nenhum usuário encontrado.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
                            {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.displayName || 'Sem nome'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setFormData(prev => ({ ...prev, role: user.role || 'cliente' }));
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                            title="Editar Função"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (auth?.currentUser?.uid === user.uid) return;
                              setSelectedUser(user);
                              setIsDeleteModalOpen(true);
                            }}
                            disabled={auth?.currentUser?.uid === user.uid}
                            className={`p-1 rounded-full transition-colors ${auth?.currentUser?.uid === user.uid
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                              }`}
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        <Modal isOpen={isCreateModalOpen} onRequestClose={() => setIsCreateModalOpen(false)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Novo Usuário</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
              {/* Hidden inputs to prevent browser autofill */}
              <input type="text" style={{ display: 'none' }} />
              <input type="password" style={{ display: 'none' }} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="new_user_email"
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  name="new_user_name"
                  autoComplete="off"
                  className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Temporária</label>
                <input
                  type="password"
                  name="new_user_password"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">O usuário deverá alterar esta senha no primeiro acesso.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as AdminUser['role'] })}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}

                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Edit Role Modal */}
        <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Alterar Função</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Editando permissões para: <span className="font-medium text-gray-900">{selectedUser?.displayName || selectedUser?.email}</span>
              </p>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Função</label>
                <select
                  className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as AdminUser['role'] })}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onRequestClose={() => setIsDeleteModalOpen(false)}>
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Excluir Usuário?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Tem certeza que deseja excluir <strong>{selectedUser?.displayName || selectedUser?.email}</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </RequireRole>
  );
}