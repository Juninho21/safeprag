import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

const keyPath = path.resolve(process.cwd(), 'server', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore(app, 'safeprag');
const auth = admin.auth();

async function main() {
    const cnpj = '85.228.603/0001-93';
    const email = 'juninhomarinho24@gmail.com';

    console.log(`1. Verificando se a empresa ${cnpj} já existe...`);
    const snapshot = await db.collection('companies').where('cnpj', '==', cnpj).get();

    let companyId;

    if (!snapshot.empty) {
        companyId = snapshot.docs[0].id;
        console.log(`✅ Empresa encontrada: ${companyId} - ${snapshot.docs[0].data().name}`);
    } else {
        console.log('⚠️ Empresa não encontrada. Criando nova...');
        const res = await db.collection('companies').add({
            name: 'Sulpest Controle de Pragas', // Nome inferido
            cnpj: cnpj,
            email: 'contato@sulpest.com.br',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        companyId = res.id;
        console.log(`✅ Empresa criada com ID: ${companyId}`);
    }

    console.log(`2. Buscando usuário ${email}...`);
    try {
        const user = await auth.getUserByEmail(email);
        console.log(`✅ Usuário encontrado: ${user.uid}`);

        console.log('3. Atualizando Custom Claims...');
        const currentClaims = user.customClaims || {};
        await auth.setCustomUserClaims(user.uid, {
            ...currentClaims,
            companyId: companyId,
            role: 'admin' // Garante que é admin também, conforme pedido anterior
        });

        console.log('4. Atualizando Firestore do Usuário...');
        await db.collection('users').doc(user.uid).set({
            companyId: companyId,
            role: 'admin',
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('🎉 Sucesso! Usuário associado à empresa.');
        console.log('ℹ️ O usuário deve fazer logout e login novamente.');

    } catch (e) {
        console.error('❌ Erro ao processar usuário:', e.message);
    }
}

main().catch(console.error);
