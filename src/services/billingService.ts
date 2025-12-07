import { auth } from '../config/firebase';

// A API Admin por padrão inicia na porta 4000 (veja server/admin-api.mjs).
// Use VITE_ADMIN_API_URL para sobrescrever quando necessário.
const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';

async function getToken(): Promise<string> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return await user.getIdToken();
}

export interface SubscriptionStatus {
  active: boolean;
  status: 'active' | 'past_due' | 'canceled' | 'inactive' | string;
  updatedAt?: string | null;
  customerId?: string;
  priceId?: string;
  productId?: string;
}

export const billingService = {
  // Cache implementation
  _statusCache: {} as Record<string, { data: SubscriptionStatus; timestamp: number }>,
  _CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  async getStatus(companyId: string): Promise<SubscriptionStatus> {
    // Bypass vitalício para proprietário
    const email = auth?.currentUser?.email?.toLowerCase?.() || '';
    const ownerListEnv = (import.meta.env.VITE_OWNER_EMAILS || '') as string;
    const ownerEmails = ownerListEnv
      .split(/[;,\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const isOwner = email === 'juninhomarinho22@gmail.com' || ownerEmails.includes(email);
    if (isOwner) {
      return { active: true, status: 'active', updatedAt: new Date().toISOString(), customerId: 'owner' };
    }

    // Check cache
    const cacheKey = companyId;
    const cached = this._statusCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < this._CACHE_DURATION)) {
      // console.log('Serving billing status from cache');
      return cached.data;
    }

    try {
      const res = await fetch(`${API_BASE}/billing/status/${encodeURIComponent(companyId)}`);
      if (!res.ok) throw new Error(`Falha ao obter status da assinatura: ${res.status}`);
      const data = await res.json();

      // Update cache
      this._statusCache[cacheKey] = {
        data,
        timestamp: Date.now()
      };

      return data;
    } catch (error) {
      console.warn('Billing check failed, falling back to active (offline/dev mode):', error);
      // Fallback para permitir uso quando offline ou sem backend acessível (comum no Android dev)
      return { active: true, status: 'active_fallback', updatedAt: new Date().toISOString() };
    }
  },

  async getPriceInfo(): Promise<{ priceId: string; currency: string; unit_amount: number; recurring?: any; product?: { id: string; name: string; description?: string | null } | null; }> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/billing/price`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        const msg = err?.error || err?.message;
        throw new Error(msg ? `Falha ao obter informações do plano: ${res.status} - ${msg}` : `Falha ao obter informações do plano: ${res.status}`);
      } catch {
        throw new Error(`Falha ao obter informações do plano: ${res.status}`);
      }
    }
    return await res.json();
  },

  async createCheckoutSession(params: { companyId: string; customerEmail?: string; successUrl?: string; cancelUrl?: string; priceId?: string; }): Promise<{ id?: string; url?: string }> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/billing/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        const msg = err?.error || err?.message;
        throw new Error(msg ? `Falha ao criar sessão de checkout: ${res.status} - ${msg}` : `Falha ao criar sessão de checkout: ${res.status}`);
      } catch {
        throw new Error(`Falha ao criar sessão de checkout: ${res.status}`);
      }
    }
    return (await res.json()) as { id?: string; url?: string };
  },

  async getPrices(): Promise<{ data: Array<{ priceId: string; currency: string; unit_amount: number; recurring?: any; product?: { id: string; name: string; description?: string | null } | null; }> }> {
    const res = await fetch(`${API_BASE}/billing/prices`);
    if (!res.ok) {
      try {
        const err = await res.json();
        const msg = err?.error || err?.message;
        throw new Error(msg ? `Falha ao listar planos: ${res.status} - ${msg}` : `Falha ao listar planos: ${res.status}`);
      } catch {
        throw new Error(`Falha ao listar planos: ${res.status}`);
      }
    }
    return await res.json();
  },

  async getPortalUrl(params: { customerId: string; returnUrl?: string; }): Promise<{ url: string }> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/billing/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        const msg = err?.error || err?.message;
        throw new Error(msg ? `Falha ao obter URL do portal: ${res.status} - ${msg}` : `Falha ao obter URL do portal: ${res.status}`);
      } catch {
        throw new Error(`Falha ao obter URL do portal: ${res.status}`);
      }
    }
    return await res.json();
  },

  async getPaymentLink(): Promise<{ url: string }> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/billing/payment-link`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        const msg = err?.error || err?.message;
        throw new Error(msg ? `Falha ao obter Payment Link: ${res.status} - ${msg}` : `Falha ao obter Payment Link: ${res.status}`);
      } catch {
        throw new Error(`Falha ao obter Payment Link: ${res.status}`);
      }
    }
    return await res.json();
  },
};