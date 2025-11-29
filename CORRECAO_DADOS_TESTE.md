# Correção: Dados de Teste na Aba Empresa

## Problema
A aba empresa está exibindo dados de teste ao invés dos dados reais da empresa Sulpest.

## Solução

### Opção 1: Executar Script SQL (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Navegue até o seu projeto
3. Vá para **SQL Editor**
4. Execute o script: `scripts/cleanup_test_data.sql`

Este script irá:
- Verificar todos os dados existentes na tabela `company`
- Remover dados de teste (que contêm "teste", "debug" ou CNPJ de teste)
- Inserir os dados reais da Sulpest
- Verificar os dados finais

### Opção 2: Executar Manualmente

Execute os seguintes comandos no SQL Editor do Supabase:

```sql
-- 1. Verificar dados existentes
SELECT * FROM company;

-- 2. Remover dados de teste
DELETE FROM company 
WHERE name ILIKE '%teste%' 
   OR name ILIKE '%debug%' 
   OR email ILIKE '%teste%' 
   OR cnpj = '12.345.678/0001-90';

-- 3. Inserir dados reais da Sulpest
INSERT INTO company (
  id, name, cnpj, phone, email, address, logo_url,
  environmental_license_number, environmental_license_validity,
  sanitary_permit_number, sanitary_permit_validity,
  created_at, updated_at
) VALUES (
  1, 'Sulpest', '26.719.065/0001-85', '54991284396',
  'contato@sulpest.com.br', 'Rua Dr. Mario Brum, 657', '',
  'LO 01012/2025', '2025-12-31', '', '',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cnpj = EXCLUDED.cnpj,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  environmental_license_number = EXCLUDED.environmental_license_number,
  environmental_license_validity = EXCLUDED.environmental_license_validity,
  sanitary_permit_number = EXCLUDED.sanitary_permit_number,
  sanitary_permit_validity = EXCLUDED.sanitary_permit_validity,
  updated_at = CURRENT_TIMESTAMP;

-- 4. Verificar resultado
SELECT * FROM company;
```

### Opção 3: Limpar localStorage

Se ainda houver problemas, limpe o localStorage do navegador:

1. Abra o DevTools (F12)
2. Vá para **Application** > **Storage** > **Local Storage**
3. Encontre o domínio do seu app
4. Remova a chave `company` ou `COMPANY`
5. Recarregue a página

## Dados Reais da Sulpest

Após a correção, os dados exibidos devem ser:

- **Nome**: Sulpest
- **CNPJ**: 26.719.065/0001-85
- **Telefone**: 54991284396
- **Email**: contato@sulpest.com.br
- **Endereço**: Rua Dr. Mario Brum, 657
- **Licença Ambiental**: LO 01012/2025 (validade: 31/12/2025)

## Verificação

Após executar a correção:

1. Recarregue a página do admin
2. Vá para a aba "Empresa"
3. Verifique se os dados da Sulpest estão sendo exibidos corretamente
4. Verifique o console do navegador para confirmar que não há erros

## Arquivos Criados

- `scripts/cleanup_test_data.sql` - Script SQL para limpeza
- `src/utils/cleanupTestData.ts` - Funções TypeScript para limpeza
- `CORRECAO_DADOS_TESTE.md` - Este arquivo de instruções 