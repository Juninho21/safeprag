# Correção do Problema de Upload do Logo

## Problema Identificado
O erro HTTP 400 e o erro de parsing JSON indicam que há um problema com as configurações do Supabase Storage ou com as políticas de acesso.

## Passos para Resolver

### 1. Verificar e Configurar o Bucket de Storage

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Verificar se o bucket 'company' existe**
   - Vá para **Storage** no menu lateral
   - Verifique se existe um bucket chamado `company`
   - Se não existir, crie-o:
     - Clique em **"New bucket"**
     - Nome: `company`
     - Marque **"Public bucket"** (para permitir acesso público aos logos)

### 2. Configurar Políticas de Storage

Execute o script SQL `scripts/check_storage_policies.sql` no **SQL Editor** do Supabase Dashboard:

```sql
-- Verificar se o bucket 'company' existe
SELECT name, public FROM storage.buckets WHERE name = 'company';

-- Se não existir, criar o bucket (descomente a linha abaixo)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('company', 'company', true);

-- Criar políticas para permitir upload e acesso aos logos
CREATE POLICY "Allow authenticated users to upload company logos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'company' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
);

CREATE POLICY "Allow public access to company logos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'company' 
    AND (storage.foldername(name))[1] = 'logos'
);

CREATE POLICY "Allow authenticated users to update company logos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'company' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
);

CREATE POLICY "Allow authenticated users to delete company logos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'company' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
);
```

### 3. Testar a Conexão

1. **Abra o Console do Navegador** (F12)
2. **Execute o script de teste** `scripts/test_storage_connection.js`
3. **Verifique os logs** para identificar problemas específicos

### 4. Verificar Variáveis de Ambiente

Certifique-se de que a variável `VITE_SUPABASE_ANON_KEY` está configurada corretamente no arquivo `.env`:

```env
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 5. Possíveis Causas do Erro

#### A. Bucket não existe
- **Sintoma**: Erro "Bucket 'company' não encontrado"
- **Solução**: Criar o bucket no Supabase Dashboard

#### B. Políticas de acesso incorretas
- **Sintoma**: Erro 403 (Forbidden) ou 400 (Bad Request)
- **Solução**: Executar o script SQL de políticas

#### C. Chave de API incorreta
- **Sintoma**: Erro de autenticação
- **Solução**: Verificar a chave anon no arquivo .env

#### D. Problema de CORS
- **Sintoma**: Erro de rede no navegador
- **Solução**: Verificar configurações de CORS no Supabase

### 6. Logs de Debug

O código foi atualizado com logs detalhados. Verifique o console do navegador para:

- ✅ Buckets disponíveis
- ✅ Verificação do bucket 'company'
- ✅ Tentativa de upload
- ❌ Detalhes específicos do erro

### 7. Teste Manual

Após configurar tudo, teste o upload:

1. Vá para a aba **Empresa** no sistema
2. Clique em **"Trocar logo"**
3. Selecione uma imagem (PNG, JPG até 2MB)
4. Verifique se o upload funciona

### 8. Se o Problema Persistir

1. **Verifique os logs** no console do navegador
2. **Teste com uma imagem menor** (menos de 1MB)
3. **Verifique o formato** da imagem (PNG ou JPG)
4. **Limpe o cache** do navegador
5. **Teste em modo incógnito**

## Contato

Se o problema persistir após seguir todos os passos, forneça:
- Logs completos do console
- Screenshot do erro
- Informações sobre o arquivo que está tentando fazer upload 