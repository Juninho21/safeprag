# Remoção da Coluna use_logo_on_login

Este documento contém instruções para remover a coluna `use_logo_on_login` da tabela `company` no Supabase.

## Problema

A coluna `use_logo_on_login` foi adicionada à tabela `company` com o comando:
```sql
ALTER TABLE public.company ADD COLUMN use_logo_on_login BOOLEAN DEFAULT FALSE;
```

E agora precisa ser removida.

## Soluções Disponíveis

### Opção 1: Executar no Supabase SQL Editor (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Navegue até o seu projeto
3. Vá para **SQL Editor**
4. Execute o script: `scripts/remove_use_logo_on_login_simple.sql`

### Opção 2: Usar o Script Node.js

1. Configure a variável de ambiente:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"
   ```

2. Execute o script:
   ```bash
   node scripts/remove_use_logo_on_login.js
   ```

### Opção 3: Executar Manualmente

Execute diretamente no SQL Editor do Supabase:

```sql
-- Verificar se a coluna existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'company' 
AND column_name = 'use_logo_on_login';

-- Remover a coluna se existir
ALTER TABLE public.company DROP COLUMN IF EXISTS use_logo_on_login;
```

## Verificação

Após executar a remoção, você pode verificar se a coluna foi removida com:

```sql
-- Verificar a estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'company' 
ORDER BY ordinal_position;
```

## Arquivos Criados

- `supabase/remove_use_logo_on_login.sql` - Migração completa
- `scripts/remove_use_logo_on_login.js` - Script Node.js
- `scripts/remove_use_logo_on_login_simple.sql` - Script SQL simples
- `REMOCAO_USE_LOGO_ON_LOGIN.md` - Este arquivo de instruções

## Notas

- A remoção é segura pois não há referências a essa coluna no código TypeScript
- O comando `DROP COLUMN IF EXISTS` garante que não haverá erro se a coluna não existir
- Após a remoção, a tabela `company` voltará ao estado anterior 