import React from 'react';
import { Check, Loader2, Copy } from 'lucide-react';
import { plansService, Plan } from '../../services/plansService';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

interface PlanProps {
    name: string;
    price: string;
    period: string;
    features: string[];
    recommended?: boolean;
    color: 'blue' | 'purple' | 'cyan';
    isCurrent?: boolean;
    onSubscribe: () => void;
}

const PlanCard: React.FC<PlanProps> = ({ name, price, period, features, recommended, color, isCurrent, onSubscribe }) => {
    const colorClasses = {
        blue: {
            header: 'bg-gradient-to-br from-blue-400 to-blue-600',
            button: 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700',
            text: 'text-blue-600',
            icon: 'text-blue-500'
        },
        purple: {
            header: 'bg-gradient-to-br from-purple-500 to-indigo-600',
            button: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
            text: 'text-purple-600',
            icon: 'text-purple-500'
        },
        cyan: {
            header: 'bg-gradient-to-br from-cyan-400 to-blue-500',
            button: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600',
            text: 'text-cyan-600',
            icon: 'text-cyan-500'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className={`relative flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden transition-transform duration-300 ${recommended ? 'transform scale-105 hover:scale-110 z-10 ring-4 ring-purple-200' : 'hover:scale-105'} ${isCurrent ? 'ring-4 ring-green-500' : ''}`}>
            {recommended && !isCurrent && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-3 py-1 rounded-bl-lg text-white shadow-sm z-20">
                    PREMIUM
                </div>
            )}

            {isCurrent && (
                <div className="absolute top-0 right-0 bg-green-500 text-xs font-bold px-3 py-1 rounded-bl-lg text-white shadow-sm z-20">
                    ATIVO
                </div>
            )}

            <div className={`${colors.header} pt-6 px-6 pb-12 text-white text-center relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>

                <h3 className="text-xl font-bold uppercase tracking-wider mb-2 relative z-10">{name}</h3>
                <div className="flex justify-center items-baseline relative z-10">
                    <span className="text-sm font-medium opacity-80 mr-1">R$</span>
                    <span className="text-5xl font-extrabold">{price}</span>
                </div>
                <p className="text-sm opacity-90 mt-2 relative z-10">{period}</p>

                {/* Curved bottom decoration */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-white" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }}></div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-4 mb-8 flex-1">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5`}>
                                <Check className={`w-3 h-3 ${colors.icon}`} strokeWidth={3} />
                            </div>
                            <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={onSubscribe}
                    disabled={isCurrent}
                    className={`w-full py-3 px-6 rounded-full text-white font-bold shadow-lg transform transition-all duration-200 
                        ${isCurrent
                            ? 'bg-green-500 cursor-default shadow-none'
                            : `${colors.button} hover:shadow-xl active:scale-95`
                        }`}
                >
                    {isCurrent ? 'PLANO ATUAL' : 'ASSINAR AGORA'}
                </button>
            </div>
        </div>
    );
};

export const SubscriptionPlans: React.FC = () => {
    const { user, subscription } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    // Polling para verificar status do pagamento
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (paymentData && paymentData.status !== 'approved') {
            const checkStatus = async () => {
                try {
                    const statusData = await plansService.checkPaymentStatus(paymentData.id);

                    if (statusData.status === 'approved') {
                        setPaymentData((prev: any) => ({ ...prev, status: 'approved' }));
                        // Aqui você pode adicionar lógica extra, como atualizar o status do usuário no contexto
                    }
                } catch (error) {
                    console.error('Erro ao verificar status:', error);
                }
            };

            // Verificar imediatamente e depois a cada 5 segundos
            checkStatus();
            intervalId = setInterval(checkStatus, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [paymentData]);

    const loadPlans = async () => {
        try {
            const fetchedPlans = await plansService.getPlans();
            setPlans(fetchedPlans);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan: Plan) => {
        if (!user?.email) {
            alert('Você precisa estar logado para assinar.');
            return;
        }

        try {
            setProcessing(true);
            const response = await plansService.createPixPayment(plan, user.email);
            setPaymentData(response);
        } catch (error: any) {
            alert('Erro ao criar pagamento: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="py-8 px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Escolha o Plano Ideal</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Desbloqueie todo o potencial do Safeprag com nossos planos flexíveis.
                </p>
            </div>

            {subscription?.status === 'active' && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 mb-8 max-w-6xl mx-auto rounded-lg shadow-sm flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                        <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold">Assinatura Ativa</p>
                        <p className="text-sm">
                            Sua assinatura é válida até {subscription.endDate?.toDate ? subscription.endDate.toDate().toLocaleDateString() : 'data desconhecida'}.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                {plans.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        name={plan.name}
                        price={plan.price}
                        period={plan.period}
                        color={plan.color}
                        recommended={plan.recommended}
                        features={plan.features}
                        isCurrent={subscription?.planId === plan.id && subscription?.status === 'active'}
                        onSubscribe={() => handleSubscribe(plan)}
                    />
                ))}
            </div>

            {/* Payment Modal */}
            {paymentData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative flex flex-col items-center">

                        {/* Header with Plan Info */}
                        <div className="w-full bg-green-50 rounded-lg p-4 mb-6 text-center">
                            <h3 className="text-green-800 font-bold text-lg uppercase">{paymentData.description || 'Assinatura Safeprag'}</h3>
                            <p className="text-green-600 font-semibold text-xl">R$ {paymentData.transaction_amount?.toFixed(2).replace('.', ',')}</p>
                        </div>

                        {/* Success Message if Approved */}
                        {paymentData.status === 'approved' ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h3>
                                <p className="text-gray-600 text-center mb-6">Sua assinatura foi ativada com sucesso.</p>
                                <button
                                    onClick={() => setPaymentData(null)}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
                                >
                                    Fechar e Atualizar
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* QR Code */}
                                <div className="border border-gray-200 rounded-xl p-2 mb-6 shadow-sm">
                                    {paymentData.point_of_interaction?.transaction_data?.qr_code_base64 ? (
                                        <img
                                            src={`data:image/png;base64,${paymentData.point_of_interaction.transaction_data.qr_code_base64}`}
                                            alt="QR Code PIX"
                                            className="w-48 h-48 object-contain"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                                            QR Code Indisponível
                                        </div>
                                    )}
                                </div>

                                {/* Pix Copia e Cola */}
                                <div className="w-full mb-6">
                                    <label className="block text-center text-sm text-gray-600 mb-2">Pix Copia e Cola</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={paymentData.point_of_interaction?.transaction_data?.qr_code || ''}
                                            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(paymentData.point_of_interaction?.transaction_data?.qr_code)}
                                            className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                                            title="Copiar código"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2 mb-8">
                                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-600 font-medium text-sm">Aguardando confirmação do pagamento...</span>
                                </div>

                                {/* Back Button */}
                                <button
                                    onClick={() => setPaymentData(null)}
                                    className="w-full py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Voltar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {processing && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="font-medium">Gerando pagamento...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
