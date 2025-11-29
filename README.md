# Sulpest

Sistema de gerenciamento de ordens de serviço para controle de pragas.

## Integração com Supabase

O sistema agora está integrado com o Supabase para armazenamento de dados em nuvem. Para configurar a integração:

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Copie o arquivo `.env.example` para `.env`
4. Preencha as variáveis de ambiente com suas credenciais do Supabase:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do seu projeto Supabase

### Estrutura do Banco de Dados

O Supabase deve ter as seguintes tabelas:

- `config`: Armazena configurações do sistema
- `clients`: Armazena dados dos clientes
- `products`: Armazena dados dos produtos
- `service_orders`: Armazena ordens de serviço
- `users`: Armazena dados dos usuários

### Sincronização de Dados

Para sincronizar os dados do localStorage com o Supabase:

1. Acesse a página de administração
2. Clique na aba "Supabase"
3. Clique em "Testar Conexão" para verificar se a integração está funcionando
4. Clique em "Sincronizar Dados" para transferir os dados do localStorage para o Supabase

Após a sincronização inicial, os dados serão automaticamente salvos no Supabase quando houver alterações no sistema.

## Planos sem backend (Payment Links do Stripe)

Se você não quiser iniciar o servidor Admin API para listar preços do Stripe, é possível exibir os cards de planos usando Payment Links diretamente no frontend.

1. Crie Payment Links para cada plano no Stripe.
2. No arquivo `.env.local`, defina `VITE_FRONTEND_PLANS` com um array JSON (até 3 itens):

```
VITE_FRONTEND_PLANS=[
  {
    "name": "Plano Básico",
    "description": "Ideal para começar",
    "price": "R$ 29,90",
    "interval": "month",
    "url": "https://buy.stripe.com/EXEMPLO_BASICO"
  },
  {
    "name": "Plano Pro",
    "description": "Recursos avançados",
    "price": "R$ 59,90",
    "interval": "month",
    "url": "https://buy.stripe.com/EXEMPLO_PRO"
  }
]
```

Com isso, a página "Configurações > Plano Mensal" mostrará os cards e o botão "Assinar (link)" abrirá diretamente o Payment Link no Stripe. 

Limitações:
- Não é possível consultar produtos/preços do Stripe dinamicamente no navegador (a API requer chave secreta). 
- Sem Admin API, o status de assinatura e o portal de gerenciamento não estarão disponíveis.

## Alternativa: Stripe Pricing Table (sem backend)

Você pode usar o componente oficial de tabela de preços do Stripe diretamente no frontend. Basta criar uma Pricing Table no Stripe Dashboard e definir:

- `VITE_STRIPE_PUBLISHABLE_KEY`: sua Publishable Key (pk_live_... ou pk_test_...)
- `VITE_STRIPE_PRICING_TABLE_ID`: o ID da tabela de preços gerada no Stripe

Com essas variáveis, a tela de "Plano Mensal" renderiza automaticamente o `<stripe-pricing-table>` e os planos ficam clicáveis sem Admin API.

Observação: os produtos/planos exibidos na Pricing Table são configurados no Stripe; não precisam ser cadastrados no código.
## Configuração do Firebase (frontend)

Este projeto lê as credenciais pelo Vite via variáveis `VITE_FIREBASE_*` (arquivo `.env` na raiz). Os campos obrigatórios são:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- (Opcional) `VITE_FIREBASE_MEASUREMENT_ID` para Analytics

Onde obter no Firebase:
- Acesse `Firebase Console > Configurações do projeto > Geral`.
- Em “Seus apps”, selecione o app Web (ou crie um) e copie o snippet de configuração (`firebaseConfig`).
- Mapeie os campos do snippet para as variáveis acima (ex.: `apiKey` → `VITE_FIREBASE_API_KEY`, `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`, etc.).

Após editar o `.env`, reinicie o servidor de desenvolvimento (`npm run dev`) para o Vite recarregar as variáveis.
