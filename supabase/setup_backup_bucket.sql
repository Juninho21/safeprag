-- Criar bucket para armazenamento de backups (público para permitir uploads anônimos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Permitir upload de backups para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir download de backups para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de backups para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de backups para usuários autenticados" ON storage.objects;

-- Para buckets públicos, as políticas podem ser mais simples
-- Permitir todas as operações para qualquer usuário (incluindo anônimos)

-- Política para INSERT (upload) - permitir para todos
CREATE POLICY "Permitir upload de backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'backups');

-- Política para SELECT (download/listagem) - permitir para todos
CREATE POLICY "Permitir download de backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'backups');

-- Política para UPDATE - permitir para todos
CREATE POLICY "Permitir atualização de backups"
ON storage.objects FOR UPDATE
USING (bucket_id = 'backups');

-- Política para DELETE - permitir para todos
CREATE POLICY "Permitir exclusão de backups"
ON storage.objects FOR DELETE
USING (bucket_id = 'backups');