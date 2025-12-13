import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RequireSubscriptionProps {
    children: React.ReactNode;
}

export function RequireSubscription({ children }: RequireSubscriptionProps) {
    const { user, loading, role, subscription } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [secondsLeft, setSecondsLeft] = useState(3);

    const isSuperUser = role === 'superuser' || role === 'suporte';
    const hasSubscriptionIssue = subscription && (subscription.status === 'expired' || subscription.status === 'canceled');
    // Permitir acesso à página de assinaturas mesmo com bloqueio
    const isSubscriptionPage = location.pathname === '/configuracoes/assinaturas';
    const shouldBlock = !isSuperUser && hasSubscriptionIssue && !isSubscriptionPage;

    useEffect(() => {
        if (shouldBlock) {
            const timer = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/configuracoes/assinaturas');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [shouldBlock, navigate]);

    if (loading) {
        return <div className="p-6 text-center text-gray-600">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Superusuário e suporte têm acesso total
    if (isSuperUser) {
        return <>{children}</>;
    }

    if (shouldBlock) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Assinatura Necessária</h2>
                    <p className="text-gray-600 mb-6">Sua assinatura expirou ou está inativa. Por favor, renove para continuar acessando o sistema.</p>
                    <p className="text-sm text-blue-600 font-medium animate-pulse">
                        Você será redirecionado para a página de planos em {secondsLeft} segundos...
                    </p>
                </div>
            </div>
        );
    }

    // Se não tiver objeto de assinatura (ex: usuário legado), por enquanto deixo passar
    if (!subscription) {
        console.warn("Acesso permitido sem objeto de assinatura (usuário legado ou erro na criação).");
    }

    return <>{children}</>;
}
