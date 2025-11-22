import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// Uso:
//   node server/tools/create_webhook_endpoint.mjs [WEBHOOK_URL]
// Exemplo:
//   node server/tools/create_webhook_endpoint.mjs http://localhost:4000/stripe/webhook

const ENV_PATH = path.resolve(process.cwd(), 'server', '.env');
dotenv.config({ path: ENV_PATH });

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error('STRIPE_SECRET_KEY ausente em server/.env');
  process.exit(1);
}

const webhookUrl = process.argv[2] || 'http://localhost:4000/stripe/webhook';
const events = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
];

const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

async function run() {
  try {
    const endpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: events,
    });

    console.log('Webhook endpoint criado:', endpoint.id);
    if (endpoint.secret) {
      console.log('Webhook secret (copiado para server/.env):', endpoint.secret);
    }

    // Atualiza/insere STRIPE_WEBHOOK_SECRET e STRIPE_WEBHOOK_ENDPOINT_ID em server/.env
    let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
    const lines = envContent.split(/\r?\n/);

    const upsert = (key, value) => {
      let found = false;
      const updated = lines.map((line) => {
        if (line.startsWith(key + '=')) {
          found = true;
          return `${key}=${value}`;
        }
        return line;
      });
      if (!found) updated.push(`${key}=${value}`);
      return updated;
    };

    let updatedLines = upsert('STRIPE_WEBHOOK_SECRET', endpoint.secret || '');
    lines.splice(0, lines.length, ...updatedLines);
    updatedLines = upsert('STRIPE_WEBHOOK_ENDPOINT_ID', endpoint.id);

    fs.writeFileSync(ENV_PATH, updatedLines.join('\n'));
    console.log('Atualizado server/.env com STRIPE_WEBHOOK_SECRET e STRIPE_WEBHOOK_ENDPOINT_ID');
  } catch (e) {
    console.error('Falha ao criar webhook endpoint:', e?.message || e);
    process.exit(1);
  }
}

run();