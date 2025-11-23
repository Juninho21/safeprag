import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

const keyPath = path.resolve(process.cwd(), 'server', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

import { getFirestore } from 'firebase-admin/firestore';

const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore(app, 'safeprag');

async function list() {
    console.log('Buscando empresas...');
    const snap = await db.collection('companies').get();
    if (snap.empty) {
        console.log('Nenhuma empresa encontrada.');
    } else {
        snap.forEach(doc => {
            console.log(`ID: ${doc.id} | CNPJ: ${doc.data().cnpj} | Nome: ${doc.data().name}`);
        });
    }
}

list().catch(console.error);
