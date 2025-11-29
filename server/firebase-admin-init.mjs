import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

// Prefer credential via env var to avoid committing secrets
// Set FIREBASE_SERVICE_ACCOUNT_JSON to the JSON string of the service account
// Alternatively, place server/serviceAccountKey.json (ignored by git) and it will be used.

function loadServiceAccount() {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (envJson) {
    try {
      return JSON.parse(envJson);
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON inválido. Não foi possível fazer parse do JSON:', e);
      process.exit(1);
    }
  }

  const keyPath = path.resolve(process.cwd(), 'server', 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('Arquivo de credenciais não encontrado.');
    console.error('Defina FIREBASE_SERVICE_ACCOUNT_JSON (JSON) ou crie server/serviceAccountKey.json.');
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(keyPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao ler/parsear server/serviceAccountKey.json:', e);
    process.exit(1);
  }
}

const serviceAccount = loadServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('✅ Firebase Admin inicializado');

// Exemplo rápido de verificação: lista no máximo 1 usuário (não falha se não houver)
async function sanityCheck() {
  try {
    const auth = admin.auth();
    const list = await auth.listUsers(1);
    console.log(`Admin OK. Usuários no projeto: ${list.users.length}`);
  } catch (e) {
    console.warn('Admin inicializado, mas verificação de usuários falhou (pode ser normal):', e.message);
  }
}

sanityCheck().finally(() => process.exit(0));