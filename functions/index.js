const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
const appInstance = admin.initializeApp();
// Access the named database 'safeprag'
const db = getFirestore(appInstance, 'safeprag');

const app = express();

// Configuração do CORS
app.use(cors({ origin: true }));

// Configuração do Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook;

// Health Check
app.get('/admin/health', async (req, res) => {
    const status = {
        auth: 'unknown',
        firestore: 'unknown',
        timestamp: new Date().toISOString()
    };

    try {
        // Test Auth
        await admin.auth().listUsers(1);
        status.auth = 'ok';
    } catch (e) {
        status.auth = 'error: ' + e.message;
        console.error('Health Check Auth Error:', e);
    }

    try {
        // Test Firestore
        await db.collection('users').limit(1).get();
        status.firestore = 'ok';
    } catch (e) {
        status.firestore = 'error: ' + e.message;
        console.error('Health Check Firestore Error:', e);
    }

    res.json(status);
});

// Middleware para verificar token e papel admin
async function requireAdmin(req, res, next) {
    try {
        console.log('[Auth] Verificando autorização para:', req.method, req.path);
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

        if (!token) {
            console.warn('[Auth] Token ausente');
            return res.status(401).json({ error: 'Token ausente' });
        }

        const decoded = await admin.auth().verifyIdToken(token);
        const role = decoded.role || decoded.claims?.role;
        const companyId = decoded.companyId || decoded.claims?.companyId;
        const email = (decoded.email || '').toLowerCase();

        console.log(`[Auth] Usuário: ${email}, Role: ${role}, CompanyId: ${companyId}`);

        // Lista de owners hardcoded ou via config
        const ownerListEnv = process.env.OWNER_EMAILS || functions.config().app?.owners || '';
        const ownerEmails = ownerListEnv.split(/[;,\s]+/).map(e => e.trim()).filter(Boolean);
        const isOwner = email === 'juninhomarinho22@gmail.com' || ownerEmails.includes(email);

        if (!isOwner && role !== 'admin') {
            console.warn('[Auth] Acesso negado: não é admin nem owner');
            return res.status(403).json({ error: 'Acesso restrito a administradores' });
        }

        req.user = { ...decoded, role, companyId, isOwner };
        next();
    } catch (e) {
        console.error('[Auth] Falha na verificação do token:', e);
        res.status(401).json({ error: 'Token inválido: ' + e.message });
    }
}

// ===== COMPANIES =====

app.post('/admin/companies', requireAdmin, express.json(), async (req, res) => {
    try {
        if (!req.user.isOwner) {
            return res.status(403).json({ error: 'Apenas super administradores podem criar empresas' });
        }

        const { name, cnpj, phone, address, email } = req.body || {};
        if (!name || !cnpj) {
            return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios' });
        }

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
        res.status(201).json({ id: companyRef.id, ...companyDoc.data() });
    } catch (e) {
        console.error('Erro ao criar empresa:', e);
        res.status(500).json({ error: 'Erro ao criar empresa' });
    }
});

app.get('/admin/companies', requireAdmin, async (req, res) => {
    try {
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
        console.error('Erro ao listar empresas:', e);
        res.status(500).json({ error: 'Erro ao listar empresas' });
    }
});

app.get('/admin/companies/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user.isOwner && req.user.companyId !== id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const companyDoc = await db.collection('companies').doc(id).get();
        if (!companyDoc.exists) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        res.json({ id: companyDoc.id, ...companyDoc.data() });
    } catch (e) {
        console.error('Erro ao obter empresa:', e);
        res.status(500).json({ error: 'Erro ao obter empresa' });
    }
});

