import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// Uso: node server/tools/set_price_id_for_product.mjs <PRODUCT_ID> [unit_amount_centavos] [currency] [interval]
// Ex.: node server/tools/set_price_id_for_product.mjs prod_ABC123 9900 brl month

const ENV_PATH = path.resolve(process.cwd(), 'server', '.env');
dotenv.config({ path: ENV_PATH });

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error('STRIPE_SECRET_KEY ausente em server/.env');
  process.exit(1);
}

const [productId, unitAmountArg, currencyArg, intervalArg] = process.argv.slice(2);
if (!productId) {
  console.error('Informe o PRODUCT_ID. Ex.: node server/tools/set_price_id_for_product.mjs prod_XXX');
  process.exit(1);
}

const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

async function run() {
  try {
    // Verifica se já existe algum preço recorrente para o produto
    const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 });
    let chosenPrice = prices.data.find(p => p.recurring);

    if (chosenPrice) {
      console.log('Preço recorrente existente encontrado:', chosenPrice.id);
    } else {
      const unit_amount = Number(unitAmountArg || 9900); // padrão R$ 99,00
      const currency = (currencyArg || 'brl').toLowerCase();
      const interval = (intervalArg || 'month').toLowerCase();

      console.log(`Criando preço: product=${productId}, amount=${unit_amount}, currency=${currency}, interval=${interval}`);
      chosenPrice = await stripe.prices.create({
        product: productId,
        currency,
        unit_amount,
        recurring: { interval },
      });
      console.log('Preço criado:', chosenPrice.id);
    }

    // Atualiza/insere STRIPE_PRICE_ID em server/.env
    let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
    const lines = envContent.split(/\r?\n/);
    let found = false;
    const updated = lines.map((line) => {
      if (line.startsWith('STRIPE_PRICE_ID=')) {
        found = true;
        return `STRIPE_PRICE_ID=${chosenPrice.id}`;
      }
      return line;
    });
    if (!found) {
      updated.push(`STRIPE_PRICE_ID=${chosenPrice.id}`);
    }
    fs.writeFileSync(ENV_PATH, updated.join('\n'));
    console.log('Atualizado server/.env com STRIPE_PRICE_ID =', chosenPrice.id);
  } catch (e) {
    console.error('Falha ao definir preço para o produto:', e?.message || e);
    process.exit(1);
  }
}

run();