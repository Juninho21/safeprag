import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

const keyPath = path.resolve(process.cwd(), 'server', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function checkClaims() {
    const email = 'juninhomarinho24@gmail.com';
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Claims para ${email}:`, user.customClaims);
}

checkClaims().catch(console.error);
