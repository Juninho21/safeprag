# Instruções para Reversão SQL - Modificações 20/06

## 📋 Arquivos SQL Criados

Foram criados dois scripts SQL para reverter as modificações do Supabase:

1. **`supabase/reversao_simples_20_06.sql`** - Script básico e direto
2. **`supabase/reversao_completa_20_06.sql`** - Script com verificações detalhadas

## 🚀 Como Executar

### Passo 1: Acessar o Supabase
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Escolher o Script

#### Opção A: Script Simples (Recomendado para início)
- Copie todo o conteúdo do arquivo `supabase/reversao_simples_20_06.sql`
- Cole no SQL Editor do Supabase
- Clique em **Run**

#### Opção B: Script Completo (Com verificações)
- Copie todo o conteúdo do arquivo `supabase/reversao_completa_20_06.sql`
- Cole no SQL Editor do Supabase
- Clique em **Run**

## 📊 O que cada script faz:

### Script Simples:
- ✅ Readiciona a coluna `use_logo_on_login`
- ✅ Remove as colunas separadas de licenças
- ✅ Mostra a estrutura final da tabela
- ✅ Confirma se a reversão foi bem-sucedida

### Script Completo:
- ✅ Mostra o estado atual da tabela
- ✅ Executa a reversão passo a passo
- ✅ Verifica cada etapa
- ✅ Mostra dados existentes
- ✅ Fornece um resumo final

## 🔍 Verificações que serão feitas:

### ✅ Sucesso esperado:
- Coluna `use_logo_on_login` readicionada
- Colunas separadas removidas:
  - `environmental_license_number`
  - `environmental_license_validity`
  - `sanitary_permit_number`
  - `sanitary_permit_validity`

### ❌ Problemas possíveis:
- Se alguma coluna não for removida
- Se `use_logo_on_login` não for readicionada
- Se houver erros de permissão

## ⚠️ Importante:

1. **Faça um backup antes** de executar qualquer script
2. **Execute em ambiente de teste** primeiro, se possível
3. **Verifique os resultados** após a execução
4. **Teste a aplicação** para garantir que tudo funciona

## 🛠️ Comandos de Backup (se necessário):

Se precisar fazer backup antes da reversão:

```sql
-- Backup da tabela company
SELECT * FROM public.company;
```

## 📞 Suporte:

Se encontrar problemas:
1. Verifique se tem permissões de administrador no Supabase
2. Confirme que está no projeto correto
3. Verifique se não há transações pendentes

## 🎯 Resultado Esperado:

Após executar o script, a tabela `company` deve ter:
- ✅ Coluna `use_logo_on_login` presente
- ✅ Colunas separadas de licenças removidas
- ✅ Estrutura original restaurada 