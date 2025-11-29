import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export interface Plan {
    id: string;
    name: string;
    price: string;
    period: string;
    features: string[];
    recommended?: boolean;
    color: 'blue' | 'purple' | 'cyan';
}

export interface MercadoPagoConfig {
    accessToken: string;
    publicKey?: string;
}

const PLANS_COLLECTION = 'subscription_plans';
const CONFIG_COLLECTION = 'system_config';
const MP_CONFIG_DOC = 'mercadopago';

export const plansService = {
    // Plans Management
    async getPlans(): Promise<Plan[]> {
        try {
            const querySnapshot = await getDocs(collection(db, PLANS_COLLECTION));
            const plans: Plan[] = [];
            querySnapshot.forEach((doc) => {
                plans.push({ id: doc.id, ...doc.data() } as Plan);
            });

            // If no plans exist, return default plans (and maybe save them?)
            if (plans.length === 0) {
                return defaultPlans;
            }

            // Sort plans by price (approximate logic for now)
            return plans.sort((a, b) => {
                const priceA = parseFloat(a.price.replace(',', '.').replace('.', ''));
                const priceB = parseFloat(b.price.replace(',', '.').replace('.', ''));
                return priceA - priceB;
            });
        } catch (error) {
            console.error('Error fetching plans:', error);
            return defaultPlans;
        }
    },

    async savePlan(plan: Plan): Promise<void> {
        try {
            const planRef = doc(db, PLANS_COLLECTION, plan.id);
            await setDoc(planRef, plan, { merge: true });
        } catch (error) {
            console.error('Error saving plan:', error);
            throw error;
        }
    },

    async initializeDefaultPlans(): Promise<void> {
        for (const plan of defaultPlans) {
            await this.savePlan(plan);
        }
    },

    // Mercado Pago Configuration
    async getMercadoPagoConfig(): Promise<MercadoPagoConfig | null> {
        try {
            const docRef = doc(db, CONFIG_COLLECTION, MP_CONFIG_DOC);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as MercadoPagoConfig;
            }
            return null;
        } catch (error) {
            console.error('Error fetching MP config:', error);
            return null;
        }
    },

    async saveMercadoPagoConfig(config: MercadoPagoConfig): Promise<void> {
        try {
            const docRef = doc(db, CONFIG_COLLECTION, MP_CONFIG_DOC);
            await setDoc(docRef, config, { merge: true });
        } catch (error) {
            console.error('Error saving MP config:', error);
            throw error;
        }
    },

    // Payment Generation (Via Cloud Function)
    async createPixPayment(plan: Plan, email: string): Promise<any> {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');

        const token = await user.getIdToken();
        const price = parseFloat(plan.price.replace('.', '').replace(',', '.'));

        try {
            // URL da Cloud Function (ajuste se necessário para emulador local ou produção)
            const functionUrl = 'https://us-central1-safeprag-0825.cloudfunctions.net/api/create-payment';

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transaction_amount: price,
                    description: `Assinatura ${plan.name}`,
                    payer_email: email,
                    planId: plan.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao criar pagamento');
            }

            return data;
        } catch (error: any) {
            console.error('Error creating PIX payment:', error);
            throw error;
        }
    },
    // Check Payment Status (Via Cloud Function)
    async checkPaymentStatus(paymentId: string): Promise<any> {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');

        const token = await user.getIdToken();

        try {
            const functionUrl = `https://us-central1-safeprag-0825.cloudfunctions.net/api/check-payment/${paymentId}`;

            const response = await fetch(functionUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao verificar status do pagamento');
            }

            return data;
        } catch (error: any) {
            console.error('Error checking payment status:', error);
            throw error;
        }
    }
};

const defaultPlans: Plan[] = [
    {
        id: 'plan_daily',
        name: "Safeprag Diário",
        price: "9,90",
        period: "Por dia",
        color: "cyan",
        features: [
            "Acesso completo ao sistema",
            "Gestão de ordens de serviço",
            "Relatórios básicos",
            "Suporte via email",
            "Ideal para uso pontual"
        ]
    },
    {
        id: 'plan_monthly',
        name: "Safeprag Mensal",
        price: "197,90",
        period: "Por mês",
        color: "purple",
        recommended: true,
        features: [
            "Todas as funcionalidades do Diário",
            "Gestão ilimitada de clientes",
            "Relatórios avançados em PDF",
            "Suporte prioritário WhatsApp",
            "Backup automático diário",
            "Acesso multi-usuário"
        ]
    },
    {
        id: 'plan_annual',
        name: "Safeprag Anual",
        price: "1997,00",
        period: "Por ano",
        color: "blue",
        features: [
            "Economia de 2 meses",
            "Todas as funcionalidades do Mensal",
            "Treinamento exclusivo da equipe",
            "Personalização de documentos",
            "API para integrações",
            "Gerente de conta dedicado"
        ]
    }
];
