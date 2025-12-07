const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // User might not have this, but let's try default init

// If no service account, try default (works if logged in via firebase-tools)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'safeprag-0825'
        });
    } catch (e) {
        console.log("Default init failed, trying no-args");
        admin.initializeApp();
    }
}

const db = admin.firestore();

async function listCompanies() {
    console.log('Listing companies...');
    const snapshot = await db.collection('companies').get();
    if (snapshot.empty) {
        console.log('No companies found.');
        return;
    }
    snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
    });
}

listCompanies().catch(console.error);
