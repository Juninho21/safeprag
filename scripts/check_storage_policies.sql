-- Script para verificar e configurar políticas de storage do Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se o bucket 'company' existe
SELECT name, public FROM storage.buckets WHERE name = 'company';

-- 2. Criar o bucket 'company' se não existir (execute apenas se o bucket não existir)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('company', 'company', true);

-- 3. Verificar políticas existentes para o bucket 'company'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 4. Política para permitir upload de arquivos para usuários autenticados
CREATE POLICY "Allow authenticated users to upload company logos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'company' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
);

-- 5. Política para permitir visualização pública dos logos
CREATE POLICY "Allow public access to company logos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'company' 
    AND (storage.foldername(name))[1] = 'logos'
);

-- 6. Política para permitir atualização de arquivos por usuários autenticados
CREATE POLICY "Allow authenticated users to update company logos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'company' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
);

-- 7. Política para permitir exclusão de arquivos por usuários autenticados
CREATE POLICY "Allow authenticated users to delete company logos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'company' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
);

-- 8. Verificar se as políticas foram criadas corretamente
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%company%'; 