app.put('/admin/companies/:id', requireAdmin, express.json(), async (req, res) => {
    try {
        const { id } = req.params;
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
        console.error('Erro ao atualizar empresa:', e);
        res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
});

// ===== USERS =====

app.get('/admin/users', requireAdmin, async (req, res) => {
    try {
        console.log('[Users] Listando usuários. User:', req.user.email, 'IsOwner:', req.user.isOwner);
        console.log('[Users] Query Params:', req.query);

        let companyId = req.user.companyId;
        if (req.user.isOwner && req.query.companyId) {
            companyId = req.query.companyId;
        }

        console.log('[Users] CompanyId final:', companyId);

        if (!companyId && !req.user.isOwner) {
            console.log('[Users] Sem companyId e não é owner, retornando lista vazia');
            return res.json({ users: [] });
        }

        let firestoreUsers = {};

        if (companyId) {
            const usersSnapshot = await db.collection('users')
                .where('companyId', '==', companyId)
                .get();

            usersSnapshot.forEach(doc => {
                firestoreUsers[doc.id] = { id: doc.id, ...doc.data() };
            });
        } else {
            // Se for owner e sem companyId, pega todos do Firestore (cuidado com performance em produção)
            const usersSnapshot = await db.collection('users').limit(100).get();
            usersSnapshot.forEach(doc => {
                firestoreUsers[doc.id] = { id: doc.id, ...doc.data() };
            });
        }

        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const list = await admin.auth().listUsers(limit);

        if (!list || !list.users) {
            console.log('[Users] Nenhuma lista de usuários retornada pelo Auth');
            return res.json({ users: [] });
        }

        const users = list.users
            .filter(u => {
                // Se tiver companyId, filtra. Se não (owner vendo tudo), mostra todos.
                if (companyId) {
                    return u.customClaims?.companyId === companyId;
                }
                return true;
            })
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

        console.log(`[Users] Retornando ${users.length} usuários`);
        res.json({ users });
    } catch (e) {
        console.error('[Users] Erro ao listar usuários:', e);
        res.status(500).json({ error: 'Erro ao listar usuários: ' + e.message });
    }
});

app.post('/admin/users', requireAdmin, express.json(), async (req, res) => {
    try {
        console.log('[CreateUser] Iniciando criação de usuário por:', req.user.email);
        const { email, password, displayName, role, companyId } = req.body || {};
        let adminCompanyId = req.user.companyId;

        if (req.user.isOwner && companyId) {
            adminCompanyId = companyId;
        }

        console.log('[CreateUser] Dados:', { email, displayName, role, adminCompanyId });

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e password são obrigatórios' });
        }

        if (!adminCompanyId) {
            return res.status(400).json({ error: 'Admin não possui empresa associada.' });
        }

        const roleValue = role || 'cliente';

        console.log('[CreateUser] Criando no Auth...');
        const userRecord = await admin.auth().createUser({ email, password, displayName });
        console.log('[CreateUser] Usuário criado no Auth:', userRecord.uid);

        console.log('[CreateUser] Definindo Claims...');
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: roleValue,
            companyId: adminCompanyId
        });

        console.log('[CreateUser] Salvando no Firestore...');
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            name: displayName || '',
            role: roleValue,
            companyId: adminCompanyId,
            active: true,
            created_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp()
        });

        console.log('[CreateUser] Sucesso!');
        res.status(201).json({ uid: userRecord.uid, email: userRecord.email, role: roleValue });
    } catch (e) {
        console.error('Erro ao criar usuário:', e);
        if (e.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário: ' + e.message });
    }
});

app.post('/admin/users/:uid/role', requireAdmin, express.json(), async (req, res) => {
    try {
        const { uid } = req.params;
        const { role } = req.body;

        if (!['admin', 'controlador', 'cliente'].includes(role)) {
            return res.status(400).json({ error: 'Papel inválido' });
        }

        // Verificar se o usuário alvo pertence à mesma empresa (se quem pede não for owner)
        const userRecord = await admin.auth().getUser(uid);
        const targetCompanyId = userRecord.customClaims?.companyId;

        if (!req.user.isOwner) {
            if (targetCompanyId !== req.user.companyId) {
                return res.status(403).json({ error: 'Não é possível alterar usuários de outra empresa' });
            }
        }

        // Preservar companyId e atualizar role
        const currentClaims = userRecord.customClaims || {};
        await admin.auth().setCustomUserClaims(uid, {
            ...currentClaims,
            role
        });

        // Atualizar no Firestore também
        await db.collection('users').doc(uid).set({
            role,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`[Users] Role atualizada para ${role} no usuário ${uid} por ${req.user.email}`);
        res.json({ success: true });
    } catch (e) {
        console.error('Erro ao atualizar papel:', e);
        res.status(500).json({ error: 'Erro ao atualizar papel: ' + e.message });
    }
});

exports.api = functions.https.onRequest(app);
