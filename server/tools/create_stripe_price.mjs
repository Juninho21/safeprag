import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// Carrega server/.env
const ENV_PATH = path.resolve(process.cwd(), 'server', '.env');
dotenv.config({ path: ENV_PATH });

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error('STRIPE_SECRET_KEY ausente em server/.env');
  process.exit(1);
}

const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

async function run() {
  try {
    // Cria produto e preço mensais em BRL
    const product = await stripe.products.create({
      name: 'Safeprag Plano Mensal',
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: 'brl',
      unit_amount: 9900, // R$ 99,00
      recurring: { interval: 'month' },
    });

    console.log('Produto criado:', product.id);
    console.log('Preço criado:', price.id);

    // Atualiza/insere STRIPE_PRICE_ID em server/.env
    let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
    const lines = envContent.split(/\r?\n/);
    let found = false;
    const updated = lines.map((line) => {
      if (line.startsWith('STRIPE_PRICE_ID=')) {
        found = true;
        return `STRIPE_PRICE_ID=${price.id}`;
      }
      return line;
    });
    if (!found) {
      updated.push(`STRIPE_PRICE_ID=${price.id}`);
    }
    fs.writeFileSync(ENV_PATH, updated.join('\n'));
    console.log('Atualizado server/.env com STRIPE_PRICE_ID =', price.id);
  } catch (e) {
    console.error('Falha ao criar produto/preço no Stripe:', e?.message || e);
    process.exit(1);
  }
}

run();