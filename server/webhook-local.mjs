import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import cors from 'cors'

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') })

const PORT = process.env.PORT || 4242
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const STRIPE_WEBHOOK_SECRET_TEST = process.env.STRIPE_WEBHOOK_SECRET_TEST
const STRIPE_WEBHOOK_SECRET_LIVE = process.env.STRIPE_WEBHOOK_SECRET_LIVE
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID
const STRIPE_MODE = process.env.STRIPE_MODE || ((STRIPE_SECRET_KEY || '').includes('_test_') ? 'test' : 'live')
const WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET || (STRIPE_MODE === 'test' ? STRIPE_WEBHOOK_SECRET_TEST : STRIPE_WEBHOOK_SECRET_LIVE)

const BILLING_STORE_PATH = path.resolve(process.cwd(), 'server', 'billing.json')

function readBillingStore() {
  try {
    if (!fs.existsSync(BILLING_STORE_PATH)) return {}
    const raw = fs.readFileSync(BILLING_STORE_PATH, 'utf-8')
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

function writeBillingStore(obj) {
  try {
    fs.writeFileSync(BILLING_STORE_PATH, JSON.stringify(obj, null, 2))
  } catch {}
}

const app = express()
app.use(cors())
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' }) : null

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!WEBHOOK_SECRET) {
    return res.status(500).send('Webhook secret não configurado')
  }
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = Stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const store = readBillingStore()
  const type = event.type

  if (type === 'checkout.session.completed') {
    const session = event.data.object
    const companyId = session.metadata?.companyId
    let priceId
    let productId
    try {
      if (stripe && session?.id) {
        const full = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items.data.price.product'] })
        const line = Array.isArray(full?.line_items?.data) ? full.line_items.data[0] : null
        const pr = line?.price
        priceId = typeof pr === 'string' ? pr : pr?.id
        productId = pr ? (typeof pr.product === 'string' ? pr.product : pr.product?.id) : undefined
      }
    } catch {}
    if (companyId) {
      const prev = store[companyId] || {}
      const activePriceIds = Array.isArray(prev.activePriceIds) ? prev.activePriceIds : []
      const activeProductIds = Array.isArray(prev.activeProductIds) ? prev.activeProductIds : []
      const add = (arr, id) => { if (id && !arr.includes(id)) arr.push(id) }
      add(activePriceIds, priceId)
      add(activeProductIds, productId)
      store[companyId] = { active: true, status: 'active', updatedAt: new Date().toISOString(), customerId: session.customer, priceId, productId, activePriceIds, activeProductIds }
    }
  } else if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
    const sub = event.data.object
    const companyId = sub.metadata?.companyId || (sub?.latest_invoice?.metadata?.companyId)
    const status = sub.status
    const item = Array.isArray(sub?.items?.data) ? sub.items.data[0] : null
    const pr = item?.price
    const priceId = typeof pr === 'string' ? pr : pr?.id
    const productId = pr ? (typeof pr.product === 'string' ? pr.product : pr.product?.id) : undefined
    if (companyId) {
      const prev = store[companyId] || {}
      const activePriceIds = Array.isArray(prev.activePriceIds) ? prev.activePriceIds : []
      const activeProductIds = Array.isArray(prev.activeProductIds) ? prev.activeProductIds : []
      const add = (arr, id) => { if (id && !arr.includes(id)) arr.push(id) }
      add(activePriceIds, priceId)
      add(activeProductIds, productId)
      store[companyId] = { active: status === 'active', status, updatedAt: new Date().toISOString(), customerId: sub.customer, priceId, productId, activePriceIds, activeProductIds }
    }
  } else if (type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const companyId = sub.metadata?.companyId
    if (companyId) {
      const prev = store[companyId] || {}
      store[companyId] = { active: false, status: 'canceled', updatedAt: new Date().toISOString(), customerId: sub.customer, activePriceIds: prev.activePriceIds || [], activeProductIds: prev.activeProductIds || [] }
    }
  } else if (type === 'invoice.payment_failed') {
    const invoice = event.data.object
    const companyId = invoice.metadata?.companyId
    if (companyId) {
      const prev = store[companyId] || {}
      store[companyId] = { active: false, status: 'past_due', updatedAt: new Date().toISOString(), customerId: invoice.customer, activePriceIds: prev.activePriceIds || [], activeProductIds: prev.activeProductIds || [] }
    }
  } else if (type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    const companyId = invoice.metadata?.companyId
    const customerId = invoice.customer
    const line = Array.isArray(invoice?.lines?.data) ? invoice.lines.data[0] : null
    const pr = line?.price
    const priceId = typeof pr === 'string' ? pr : pr?.id
    const productId = pr ? (typeof pr.product === 'string' ? pr.product : pr.product?.id) : undefined
    if (companyId) {
      const prev = store[companyId] || {}
      const activePriceIds = Array.isArray(prev.activePriceIds) ? prev.activePriceIds : []
      const activeProductIds = Array.isArray(prev.activeProductIds) ? prev.activeProductIds : []
      const add = (arr, id) => { if (id && !arr.includes(id)) arr.push(id) }
      add(activePriceIds, priceId)
      add(activeProductIds, productId)
      store[companyId] = { active: true, status: 'active', updatedAt: new Date().toISOString(), customerId, priceId, productId, activePriceIds, activeProductIds }
    }
  }

  writeBillingStore(store)
  res.json({ received: true })
})

