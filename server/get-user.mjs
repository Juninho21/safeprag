
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const email = 'juninhomarinho22@gmail.com';

async function getUser() {
    try {
        const user = await admin.auth().getUserByEmail(email);
        console.log('User found:', JSON.stringify(user.toJSON(), null, 2));
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

getUser();
