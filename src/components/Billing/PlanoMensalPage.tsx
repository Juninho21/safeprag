import React, { useEffect, useState } from 'react';
import { billingService, type SubscriptionStatus } from '../../services/billingService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

export const PlanoMensalPage: React.FC = () => {
  const { role, user } = useAuth();
  const company = storageService.getCompany();
  const companyId: string = company?.id?.toString?.() || company?.cnpj || 'default-company';
  const publishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '') as string;
  const pricingTableId = (import.meta.env.VITE_STRIPE_PRICING_TABLE_ID || '') as string;
  const [pricingScriptLoaded, setPricingScriptLoaded] = useState(false);

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Array<{ priceId: string; productId?: string; name: string; description?: string | null; price: string; interval: string; paymentLinkUrl?: string }>>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const s = await billingService.getStatus(companyId);
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar status da assinatura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar script do Stripe Pricing Table se configurado
    if (publishableKey && pricingTableId && !pricingScriptLoaded) {
      const src = 'https://js.stripe.com/v3/pricing-table.js';
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        setPricingScriptLoaded(true);
      } else {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => setPricingScriptLoaded(true);
        s.onerror = () => setPricingScriptLoaded(false);
        document.head.appendChild(s);
      }
    }

    loadStatus();
    (async () => {
      // Se existir VITE_FRONTEND_PLANS, priorizar SEMPRE planos do .env (Opção C)
      try {
        setPlansLoading(true);
        const rawEnv = (import.meta.env.VITE_FRONTEND_PLANS || '') as string;
        if (rawEnv && rawEnv.trim().length > 0) {
          const arr = JSON.parse(rawEnv);
          if (Array.isArray(arr)) {
            const normalizeInterval = (val: any) => {
              const v = String(val || '').toLowerCase().trim();
              const daily = ['day', 'daily', 'dia', 'diário', 'diario'];
              const monthly = ['month', 'monthly', 'mensal', 'mensais'];
              const yearly = ['year', 'yearly', 'anual'];
              if (daily.includes(v)) return 'diário';
              if (monthly.includes(v)) return 'mensal';
              if (yearly.includes(v)) return 'anual';
              return 'mensal';
            };
            const items = arr.slice(0, 3).map((p: any) => ({
              priceId: '',
              productId: p.productId || undefined,
              name: p.name || 'Plano',
              description: p.description || null,
              price: String(p.price || '—'),
              interval: normalizeInterval(p.interval),
              paymentLinkUrl: p.url || p.paymentLinkUrl || undefined,
            }));
            setPlans(items);
            setPlansLoading(false);
            return; // não consulta backend quando .env está configurado
          }
        }
      } catch (e) {
        // Se parsing do .env falhar, segue fluxo normal de backend
      }

      // Buscar múltiplos planos ativos no Stripe (recorrentes)
      try {
        setPlansLoading(true);
        const list = await billingService.getPrices();
        const all = list?.data || [];

        const configuredIdsRaw = (import.meta.env.VITE_STRIPE_PRODUCT_IDS || '') as string;
        const configuredIds = configuredIdsRaw
          .split(/[,,\s]+/)
          .map(s => s.trim())
          .filter(Boolean);

        if (configuredIds.length > 0) {
          const items: Array<{ priceId: string; productId?: string; name: string; description?: string | null; price: string; interval: string }> = [];

          for (let i = 0; i < configuredIds.length && items.length < 3; i++) {
            const pid = configuredIds[i];

            const productPrices = all.filter(p => p?.product?.id === pid && ['month', 'day', 'year'].includes(p?.recurring?.interval || ''));

            const pickByInterval = (interval: 'day' | 'month' | 'year') => {
              const candidates = productPrices.filter(pr => pr?.recurring?.interval === interval);
              return candidates.sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0))[0];
            };

            // Todos os planos têm preço: priorizar mensal; se não houver, usar diário
            const chosen = pickByInterval('month') || pickByInterval('year') || pickByInterval('day');

            if (chosen) {
              const currency = (chosen.currency || 'brl').toUpperCase();
              const amountBRL = (chosen.unit_amount || 0) / 100;
              items.push({
                priceId: chosen.priceId,
                productId: chosen.product?.id,
                name: chosen.product?.name || 'Plano',
                description: chosen.product?.description || null,
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(amountBRL),
                interval: chosen.recurring?.interval === 'day' ? 'diário' : (chosen.recurring?.interval === 'year' ? 'anual' : 'mensal'),
              });
            } else {
              const nameFallback = 'Plano';
              items.push({
                priceId: '',
                productId: pid,
                name: nameFallback,
                description: null,
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0),
                interval: 'mensal',
              });
            }
          }

          setPlans(items.slice(0, 3));
        } else {
          // Sem IDs configurados: deduplicar por produto preferindo mensal; se não houver, diário
          const recurring = all.filter(p => ['month', 'day', 'year'].includes(p?.recurring?.interval || ''));
          const byProduct = new Map<string, typeof recurring[0]>();
          for (const p of recurring) {
            const pid = p.product?.id;
            if (!pid) continue;
            const existing = byProduct.get(pid);
            if (!existing) {
              byProduct.set(pid, p);
              continue;
            }
            const score = (x: any) => (x?.recurring?.interval === 'month' ? 1 : (x?.recurring?.interval === 'year' ? 2 : 3));
            const amount = (x: any) => x?.unit_amount || 0;
            const better = (score(p) < score(existing)) || (score(p) === score(existing) && amount(p) < amount(existing));
            if (better) byProduct.set(pid, p);
          }
          const items = Array.from(byProduct.values()).map(p => {
            const currency = (p.currency || 'brl').toUpperCase();
            const amountBRL = (p.unit_amount || 0) / 100;
            return {
              priceId: p.priceId,
              productId: p.product?.id,
              name: p.product?.name || 'Plano',
              description: p.product?.description || null,
              price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(amountBRL),
              interval: p?.recurring?.interval === 'day' ? 'diário' : (p?.recurring?.interval === 'year' ? 'anual' : 'mensal'),
            };
          });
          setPlans(items.slice(0, 3));
        }
      } catch (e: any) {
        console.warn('Falha ao listar planos:', e?.message || e);
        // Fallback: tentar carregar planos do frontend via variável de ambiente (Payment Links)
        try {
          const raw = (import.meta.env.VITE_FRONTEND_PLANS || '') as string;
          if (raw && raw.trim().length > 0) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const normalizeInterval = (val: any) => {
                const v = String(val || '').toLowerCase().trim();
                const daily = ['day', 'daily', 'dia', 'diário', 'diario'];
                const monthly = ['month', 'monthly', 'mensal', 'mensais'];
                if (daily.includes(v)) return 'diário';
                if (monthly.includes(v)) return 'mensal';
                return 'mensal';
              };
              const items = arr.slice(0, 3).map((p: any) => ({
                priceId: '',
                productId: p.productId || undefined,
                name: p.name || 'Plano',
                description: p.description || null,
                price: String(p.price || '—'),
                interval: normalizeInterval(p.interval),
                paymentLinkUrl: p.url || p.paymentLinkUrl || undefined,
              }));
              setPlans(items);
            }
          } else {
            // Último recurso: mostrar placeholders para não deixar a UI vazia
            setPlans([
              { priceId: '', name: 'Plano Básico', description: null, price: '—', interval: 'mensal' },
              { priceId: '', name: 'Plano Pro', description: null, price: '—', interval: 'mensal' },
              { priceId: '', name: 'Plano Empresarial', description: null, price: '—', interval: 'mensal' },
            ]);
          }
        } catch (e2) {
          console.warn('Fallback de planos no frontend falhou:', e2);
        }
      } finally {
        setPlansLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      loadStatus();
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const handleSubscribe = async (priceId?: string, paymentLinkUrl?: string) => {
    try {
      setLoading(true);
      setError(null);
      // Fallback: se existir Payment Link configurado, redirecionar direto sem backend
      if (!priceId && paymentLinkUrl) {
        window.location.href = paymentLinkUrl;
        return;
      }
      // Validação explícita do companyId para evitar 400 no backend
      const cid = (company?.id?.toString?.() || company?.cnpj || '').trim();
      if (!cid) {
        setError('Dados da empresa ausentes. Cadastre a empresa em Configurações > Empresa.');
        return;
      }
      const { id, url } = await billingService.createCheckoutSession({
        companyId: cid,
        customerEmail: user?.email || undefined,
        successUrl: window.location.origin + '/configuracoes/plano-mensal?checkout=success',
        cancelUrl: window.location.origin + '/configuracoes/plano-mensal?checkout=cancel',
        priceId,
      });
      // Redirecionar diretamente para a URL da sessão (Stripe recomendação atual)
      if (url) {
        window.location.href = url;
        return;
      }
      // Caso raro: se não vier URL, tentar fallback via Payment Link
      if (!url && id) {
        console.warn('Sessão criada sem URL. Tentando fallback para Payment Link. sessionId=', id);
      }
      throw new Error('Sessão de checkout criada sem URL');
    } catch (e: any) {
      // Fallback: tentar Payment Link quando Checkout falhar (ex.: preço não configurado)
      const msg = e?.message || '';
      try {
        const pl = await billingService.getPaymentLink();
        if (pl?.url) {
          window.location.href = pl.url;
          return;
        }
      } catch (e2: any) {
        // mantém erro abaixo
      }
      setError(msg || 'Falha ao iniciar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!status?.customerId) {
        setError('Cliente Stripe não associado. Inicie uma assinatura primeiro.');
        return;
      }
      const { url } = await billingService.getPortalUrl({
        customerId: String(status.customerId),
        returnUrl: window.location.origin + '/configuracoes/plano-mensal',
      });
      window.location.href = url;
    } catch (e: any) {
      setError(e?.message || 'Falha ao abrir portal de cobrança');
    } finally {
      setLoading(false);
    }
  };

  const isActivePlan = (plan: { priceId?: string; productId?: string }) => {
    if (!status?.active) return false;
    if (status?.priceId && plan.priceId && status.priceId === plan.priceId) return true;
    if (status?.productId && plan.productId && status.productId === plan.productId) return true;
    return false;
  };

  const statusPtBr = (val?: string) => {
    const v = String(val || '').toLowerCase();
    if (v === 'active') return 'ativo';
    if (v === 'inactive') return 'inativo';
    if (v === 'past_due') return 'pagamento em atraso';
    if (v === 'canceled') return 'cancelado';
    if (v === 'unpaid') return 'não pago';
    if (v === 'trialing') return 'período de testes';
    if (v === 'paused') return 'pausado';
    if (v === 'incomplete') return 'incompleto';
    if (v === 'incomplete_expired') return 'expirado';
    return v || 'inativo';
  };

  // Após retorno do Stripe (?checkout=success), atualizar status automaticamente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get('checkout') === 'success';
    if (!isSuccess) return;

    let retries = 0;
    const maxRetries = 40; // ~2 minutos (40 * 3s)
    const intervalId = setInterval(async () => {
      try {
        const s = await billingService.getStatus(companyId);
        setStatus(s);
        if (s?.active) {
          clearInterval(intervalId);
        }
      } catch {}
      retries += 1;
      if (retries >= maxRetries) {
        clearInterval(intervalId);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [companyId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold">Planos</h2>

      {/* Stripe Pricing Table embed (modo sem backend) */}
      {publishableKey && pricingTableId && pricingScriptLoaded && (
        <div className="rounded-2xl border border-transparent bg-white shadow-sm p-4">
          {/* Elemento do Stripe é um Web Component */}
          {/* @ts-ignore */}
          <stripe-pricing-table pricing-table-id={pricingTableId} publishable-key={publishableKey}></stripe-pricing-table>
        </div>
      )}

      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {[0,1,2].map(i => (
            <div key={`sk-${i}`} className="flex flex-col h-full rounded-2xl border border-transparent bg-gradient-to-b from-blue-50 via-blue-100 to-indigo-100 shadow-lg p-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="h-6 w-32 bg-white/60 rounded" />
                  <div className="h-4 w-48 bg-white/50 rounded" />
                  <div className="mt-4 h-10 w-40 bg-white/70 rounded" />
                </div>
                {i === 1 && (
                  <span className="ml-2 h-5 w-16 bg-pink-100 rounded-full" />
                )}
              </div>
              <div className="mt-5 pt-4 border-t border-white/60 flex items-center gap-3 text-sm">
                <span className="h-5 w-24 bg-white/60 rounded-full" />
                <span className="h-4 w-28 bg-white/50 rounded" />
              </div>
              <div className="mt-auto">
                <div className="w-full h-12 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200" />
              </div>
            </div>
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {plans.map((p, idx) => (
            <div key={`${p.priceId || p.paymentLinkUrl || p.name}-${idx}`} className={`flex flex-col h-full rounded-2xl border ${isActivePlan(p) ? 'border-blue-400 ring-2 ring-blue-300 shadow-2xl' : 'border-transparent shadow-lg'} bg-gradient-to-b from-blue-50 via-blue-100 to-indigo-100 transition-shadow hover:shadow-xl p-6`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{p.name}</div>
                  {p.description && (
                    <div className="text-sm text-gray-700 mt-1">{p.description}</div>
                  )}
                  <div className="mt-4">
                    <span className="align-baseline text-4xl font-extrabold text-gray-900 mr-1">{p.price}</span>
                    <span className="text-lg font-semibold text-gray-800">/ {p.interval}</span>
                  </div>
                </div>
                {isActivePlan(p) ? (
                  <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">Ativo</span>
                ) : (
                  idx === 1 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">Popular</span>
                  )
                )}
              </div>

              <div className="mt-6 pt-6 mb-4 md:mb-6 border-t border-white/60 flex items-center gap-3 text-sm">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isActivePlan(p) ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}> 
                  Status: {isActivePlan(p) ? statusPtBr(status?.status || 'active') : statusPtBr('inactive')}
                </span>
                {isActivePlan(p) && (
                  <span className="text-xs text-gray-700">Última atualização: {status?.updatedAt ? new Date(String(status.updatedAt)).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : '—'}</span>
                )}
              </div>

              {role === 'admin' && (
                <div className="mt-auto">
                  <Button
                    onClick={() => handleSubscribe(p.priceId, p.paymentLinkUrl)}
                    disabled={loading || isActivePlan(p) || (!p.priceId && !p.paymentLinkUrl)}
                    className={`w-full h-12 rounded-full text-white text-base font-semibold shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 ${(p.priceId || p.paymentLinkUrl) ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}
                  >
                    Assinar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {loading && (<div className="p-3 bg-blue-50 rounded">Carregando...</div>)}
      {error && (<div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>)}

      {/* Avisos removidos; status e ação ficam dentro da caixa do plano */}

      <div className="text-sm text-gray-600">
        - A assinatura é vinculada à empresa: <span className="font-semibold">{company?.name || companyId}</span>
      </div>
    </div>
  );
};

export default PlanoMensalPage;