# Instruções de Migração - Correção da Tabela Schedules

## Problema Identificado

O erro `PGRST204: Could not find the 'client_name' column of 'schedules' in the schema cache` indica que a estrutura da tabela `schedules` no Supabase não está sincronizada com o código da aplicação.

## Solução

### 1. Aplicar a Migração SQL

Execute o arquivo `supabase/fix_schedules_table.sql` no seu banco de dados Supabase:

```sql
-- Execute este comando no SQL Editor do Supabase Dashboard
-- Ou use o Supabase CLI:
npx supabase db reset
-- ou
npx supabase migration new fix_schedules_table
-- e copie o conteúdo do arquivo fix_schedules_table.sql
```

### 2. Verificar a Estrutura da Tabela

Após aplicar a migração, verifique se a tabela `schedules` possui todas as colunas necessárias:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'schedules' 
ORDER BY ordinal_position;
```

### 3. Colunas Esperadas

A tabela `schedules` deve ter as seguintes colunas:

- `id` (UUID, PRIMARY KEY)
- `client_id` (UUID, FOREIGN KEY)
- `client_name` (TEXT)
- `client_phone` (TEXT)
- `client_address` (TEXT)
- `service_type` (TEXT, DEFAULT 'Controle de Pragas')
- `date` (DATE, NOT NULL)
- `time` (TIME)
- `start_time` (TIME)
- `duration` (TEXT, DEFAULT '60')
- `technician` (TEXT, DEFAULT 'Técnico')
- `notes` (TEXT)
- `status` (TEXT, DEFAULT 'pending')
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

## Tratamento de Erro Implementado

O código foi atualizado para:

1. **Detectar problemas de estrutura**: Verifica se o erro PGRST204 ocorre
2. **Fallback gracioso**: Usa localStorage quando há problemas com o Supabase
3. **Mensagens informativas**: Notifica o usuário sobre o status da sincronização
4. **Estrutura adaptativa**: Envia apenas campos que existem na tabela

## Como Testar

1. Execute a migração SQL
2. Reinicie a aplicação
3. Tente criar um novo agendamento
4. Verifique se os dados são salvos no Supabase
5. Confirme que não há mais erros PGRST204 no console

## Comandos Úteis

```bash
# Resetar o banco de dados (cuidado: apaga todos os dados)
npx supabase db reset

# Aplicar migrações pendentes
npx supabase db push

# Verificar status das migrações
npx supabase migration list
```

## Backup de Segurança

Antes de aplicar qualquer migração, faça backup dos dados:

```sql
-- Backup da tabela schedules
CREATE TABLE schedules_backup AS SELECT * FROM schedules;
```