app.get('/billing/status/:companyId', async (req, res) => {
  const { companyId } = req.params
  if (!companyId) return res.status(400).json({ error: 'companyId obrigatório' })
  const store = readBillingStore()
  let status = store[companyId] || { active: false, status: 'inactive', updatedAt: null }
  try {
    if (stripe && status?.active && (!status.priceId || !status.productId) && status.customerId) {
      const subs = await stripe.subscriptions.list({ customer: status.customerId, status: 'all', limit: 5 })
      const activeSub = subs.data.find(s => s.status === 'active') || subs.data[0]
      const item = activeSub ? (Array.isArray(activeSub.items?.data) ? activeSub.items.data[0] : null) : null
      const pr = item?.price
      const priceId = typeof pr === 'string' ? pr : pr?.id
      const productId = pr ? (typeof pr.product === 'string' ? pr.product : pr.product?.id) : undefined
      if (priceId || productId) {
        status = { ...status, priceId, productId }
        store[companyId] = status
        writeBillingStore(store)
      }
    }
  } catch {}
  res.json(status)
})

app.post('/billing/create-checkout-session', express.json(), async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe não configurado' })
    const body = req.body || {}
    let { companyId, customerEmail, successUrl, cancelUrl } = body
    if (!companyId) {
      companyId = body?.cnpj || body?.company?.id || body?.company?.cnpj
    }
    if (!companyId || String(companyId).trim() === '') {
      return res.status(400).json({ error: 'companyId é obrigatório' })
    }
    const priceId = body?.priceId || STRIPE_PRICE_ID
    if (!priceId) return res.status(500).json({ error: 'Preço não configurado' })
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'http://localhost:3001/?checkout=success',
      cancel_url: cancelUrl || 'http://localhost:3001/?checkout=cancel',
      customer_email: customerEmail,
      metadata: { companyId: String(companyId).trim() },
    })
    res.json({ id: session.id, url: session.url })
  } catch (e) {
    res.status(500).json({ error: 'Falha ao criar sessão de checkout' })
  }
})

app.get('/billing/prices', async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe não configurado' })
    const list = await stripe.prices.list({ active: true, limit: 20 })
    const prices = list.data.filter(p => !!p.recurring)
    const result = []
    for (const price of prices) {
      const productId = typeof price.product === 'string' ? price.product : price.product?.id
      const product = productId ? await stripe.products.retrieve(productId) : null
      result.push({
        priceId: price.id,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.recurring || null,
        product: product ? { id: product.id, name: product.name, description: product.description || null } : null,
      })
    }
    res.json({ data: result })
  } catch (e) {
    res.status(500).json({ error: 'Falha ao listar preços' })
  }
})

app.get('/__health', (req, res) => {
  res.json({ ok: true, port: PORT, mode: STRIPE_MODE, webhookSecretConfigured: !!WEBHOOK_SECRET })
})

app.listen(PORT, () => {
  console.log(`Webhook local ouvindo em http://localhost:${PORT}`)
})