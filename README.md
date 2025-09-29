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
