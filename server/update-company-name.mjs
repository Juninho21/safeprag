import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

const keyPath = path.resolve(process.cwd(), 'server', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore(app, 'safeprag');

async function updateName() {
    const companyId = 'sjSSDiiLHCoPHngqukg8'; // ID criado no passo anterior
    const newName = 'DESINSETIZADORA CAPINZALENSE LTDA';

    console.log(`Atualizando empresa ${companyId} para: ${newName}`);

    await db.collection('companies').doc(companyId).update({
        name: newName,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Nome atualizado com sucesso!');
}

updateName().catch(console.error);
