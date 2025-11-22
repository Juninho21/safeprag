import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// Uso:
//   node server/tools/create_payment_link_for_company.mjs <COMPANY_ID_OR_CNPJ> [REDIRECT_URL] [PRICE_ID]
// Exemplo:
//   node server/tools/create_payment_link_for_company.mjs 12345678900000 http://localhost:3004/configuracoes/plano-mensal price_ABC123

const ENV_PATH = path.resolve(process.cwd(), 'server', '.env');
dotenv.config({ path: ENV_PATH });

const secret = process.env.STRIPE_SECRET_KEY;
const defaultPriceId = process.env.STRIPE_PRICE_ID;
if (!secret) {
  console.error('STRIPE_SECRET_KEY ausente em server/.env');
  process.exit(1);
}

const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

function readMapping() {
  const mapPath = path.resolve(process.cwd(), 'server', 'payment-links.json');
  if (!fs.existsSync(mapPath)) return {};
  try {
    const raw = fs.readFileSync(mapPath, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.warn('Falha ao ler payment-links.json:', e?.message || e);
    return {};
  }
}

function writeMapping(obj) {
  const mapPath = path.resolve(process.cwd(), 'server', 'payment-links.json');
  try {
    fs.writeFileSync(mapPath, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn('Falha ao escrever payment-links.json:', e?.message || e);
  }
}

async function run() {
  const [companyIdArg, redirectUrlArg, priceIdArg] = process.argv.slice(2);
  const companyId = (companyIdArg || '').trim();
  const redirectUrl = redirectUrlArg || 'http://localhost:3004/configuracoes/plano-mensal';
  const priceId = priceIdArg || defaultPriceId;

  if (!companyId) {
    console.error('Informe o COMPANY_ID_OR_CNPJ. Ex.: node server/tools/create_payment_link_for_company.mjs 12345678900000');
    process.exit(1);
  }
  if (!priceId) {
    console.error('STRIPE_PRICE_ID ausente. Passe um PRICE_ID como argumento ou configure em server/.env');
    process.exit(1);
  }

  try {
    const pl = await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { companyId },
      allow_promotion_codes: true,
      after_completion: {
        type: 'redirect',
        redirect: { url: redirectUrl },
      },
    });

    console.log('Payment Link criado com sucesso');
    console.log('ID:', pl.id);
    console.log('URL:', pl.url);

    const mapping = readMapping();
    mapping[companyId] = {
      id: pl.id,
      url: pl.url,
      priceId,
      redirectUrl,
      createdAt: new Date().toISOString(),
    };
    writeMapping(mapping);
    console.log('Atualizado server/payment-links.json com o link da empresa', companyId);
  } catch (e) {
    console.error('Falha ao criar Payment Link:', e?.message || e);
    process.exit(1);
  }
}

run();