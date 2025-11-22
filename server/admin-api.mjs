import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente específicas do backend admin
// Usamos server/.env para não conflitar com o .env do Vite/frontend
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

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

// Inicializa Firebase Admin
const serviceAccount = loadServiceAccount();
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Inicializa Firestore
const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
// Observação: o webhook do Stripe exige corpo 'raw';
// portanto, o parser JSON será adicionado APÓS a definição da rota de webhook.

// Middleware para verificar token e papel admin
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) {
      return res.status(401).json({ error: 'Token ausente' });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    const role = decoded.role || decoded.claims?.role;
    const companyId = decoded.companyId || decoded.claims?.companyId;
    const email = (decoded.email || '').toLowerCase();
    const ownerListEnv = (process.env.OWNER_EMAILS || '').toLowerCase();
    const ownerEmails = ownerListEnv.split(/[;,\s]+/).map(e => e.trim()).filter(Boolean);
    const isOwner = email === 'juninhomarinho22@gmail.com' || ownerEmails.includes(email);
    if (!isOwner && role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    req.user = { ...decoded, role, companyId, isOwner };
    next();
  } catch (e) {
    console.error('Falha na verificação do token:', e?.message || e);
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ===== COMPANIES =====

// Criar empresa (somente super admin / owner)
app.post('/admin/companies', requireAdmin, express.json(), async (req, res) => {
  try {
    // Apenas owners podem criar empresas
    if (!req.user.isOwner) {
      return res.status(403).json({ error: 'Apenas super administradores podem criar empresas' });
    }

    const { name, cnpj, phone, address, email } = req.body || {};
    if (!name || !cnpj) {
      return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios' });
    }

    // Criar documento da empresa no Firestore
    const companyRef = await db.collection('companies').add({
      name,
      cnpj,
      phone: phone || '',
      address: address || '',
      email: email || '',
      logo_url: '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    const companyDoc = await companyRef.get();
    res.status(201).json({
      id: companyRef.id,
      ...companyDoc.data()
    });
  } catch (e) {
    console.error('Erro ao criar empresa:', e?.message || e);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// Listar empresas (somente super admin / owner)
app.get('/admin/companies', requireAdmin, async (req, res) => {
  try {
    // Apenas owners podem listar todas as empresas
    if (!req.user.isOwner) {
      return res.status(403).json({ error: 'Apenas super administradores podem listar empresas' });
    }

    const snapshot = await db.collection('companies').get();
    const companies = [];
    snapshot.forEach(doc => {
      companies.push({ id: doc.id, ...doc.data() });
    });

    res.json({ companies });
  } catch (e) {
    console.error('Erro ao listar empresas:', e?.message || e);
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
});

// Obter dados da própria empresa
app.get('/admin/companies/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Admin só pode ver sua própria empresa (exceto owners)
    if (!req.user.isOwner && req.user.companyId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const companyDoc = await db.collection('companies').doc(id).get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json({ id: companyDoc.id, ...companyDoc.data() });
  } catch (e) {
    console.error('Erro ao obter empresa:', e?.message || e);
    res.status(500).json({ error: 'Erro ao obter empresa' });
  }
});

// Atualizar empresa
app.put('/admin/companies/:id', requireAdmin, express.json(), async (req, res) => {
  try {
    const { id } = req.params;

    // Admin só pode atualizar sua própria empresa (exceto owners)
    if (!req.user.isOwner && req.user.companyId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { name, cnpj, phone, address, email, logo_url } = req.body || {};
    const updateData = {};

    if (name) updateData.name = name;
    if (cnpj) updateData.cnpj = cnpj;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (email !== undefined) updateData.email = email;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('companies').doc(id).update(updateData);

    const updated = await db.collection('companies').doc(id).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (e) {
    console.error('Erro ao atualizar empresa:', e?.message || e);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// ===== USERS =====

// Lista usuários da empresa do admin
app.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    let companyId = req.user.companyId;

    // Se for Owner, permite passar companyId via query param
    if (req.user.isOwner && req.query.companyId) {
      companyId = req.query.companyId;
    }

    // Se não tem companyId, retorna vazio (precisa migrar)
    if (!companyId) {
      return res.json({ users: [] });
    }

    // Buscar usuários do Firestore
    const usersSnapshot = await db.collection('companies').doc(companyId).collection('users').get();
    const firestoreUsers = {};
    usersSnapshot.forEach(doc => {
      firestoreUsers[doc.data().uid] = { id: doc.id, ...doc.data() };
    });

    // Buscar usuários do Firebase Auth e combinar
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const list = await admin.auth().listUsers(limit);

    const users = list.users
      .filter(u => u.customClaims?.companyId === companyId)
      .map(u => {
        const firestoreData = firestoreUsers[u.uid] || {};
        return {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          disabled: u.disabled,
          metadata: u.metadata,
          customClaims: u.customClaims || {},
          role: u.customClaims?.role || 'cliente',
          companyId: u.customClaims?.companyId,
          ...firestoreData
        };
      });

    res.json({ users });
  } catch (e) {
    console.error('Erro ao listar usuários:', e?.message || e);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Criar usuário e definir papel + companyId
app.post('/admin/users', requireAdmin, express.json(), async (req, res) => {
  try {
    const { email, password, displayName, role, companyId } = req.body || {};
    let adminCompanyId = req.user.companyId;

    // Se for Owner, permite passar companyId via body
    if (req.user.isOwner && companyId) {
      adminCompanyId = companyId;
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }

    if (!adminCompanyId) {
      return res.status(400).json({ error: 'Admin não possui empresa associada. Contate o suporte.' });
    }

    const roleValue = role || 'cliente';

    // Criar usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({ email, password, displayName });

    // Setar custom claims com role E companyId
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: roleValue,
      companyId: adminCompanyId
    });

    // Revogar tokens para forçar refresh
    await admin.auth().revokeRefreshTokens(userRecord.uid);

    // Salvar no Firestore
    await db.collection('companies').doc(adminCompanyId).collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: displayName || '',
      role: roleValue,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: roleValue,
      companyId: adminCompanyId
    });
  } catch (e) {
    console.error('Erro ao criar usuário:', e?.message || e);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Atualizar papel do usuário
app.post('/admin/users/:uid/role', requireAdmin, express.json(), async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body || {};
    const adminCompanyId = req.user.companyId;

    if (!role || !['admin', 'controlador', 'cliente'].includes(role)) {
      return res.status(400).json({ error: 'Papel inválido' });
    }

    // Verificar que o usuário pertence à mesma empresa
    const userRecord = await admin.auth().getUser(uid);
    const userCompanyId = userRecord.customClaims?.companyId;

    if (userCompanyId !== adminCompanyId && !req.user.isOwner) {
      return res.status(403).json({ error: 'Usuário não pertence à sua empresa' });
    }

    // Atualizar custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role,
      companyId: userCompanyId
    });
    await admin.auth().revokeRefreshTokens(uid);

    // Atualizar Firestore
    if (userCompanyId) {
      await db.collection('companies').doc(userCompanyId).collection('users').doc(uid).update({
        role,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ uid, role, companyId: userCompanyId });
  } catch (e) {
    console.error('Erro ao atualizar papel:', e?.message || e);
    res.status(500).json({ error: 'Erro ao atualizar papel' });
  }
});

// Excluir usuário
app.delete('/admin/users/:uid', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const adminCompanyId = req.user.companyId;

    // Impedir exclusão do próprio usuário logado
    if (req.user?.uid === uid) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário autenticado' });
    }

    // Verificar que o usuário pertence à mesma empresa
    const userRecord = await admin.auth().getUser(uid);
    const userCompanyId = userRecord.customClaims?.companyId;

    if (userCompanyId !== adminCompanyId && !req.user.isOwner) {
      return res.status(403).json({ error: 'Usuário não pertence à sua empresa' });
    }

    // Deletar do Firebase Auth
    await admin.auth().deleteUser(uid);

    // Deletar do Firestore
    if (userCompanyId) {
      await db.collection('companies').doc(userCompanyId).collection('users').doc(uid).delete();
    }

    res.json({ uid, deleted: true });
  } catch (e) {
    console.error('Erro ao excluir usuário:', e?.message || e);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// ===== Stripe / Assinaturas =====

// Inicializa Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID; // ID do preço do plano mensal
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PAYMENT_LINK_URL = process.env.STRIPE_PAYMENT_LINK_URL;
const STRIPE_PAYMENT_LINK_ID = process.env.STRIPE_PAYMENT_LINK_ID;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' }) : null;

// Arquivo de estado de cobrança
const BILLING_STORE_PATH = path.resolve(process.cwd(), 'server', 'billing.json');
function readBillingStore() {
  try {
    if (!fs.existsSync(BILLING_STORE_PATH)) return {};
    const raw = fs.readFileSync(BILLING_STORE_PATH, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('[Billing] Falha ao ler billing.json:', e);
    return {};
  }
}
function writeBillingStore(obj) {
  try {
    fs.writeFileSync(BILLING_STORE_PATH, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error('[Billing] Falha ao escrever billing.json:', e);
  }
}

// Endpoint público para consultar status por empresa
app.get('/billing/status/:companyId', async (req, res) => {
  const { companyId } = req.params;
  if (!companyId) return res.status(400).json({ error: 'companyId obrigatório' });
  const store = readBillingStore();
  const status = store[companyId] || { active: false, status: 'inactive', updatedAt: null };
  res.json(status);
});

// Informações do plano (produto/preço) — somente admin
app.get('/billing/price', requireAdmin, async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe não configurado' });
    if (!STRIPE_PRICE_ID) return res.status(500).json({ error: 'STRIPE_PRICE_ID não configurado' });

    const price = await stripe.prices.retrieve(STRIPE_PRICE_ID);
    const productId = typeof price.product === 'string' ? price.product : price.product?.id;
    const product = productId ? await stripe.products.retrieve(productId) : null;

    res.json({
      priceId: price.id,
      currency: price.currency,
      unit_amount: price.unit_amount,
      recurring: price.recurring || null,
      product: product ? {
        id: product.id,
        name: product.name,
        description: product.description || null,
      } : null,
    });
  } catch (e) {
    console.error('[Stripe] Erro ao obter informações de preço/produto:', e?.message || e);
    res.status(500).json({ error: 'Falha ao obter informações do plano' });
  }
});

// Lista múltiplos preços/planos ativos (recorrentes) — público
app.get('/billing/prices', async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe não configurado' });
    // Busca até 20 preços ativos; filtra recorrentes (assinatura)
    const list = await stripe.prices.list({ active: true, limit: 20 });
    const prices = list.data.filter(p => !!p.recurring);

    const result = [];
    for (const price of prices) {
      const productId = typeof price.product === 'string' ? price.product : price.product?.id;
      const product = productId ? await stripe.products.retrieve(productId) : null;
      result.push({
        priceId: price.id,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.recurring || null,
        product: product ? {
          id: product.id,
          name: product.name,
          description: product.description || null,
        } : null,
      });
    }

    res.json({ data: result });
  } catch (e) {
    console.error('[Stripe] Erro ao listar preços/produtos:', e?.message || e);
    res.status(500).json({ error: 'Falha ao listar preços' });
  }
});

// Criação de sessão de checkout (público)
app.post('/billing/create-checkout-session', express.json(), async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe não configurado' });

    const body = req.body || {};
    let { companyId, customerEmail, successUrl, cancelUrl } = body;

    // Aceitar aliases para companyId por robustez
    if (!companyId) {
      companyId = body?.cnpj || body?.company?.id || body?.company?.cnpj;
    }

    if (!companyId || String(companyId).trim() === '') {
      console.warn('[Billing] POST /billing/create-checkout-session sem companyId. Body recebido:', body);
      return res.status(400).json({ error: 'companyId é obrigatório' });
    }

    // Permitir seleção de priceId por requisição; fallback para STRIPE_PRICE_ID
    const priceId = body?.priceId || STRIPE_PRICE_ID;
    if (!priceId) return res.status(500).json({ error: 'Preço não configurado' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'http://localhost:3001/?checkout=success',
      cancel_url: cancelUrl || 'http://localhost:3001/?checkout=cancel',
      customer_email: customerEmail,
      metadata: { companyId: String(companyId).trim() },
    });
    res.json({ id: session.id, url: session.url });
  } catch (e) {
    console.error('[Stripe] Erro ao criar sessão de checkout:', e?.message || e);
    res.status(500).json({ error: 'Falha ao criar sessão de checkout' });
  }
});

// Portal do cliente para gerenciar assinatura (somente admin)
app.post('/billing/portal', requireAdmin, async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe não configurado' });
    const { returnUrl, customerId } = req.body || {};
    if (!customerId) return res.status(400).json({ error: 'customerId é obrigatório' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'http://localhost:3001/',
    });
    res.json({ url: portal.url });
  } catch (e) {
    console.error('[Stripe] Erro ao criar sessão do portal:', e?.message || e);
    res.status(500).json({ error: 'Falha ao criar sessão do portal' });
  }
});

// Retornar Payment Link (como alternativa ao Checkout) — somente admin
app.get('/billing/payment-link', requireAdmin, async (req, res) => {
  try {
    if (STRIPE_PAYMENT_LINK_URL) {
      return res.json({ url: STRIPE_PAYMENT_LINK_URL });
    }
    if (STRIPE_PAYMENT_LINK_ID) {
      if (!stripe) return res.status(500).json({ error: 'Stripe não configurado' });
      const pl = await stripe.paymentLinks.retrieve(STRIPE_PAYMENT_LINK_ID);
      return res.json({ url: pl?.url });
    }
    return res.status(404).json({ error: 'Payment Link não configurado' });
  } catch (e) {
    console.error('[Stripe] Erro ao obter Payment Link:', e?.message || e);
    res.status(500).json({ error: 'Falha ao obter Payment Link' });
  }
});

// Webhook do Stripe — precisa corpo raw
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      console.warn('[Stripe] Webhook recebido mas Stripe/webhook secret não configurados');
      return res.status(200).send('ok');
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[Stripe] Falha na verificação do webhook:', err?.message || err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log básico para diagnóstico
    try {
      const type = event?.type;
      const object = event?.data?.object || {};
      const cid = object?.metadata?.companyId || object?.customer || 'n/a';
      console.log(`[Stripe] Evento recebido: ${type} (companyId/customer: ${cid})`);
    } catch { }

    const store = readBillingStore();
    const type = event.type;

    // Atualiza status com base nos eventos relevantes
    if (type === 'checkout.session.completed') {
      const session = event.data.object;
      const companyId = session.metadata?.companyId;
      if (companyId) {
        store[companyId] = { active: true, status: 'active', updatedAt: new Date().toISOString(), customerId: session.customer };
      }
    } else if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
      const sub = event.data.object;
      const companyId = sub.metadata?.companyId || (sub?.latest_invoice?.metadata?.companyId);
      const status = sub.status; // active, past_due, canceled, unpaid
      if (companyId) {
        store[companyId] = { active: status === 'active', status, updatedAt: new Date().toISOString(), customerId: sub.customer };
      }
    } else if (type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const companyId = sub.metadata?.companyId;
      if (companyId) {
        store[companyId] = { active: false, status: 'canceled', updatedAt: new Date().toISOString(), customerId: sub.customer };
      }
    } else if (type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const companyId = invoice.metadata?.companyId;
      if (companyId) {
        store[companyId] = { active: false, status: 'past_due', updatedAt: new Date().toISOString(), customerId: invoice.customer };
      }
    } else if (type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const companyId = invoice.metadata?.companyId;
      const customerId = invoice.customer;
      // Quando o pagamento da fatura é bem-sucedido, marcamos como ativo.
      // Isto cobre fluxos via Payment Link desde que o link tenha metadata.companyId.
      if (companyId) {
        store[companyId] = { active: true, status: 'active', updatedAt: new Date().toISOString(), customerId };
      }
    }

    writeBillingStore(store);
    res.json({ received: true });
  } catch (e) {
    console.error('[Stripe] Erro geral no webhook:', e?.message || e);
    res.status(500).send('Internal error');
  }
});

// Agora adicionamos o parser JSON para as demais rotas
app.use(express.json());

// Demais rotas já estão usando JSON acima

// Rota de saúde/diagnóstico para verificar servidor e rotas ativas
app.get('/__health', (req, res) => {
  try {
    const routes = [];
    const stack = app._router?.stack || [];
    for (const layer of stack) {
      if (layer.route?.path) {
        const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase());
        routes.push(`${methods.join('|')} ${layer.route.path}`);
      }
    }
    res.json({
      ok: true,
      port: PORT,
      stripeConfigured: !!stripe,
      priceIdConfigured: !!STRIPE_PRICE_ID,
      paymentLinkUrlConfigured: !!STRIPE_PAYMENT_LINK_URL,
      paymentLinkIdConfigured: !!STRIPE_PAYMENT_LINK_ID,
      routes,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API ouvindo em http://localhost:${PORT}`);
});