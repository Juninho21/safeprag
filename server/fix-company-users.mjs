import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

const keyPath = path.resolve(process.cwd(), 'server', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore(app, 'safeprag');

async function fixCompanyUsers() {
    const companyId = 'sjSSDiiLHCoPHngqukg8'; // ID da Sulpest
    const userEmail = 'juninhomarinho24@gmail.com';

    console.log(`Buscando usuário ${userEmail}...`);
    const user = await admin.auth().getUserByEmail(userEmail);
    const uid = user.uid;

    console.log(`Adicionando UID ${uid} ao array 'users' da empresa ${companyId}...`);

    await db.collection('companies').doc(companyId).set({
        users: admin.firestore.FieldValue.arrayUnion(uid)
    }, { merge: true });

    console.log('✅ Campo users atualizado com sucesso!');
}

fixCompanyUsers().catch(console.error);
