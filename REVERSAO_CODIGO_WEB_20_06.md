# Reversão do Código Web - Modificações 20/06

## 📋 Resumo das Reversões

Este documento lista todas as modificações revertidas no código web do projeto para remover as alterações do dia 20/06.

## 🔄 Arquivos Modificados

### 1. **`src/components/AdminPage.tsx`**
**Alterações revertidas:**
- ✅ Removido mapeamento de colunas separadas (`environmental_license_number`, `environmental_license_validity`, etc.)
- ✅ Restaurado formato JSONB original para `environmental_license` e `sanitary_permit`
- ✅ Revertida função `handleSave` para usar estrutura JSONB
- ✅ Revertido carregamento de dados para usar formato JSONB

**Linhas modificadas:**
- `handleSave()`: Linhas 320-340
- `loadCompanyData()`: Linhas 145-155

### 2. **`src/services/supabaseDataService.ts`**
**Alterações revertidas:**
- ✅ Removida função `formatDate` desnecessária
- ✅ Revertido `getCompany()` para retornar dados JSONB diretamente
- ✅ Revertido `saveCompany()` para salvar dados JSONB diretamente
- ✅ Removido mapeamento de colunas separadas

**Linhas modificadas:**
- `getCompany()`: Linhas 200-220
- `saveCompany()`: Linhas 240-270

### 3. **`src/services/supabaseService.ts`**
**Alterações revertidas:**
- ✅ Revertido `syncCompany()` para usar formato JSONB
- ✅ Revertido `getCompany()` para retornar dados originais
- ✅ Revertido `migrateCompanyFromLocalStorage()` para formato JSONB

**Linhas modificadas:**
- `syncCompany()`: Linhas 280-300
- `getCompany()`: Linhas 305-315
- `migrateCompanyFromLocalStorage()`: Linhas 320-340

### 4. **`src/services/pdfService.ts`**
**Alterações revertidas:**
- ✅ Revertida interface `CompanyData` para usar nomes JSONB originais
- ✅ Alterado `environmentalLicense` → `environmental_license`
- ✅ Alterado `sanitaryPermit` → `sanitary_permit`
- ✅ Alterado `expiryDate` → `expiry_date`

**Linhas modificadas:**
- Interface `CompanyData`: Linhas 10-25

### 5. **`src/utils/cleanupTestData.ts`**
**Alterações revertidas:**
- ✅ Revertido `insertRealCompanyData()` para usar formato JSONB
- ✅ Removidas colunas separadas de licenças
- ✅ Restaurada estrutura JSONB para dados de teste

**Linhas modificadas:**
- `insertRealCompanyData()`: Linhas 90-110

### 6. **`src/utils/testCompanyData.ts`**
**Alterações revertidas:**
- ✅ Revertido `insertTestCompanyData()` para usar formato JSONB
- ✅ Removidas colunas separadas de licenças
- ✅ Restaurada estrutura JSONB para dados de teste

**Linhas modificadas:**
- `insertTestCompanyData()`: Linhas 60-80

## 🎯 Estrutura Final

Após as reversões, a estrutura de dados da empresa voltou ao formato JSONB original:

```typescript
interface CompanyData {
  id?: number;
  name: string;
  cnpj: string;
  phone?: string;
  address?: string;
  email?: string;
  logo_url?: string;
  document?: string;
  environmental_license?: {
    number?: string;
    date?: string;
  };
  sanitary_permit?: {
    number?: string;
    expiry_date?: string;
  };
  created_at?: string;
  updated_at?: string;
}
```

## ✅ Verificações Realizadas

### Estrutura de Dados:
- ✅ Formato JSONB restaurado para licenças
- ✅ Remoção de colunas separadas
- ✅ Interface TypeScript atualizada

### Funcionalidades:
- ✅ Carregamento de dados da empresa
- ✅ Salvamento de dados da empresa
- ✅ Upload de logo
- ✅ Geração de PDF
- ✅ Dados de teste

### Serviços:
- ✅ `supabaseDataService` revertido
- ✅ `supabaseService` revertido
- ✅ `companyService` mantido (já estava correto)
- ✅ `pdfService` revertido

## 🔧 Comandos de Verificação

Para verificar se as reversões foram bem-sucedidas:

1. **Testar carregamento de dados:**
   ```javascript
   // No console do navegador
   const data = await supabaseDataService.getCompany();
   console.log('Dados da empresa:', data);
   ```

2. **Verificar estrutura:**
   ```javascript
   // Verificar se os campos JSONB estão presentes
   console.log('Licença ambiental:', data.environmental_license);
   console.log('Alvará sanitário:', data.sanitary_permit);
   ```

3. **Testar salvamento:**
   ```javascript
   // Testar salvamento com dados JSONB
   const testData = {
     name: 'Teste',
     environmental_license: { number: '123', date: '2025-12-31' },
     sanitary_permit: { number: '456', expiry_date: '2025-12-31' }
   };
   await supabaseDataService.saveCompany(testData);
   ```

## ⚠️ Importante

- **Execute os scripts SQL** no Supabase antes de testar o código
- **Limpe o cache** do navegador se necessário
- **Teste todas as funcionalidades** relacionadas à empresa
- **Verifique se o PDF** está sendo gerado corretamente

## 📞 Próximos Passos

1. Execute os scripts SQL de reversão no Supabase
2. Teste o carregamento de dados da empresa
3. Teste o salvamento de dados da empresa
4. Teste a geração de PDF
5. Verifique se o logo está sendo carregado corretamente 