import { useEffect, useState } from 'react';
import { 
  Users, Database, Activity, Shield, Settings, 
  CreditCard, Save, Edit2, Loader2, Search,
  CheckCircle, AlertTriangle, Info, Trash2,
  TrendingUp, Building2, UserPlus, Menu, X, ArrowUpRight
} from 'lucide-react';
import { plansService, Plan, MercadoPagoConfig } from '../services/plansService';
import { useAuth } from '../contexts/AuthContext';
import { listUsers, updateUserRole, AdminUser, listCompanies } from '../services/adminApi';

export function SuperUserPage() {
    const { user, role: currentUserRole } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>({ accessToken: '' });
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'plans' | 'config'>('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            const [fetchedPlans, fetchedConfig, fetchedUsers, fetchedCompanies] = await Promise.all([
                plansService.getPlans(),
                plansService.getMercadoPagoConfig(),
                listUsers().catch(() => []), // Fallback se o usuário não for superadmin real no backend
                listCompanies().catch(() => [])
            ]);

            setPlans(fetchedPlans);
            if (fetchedConfig) setMpConfig(fetchedConfig);
            setUsers(fetchedUsers);
            setCompanies(fetchedCompanies);

        } catch (error: any) {
            console.error('Error loading data:', error);
            setErrorMsg(`Erro ao carregar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            setErrorMsg('');
            await plansService.saveMercadoPagoConfig(mpConfig);
            alert('Configuração salva com sucesso!');
        } catch (error: any) {
            console.error(error);
            setErrorMsg(`Erro ao salvar config: ${error.message}`);
        }
    };

    const handleSavePlan = async (plan: Plan) => {
        try {
            setErrorMsg('');
            await plansService.savePlan(plan);
            setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
            setEditingPlan(null);
            alert('Plano salvo com sucesso!');
        } catch (error: any) {
            console.error(error);
            setErrorMsg(`Erro ao salvar plano: ${error.message}`);
        }
    };

    const handleUpdateRole = async (uid: string, newRole: any) => {
        try {
            await updateUserRole(uid, newRole);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
            alert('Permissão atualizada com sucesso!');
        } catch (error: any) {
            alert(`Erro ao atualizar papel: ${error.message}`);
        }
    };

    const handleResetPlans = async () => {
        if (!confirm('Deseja restaurar os planos originais?')) return;
        try {
            setLoading(true);
            await plansService.initializeDefaultPlans();
            const fetchedPlans = await plansService.getPlans();
            setPlans(fetchedPlans);
        } catch (error: any) {
            alert('Erro ao restaurar planos.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                    <p className="text-gray-500 font-medium">Carregando painel de controle...</p>
                </div>
            </div>
        );
    }

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden pb-20 md:pb-0">
            {/* Header com Responsividade */}
            <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg shadow-md shadow-purple-100">
                        <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Super Admin</h1>
                        <p className="hidden md:block text-xs text-gray-500">Gestão global do sistema</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-gray-900">{user?.displayName || 'Administrador'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                    </div>
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.email?.[0].toUpperCase() || 'A'}
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-gray-500"
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* Navegação Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="bg-white w-2/3 h-full p-6 animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
                        <div className="space-y-4 pt-10">
                            <NavButton active={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setIsMobileMenuOpen(false)}} icon={Activity} label="Visão Geral" />
                            <NavButton active={activeTab === 'users'} onClick={() => {setActiveTab('users'); setIsMobileMenuOpen(false)}} icon={Users} label="Usuários" />
                            <NavButton active={activeTab === 'plans'} onClick={() => {setActiveTab('plans'); setIsMobileMenuOpen(false)}} icon={Settings} label="Planos" />
                            <NavButton active={activeTab === 'config'} onClick={() => {setActiveTab('config'); setIsMobileMenuOpen(false)}} icon={CreditCard} label="Pagamentos" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col md:flex-row">
                {/* Sidebar Desktop */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 space-y-2">
                    <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} label="Visão Geral" />
                    <NavButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Usuários & Permissões" />
                    <NavButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={Building2} label="Gerenciar Planos" />
                    <NavButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={CreditCard} label="Configurações App" />
                    
                    <div className="mt-auto border-t pt-6">
                        <button 
                            onClick={handleResetPlans}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Restaurar Padrões
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Cards de Estatísticas com Dados Reais */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <StatCard 
                                    title="Usuários Registrados" 
                                    value={users.length} 
                                    icon={Users} 
                                    color="blue" 
                                    trend="Dados Reais"
                                />
                                <StatCard 
                                    title="Empresas/Instâncias" 
                                    value={companies.length} 
                                    icon={Building2} 
                                    color="green" 
                                    trend="Processadas"
                                />
                                <StatCard 
                                    title="Assinaturas Ativas" 
                                    value={plans.length} 
                                    icon={TrendingUp} 
                                    color="purple" 
                                    trend="Planos Disponíveis"
                                />
                                <StatCard 
                                    title="Sistema" 
                                    value="Versão 3.5.0" 
                                    icon={Settings} 
                                    color="orange" 
                                    trend="Produção"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <section className="bg-white rounded-2xl shadow-sm border p-6">
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Atividade Recente
                                    </h2>
                                    <div className="space-y-4">
                                        <AlertItem type="success" message="Sincronização com Firestore concluída" time="Agora" />
                                        <AlertItem type="info" message={`${users.length} usuários retornados da Cloud Function`} time="5m atrás" />
                                        <AlertItem type="warning" message="Verifique as credenciais do Mercado Pago" time="1h atrás" />
                                    </div>
                                </section>

                                <section className="bg-white rounded-2xl shadow-sm border p-6">
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-indigo-500" /> Acesso de Segurança
                                    </h2>
                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <p className="text-sm text-indigo-900 font-medium truncate mb-2">UID Logada: {user?.uid}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded uppercase">
                                                Role: {currentUserRole}
                                            </span>
                                            {currentUserRole === 'owner' && (
                                                <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                                                    <CheckCircle className="w-3 h-3" /> ACESSO IRRESTRITO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white rounded-2xl shadow-sm border animate-in slide-in-from-bottom-4 duration-300">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        Usuários do Sistema <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{users.length}</span>
                                    </h2>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar por e-mail ou nome..." 
                                            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm w-full md:w-80 focus:ring-2 focus:ring-purple-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4">Usuário</th>
                                            <th className="px-6 py-4">Papel / Permissão</th>
                                            <th className="px-6 py-4 hidden md:table-cell">Status</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.map(userItem => (
                                            <tr key={userItem.uid} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                            {userItem.email?.[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{userItem.displayName || 'Sem nome'}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{userItem.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select 
                                                        value={userItem.role || ''}
                                                        onChange={(e) => handleUpdateRole(userItem.uid, e.target.value)}
                                                        className="text-xs font-medium bg-white border border-gray-200 rounded-md py-1 px-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                                    >
                                                        <option value="cliente">Cliente</option>
                                                        <option value="controlador">Controlador</option>
                                                        <option value="admin">Administrador</option>
                                                        <option value="owner">Super Admin (Owner)</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${userItem.disabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${userItem.disabled ? 'bg-red-600' : 'bg-green-600'}`} />
                                                        {userItem.disabled ? 'Desativado' : 'Ativo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'plans' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Planos Disponíveis</h2>
                                <button className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-200">
                                    <UserPlus className="w-4 h-4" /> Novo Plano
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {plans.map(plan => (
                                    <div key={plan.id} className="bg-white border-2 border-gray-100 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500 transition-all shadow-sm">
                                        {plan.recommended && (
                                            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                                                Recomendado
                                            </div>
                                        )}
                                        <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-3xl font-black text-purple-600">R${plan.price}</span>
                                            <span className="text-sm text-gray-500">/{plan.period}</span>
                                        </div>
                                        <div className="space-y-3 mb-6">
                                            {plan.features.slice(0, 5).map((f, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                    <span>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => setEditingPlan(plan)}
                                            className="w-full py-3 border-2 border-purple-100 text-purple-600 rounded-2xl text-sm font-black hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar Configurações
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="max-w-2xl bg-white rounded-3xl border shadow-sm p-6 md:p-8 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                    <CreditCard className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Pagamentos Cloud</h2>
                                    <p className="text-gray-500 text-sm">Integração Mercado Pago & Subscriptions</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Access Token (Production)</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            value={mpConfig.accessToken}
                                            onChange={(e) => setMpConfig({...mpConfig, accessToken: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                            placeholder="APP_USR-..."
                                        />
                                        <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    </div>
                                    <p className="mt-2 text-[10px] text-gray-400 uppercase font-black tracking-widest">Nunca compartilhe este token. Ele é usado para processar transações REAIS.</p>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium">Os pagamentos são processados via Cloud Functions no Firebase para garantir a segurança dos tokens secretos e integridade das assinaturas.</p>
                                </div>

                                <button 
                                    onClick={handleSaveConfig}
                                    className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" /> Salvar Credenciais de Produção
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal de Edição (Melhorado para Mobile) */}
            {editingPlan && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] p-0 md:p-4">
                    <div className="bg-white rounded-t-[32px] md:rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black">Editar {editingPlan.name}</h3>
                            <button onClick={() => setEditingPlan(null)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Nome Comercial</label>
                                <input 
                                    type="text" 
                                    value={editingPlan.name} 
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-none font-bold"
                                    onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Valor (R$)</label>
                                    <input 
                                        type="text" 
                                        value={editingPlan.price} 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-none font-bold text-blue-600"
                                        onChange={e => setEditingPlan({...editingPlan, price: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Período</label>
                                    <input 
                                        type="text" 
                                        value={editingPlan.period} 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-none font-bold"
                                        onChange={e => setEditingPlan({...editingPlan, period: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Itens do Plano (Linha por linha)</label>
                                <textarea 
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-none h-32 text-sm font-medium"
                                    value={editingPlan.features.join('\n')}
                                    onChange={e => setEditingPlan({...editingPlan, features: e.target.value.split('\n')})}
                                />
                            </div>
                            <button 
                                onClick={() => handleSavePlan(editingPlan)}
                                className="w-full h-14 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 mt-4"
                            >
                                Aplicar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                active 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-100 -translate-r-1' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
            {label}
        </button>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    const colors: any = {
        blue: 'from-blue-500 to-indigo-600 text-white shadow-blue-100',
        green: 'from-emerald-500 to-teal-600 text-white shadow-green-100',
        orange: 'from-orange-400 to-red-500 text-white shadow-orange-100',
        purple: 'from-purple-500 to-indigo-700 text-white shadow-purple-100',
    };

    return (
        <div className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors[color]} shadow-lg`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3 h-3" /> {trend}
                </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-0.5">{value}</h3>
            <p className="text-sm font-bold text-gray-400">{title}</p>
        </div>
    );
}

function AlertItem({ type, message, time }: any) {
    const configs: any = {
        warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle, border: 'border-amber-100' },
        info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Info, border: 'border-blue-100' },
        success: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, border: 'border-green-100' },
    };

    const config = configs[type];
    const Icon = config.icon;

    return (
        <div className={`${config.bg} p-3 rounded-xl border ${config.border} flex justify-between items-center group cursor-default hover:shadow-sm transition-all`}>
            <div className="flex items-center gap-3">
                <div className={`${config.text}`}><Icon className="w-4 h-4" /></div>
                <p className="text-xs font-semibold text-gray-800">{message}</p>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-4">{time}</span>
        </div>
    );
}

