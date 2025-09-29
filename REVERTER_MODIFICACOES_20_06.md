# Reverter Modificações do Supabase - 20/06

Este documento contém instruções para reverter as modificações feitas no Supabase no dia 20/06.

## Modificações que serão revertidas:

1. **Readicionar a coluna `use_logo_on_login`** na tabela `company`
2. **Remover as colunas separadas** de licenças ambientais e sanitárias:
   - `environmental_license_number`
   - `environmental_license_validity`
   - `sanitary_permit_number`
   - `sanitary_permit_validity`

## Como executar a reversão:

### Opção 1: Usando o script Node.js (Recomendado)

1. **Configure a variável de ambiente** com sua chave do Supabase:
   ```powershell
   $env:VITE_SUPABASE_ANON_KEY="sua_chave_anon_do_supabase_aqui"
   ```

2. **Execute o script de reversão**:
   ```powershell
   node scripts/revert_supabase_changes.js
   ```

### Opção 2: Executando SQL diretamente no Supabase

1. Acesse o painel do Supabase
2. Vá para a seção "SQL Editor"
3. Execute o conteúdo do arquivo `supabase/revert_changes_20_06.sql`

## Verificação da reversão:

Após executar a reversão, verifique se:

- ✅ A coluna `use_logo_on_login` foi readicionada
- ✅ As colunas separadas de licenças foram removidas
- ✅ A estrutura da tabela `company` voltou ao estado anterior

## Arquivos criados:

- `supabase/revert_changes_20_06.sql` - Script SQL para reversão
- `scripts/revert_supabase_changes.js` - Script Node.js para execução automática
- `REVERTER_MODIFICACOES_20_06.md` - Este arquivo de instruções

## Importante:

⚠️ **Faça um backup antes de executar a reversão** se houver dados importantes que possam ser perdidos.

⚠️ **Teste em ambiente de desenvolvimento** antes de aplicar em produção.

## Comandos de backup (se necessário):

```powershell
$env:VITE_SUPABASE_ANON_KEY="sua_chave_aqui"; node src/scripts/backup.js
```

## Estrutura esperada após a reversão:

A tabela `company` deve ter a estrutura original, sem as colunas separadas de licenças e com a coluna `use_logo_on_login` presente. 