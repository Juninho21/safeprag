import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarX, ArrowRight } from 'lucide-react';

interface RequireSubscriptionProps {
    children: ReactNode;
}

export function RequireSubscription({ children }: RequireSubscriptionProps) {
    const { subscription, loading, role, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    // Super usuários e suporte têm acesso vitalício - CHECAGEM PRIORITÁRIA
    if (role === 'superuser' || role === 'suporte' || user?.email === 'juninhomarinho22@gmail.com') {
        return children;
    }

    // Se não tiver assinatura, permite acesso (assumindo período de teste ou plano gratuito implícito)
    if (!subscription) {
        return children;
    }

    let isExpired = subscription.status === 'expired' || subscription.status === 'canceled';

    if (!isExpired && subscription.endDate) {
        const now = new Date();
        let endDate: Date | null = null;

        // Handle different date formats (Firestore Timestamp, string, object)
        if (typeof subscription.endDate.toDate === 'function') {
            endDate = subscription.endDate.toDate();
        } else if (subscription.endDate.seconds) {
            endDate = new Date(subscription.endDate.seconds * 1000);
        } else {
            endDate = new Date(subscription.endDate);
        }

        if (endDate && endDate < now) {
            isExpired = true;
        }
    }

    if (isExpired) {
        // Permite acesso à página de assinaturas para renovação (independente do role, o bloqueio de rota cuidará do resto se não for admin)
        const path = location.pathname.replace(/\/$/, '');
        if (path === '/configuracoes/assinaturas') {
            return children;
        }

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarX className="w-10 h-10 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        Assinatura Expirada
                    </h1>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Sua assinatura chegou ao fim. Para continuar aproveitando todos os recursos do sistema e gerenciando sua empresa, renove seu plano agora mesmo.
                    </p>

                    <button
                        onClick={() => navigate('/configuracoes/assinaturas')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                    >
                        Renovar Assinatura
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {role !== 'admin' && (
                        <p className="mt-6 text-sm text-gray-400 bg-gray-50 py-2 px-4 rounded-lg">
                            Nota: Apenas administradores podem realizar a renovação.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return children;
}
