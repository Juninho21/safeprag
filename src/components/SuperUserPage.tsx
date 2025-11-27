import { useEffect, useState } from 'react';
import { Users, Database, Activity, Shield, Settings, CreditCard, Save, Edit2, Loader2 } from 'lucide-react';
import { plansService, Plan, MercadoPagoConfig } from '../services/plansService';
import { useAuth } from '../contexts/AuthContext';

export function SuperUserPage() {
    const { user, role } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>({ accessToken: '' });
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            const [fetchedPlans, fetchedConfig] = await Promise.all([
                plansService.getPlans(),
                plansService.getMercadoPagoConfig()
            ]);
            setPlans(fetchedPlans);
            if (fetchedConfig) {
                setMpConfig(fetchedConfig);
            }
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
            setErrorMsg(`Erro ao salvar config: ${error.message} - ${error.code}`);
            alert('Erro ao salvar configuração.');
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
            setErrorMsg(`Erro ao salvar plano: ${error.message} - ${error.code}`);
            alert('Erro ao salvar plano.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    <p className="text-gray-500">Carregando painel...</p>
                </div>
            </div>
        );
    }

    const handleResetPlans = async () => {
        if (!confirm('Tem certeza? Isso irá restaurar os planos originais e sobrescrever alterações.')) return;
        try {
            setLoading(true);
            await plansService.initializeDefaultPlans();
            const fetchedPlans = await plansService.getPlans();
            setPlans(fetchedPlans);
            alert('Planos restaurados com sucesso!');
        } catch (error: any) {
            console.error(error);
            alert('Erro ao restaurar planos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-auto">
            <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Super Admin</h1>
                        <p className="text-sm text-gray-500">Painel de Controle Geral</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleResetPlans}
                        className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                        Restaurar Planos Padrão
                    </button>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">Jair</p>
                        <p className="text-xs text-gray-500">juninhomarinho22@gmail.com</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        J
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total de Usuários"
                        value="1,234"
                        icon={Users}
                        color="blue"
                        trend="+12% este mês"
                    />
                    <StatCard
                        title="Empresas Ativas"
                        value="56"
                        icon={Database}
                        color="green"
                        trend="+3 novas"
                    />
                    <StatCard
                        title="Atividades Hoje"
                        value="128"
                        icon={Activity}
                        color="orange"
                        trend="Alta demanda"
                    />
                    <StatCard
                        title="Status do Sistema"
                        value="Operacional"
                        icon={Settings}
                        color="purple"
                        trend="Versão 2.1.0"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <ActionButton label="Gerenciar Usuários" color="blue" />
                            <ActionButton label="Configurações Globais" color="gray" />
                            <ActionButton label="Logs do Sistema" color="yellow" />
                            <ActionButton label="Backup Manual" color="green" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas do Sistema</h2>
                        <div className="space-y-4">
                            <AlertItem
                                type="warning"
                                message="Uso de disco acima de 80% no servidor principal"
                                time="2h atrás"
                            />
                            <AlertItem
                                type="info"
                                message="Backup automático realizado com sucesso"
                                time="5h atrás"
                            />
                            <AlertItem
                                type="success"
                                message="Nova versão do sistema implantada"
                                time="1d atrás"
                            />
                        </div>
                    </div>
                </div>

                {/* Debug Info */}
                <div className="mb-6 bg-gray-100 p-4 rounded-lg text-xs font-mono text-gray-600">
                    <p><strong>UID:</strong> {user?.uid}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Role:</strong> {role}</p>
                </div>

                {/* Error Info */}
                {errorMsg && (
                    <div className="mb-6">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Erro: </strong>
                            <span className="block sm:inline">{errorMsg}</span>
                        </div>
                    </div>
                )}

                {/* Seção de Configuração de Pagamento */}
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Configuração de Pagamento (Mercado Pago)</h2>
                    </div>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                            <input
                                type="password"
                                value={mpConfig.accessToken}
                                onChange={(e) => setMpConfig({ ...mpConfig, accessToken: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="APP_USR-..."
                            />
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Salvar Token
                        </button>
                    </div>
                </div>

                {/* Seção de Gerenciamento de Planos */}
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings className="w-6 h-6 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Gerenciar Planos de Assinatura</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="border border-gray-200 rounded-xl p-4 relative">
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => setEditingPlan(plan)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{plan.name}</h3>
                                <p className="text-2xl font-bold text-blue-600 mb-2">R$ {plan.price}</p>
                                <p className="text-sm text-gray-500 mb-4">{plan.period}</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {plan.features.slice(0, 3).map((f, i) => (
                                        <li key={i}>• {f}</li>
                                    ))}
                                    {plan.features.length > 3 && <li>...</li>}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal de Edição de Plano */}
                {editingPlan && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                            <h3 className="text-xl font-bold mb-4">Editar Plano: {editingPlan.name}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <input
                                        type="text"
                                        value={editingPlan.name}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                                        <input
                                            type="text"
                                            value={editingPlan.price}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                                        <input
                                            type="text"
                                            value={editingPlan.period}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, period: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Funcionalidades (uma por linha)</label>
                                    <textarea
                                        value={editingPlan.features.join('\n')}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value.split('\n') })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setEditingPlan(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleSavePlan(editingPlan)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {trend}
                </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
            <p className="text-sm text-gray-500">{title}</p>
        </div>
    );
}

function ActionButton({ label, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
        gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
        yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
        green: 'bg-green-50 text-green-700 hover:bg-green-100',
    };

    return (
        <button className={`p-4 rounded-lg text-sm font-medium transition-colors ${colors[color]}`}>
            {label}
        </button>
    );
}

function AlertItem({ type, message, time }: any) {
    const colors: any = {
        warning: 'border-l-4 border-yellow-400 bg-yellow-50',
        info: 'border-l-4 border-blue-400 bg-blue-50',
        success: 'border-l-4 border-green-400 bg-green-50',
    };

    return (
        <div className={`p-4 rounded-r-lg ${colors[type]} flex justify-between items-start`}>
            <p className="text-sm text-gray-800">{message}</p>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{time}</span>
        </div>
    );
}
