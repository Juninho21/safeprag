import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

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

function getArg(name, fallback) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  return arg.split('=')[1];
}

async function main() {
  const email = getArg('email');
  const uidArg = getArg('uid');
  const role = getArg('role', 'admin');

  if (!email && !uidArg) {
    console.error('Uso: node server/set-role.mjs --email="usuario@dominio.com" --role=admin');
    console.error('       ou: node server/set-role.mjs --uid="<uid>" --role=admin');
    process.exit(1);
  }

  const serviceAccount = loadServiceAccount();
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const auth = admin.auth();
  let uid = uidArg;
  try {
    if (!uid) {
      const user = await auth.getUserByEmail(email);
      uid = user.uid;
    }

    await auth.setCustomUserClaims(uid, { role });
    await auth.revokeRefreshTokens(uid);

    console.log(`✅ Papel definido: uid=${uid} role=${role}`);
    console.log('ℹ️ Peça para o usuário sair e entrar novamente (ou espere alguns minutos) para o token atualizar.');
    process.exit(0);
  } catch (e) {
    console.error('Falha ao definir papel:', e?.message || e);
    process.exit(1);
  }
}

main();