import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RequireSubscriptionProps {
    children: ReactNode;
}

export function RequireSubscription({ children }: RequireSubscriptionProps) {
    const { subscription, loading, role } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
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
        // Se for admin, permite acessar a página de assinaturas para renovar
        if (role === 'admin') {
            // Normaliza o path para comparação
            const path = location.pathname.replace(/\/$/, '');

            if (path === '/configuracoes/assinaturas') {
                return children;
            }
            return <Navigate to="/configuracoes/assinaturas" replace />;
        } else {
            // Usuários não-admin são bloqueados
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100 px-4">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Bloqueado</h1>
                        <p className="text-gray-600 mb-6">
                            O plano de assinatura da sua empresa expirou.
                            Por favor, entre em contato com o administrador do sistema para regularizar o acesso.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            );
        }
    }

    return children;
}
