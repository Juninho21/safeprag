import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = getFirestore(admin.app(), 'safeprag'); // Target 'safeprag' database

const defaultPlans = [
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

async function seedPlans() {
    console.log('Seeding plans to database: safeprag');
    const batch = db.batch();

    for (const plan of defaultPlans) {
        const ref = db.collection('subscription_plans').doc(plan.id);
        batch.set(ref, plan, { merge: true });
    }

    await batch.commit();
    console.log('Plans seeded successfully!');
}

seedPlans().catch(console.error);
