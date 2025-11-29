-- Script para reverter modificações do dia 20/06 no Supabase
-- Este script reverte as alterações feitas na tabela company

-- 1. REVERTER: Adicionar de volta a coluna use_logo_on_login
ALTER TABLE public.company 
ADD COLUMN IF NOT EXISTS use_logo_on_login BOOLEAN DEFAULT FALSE;

-- 2. REVERTER: Remover as colunas separadas de licenças que foram adicionadas
ALTER TABLE public.company 
DROP COLUMN IF EXISTS environmental_license_number,
DROP COLUMN IF EXISTS environmental_license_validity,
DROP COLUMN IF EXISTS sanitary_permit_number,
DROP COLUMN IF EXISTS sanitary_permit_validity;

-- 3. Verificar se a reversão foi bem-sucedida
DO $$
BEGIN
    -- Verificar se use_logo_on_login foi readicionada
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'company' 
        AND column_name = 'use_logo_on_login'
    ) THEN
        RAISE EXCEPTION 'Falha ao readicionar a coluna use_logo_on_login';
    ELSE
        RAISE NOTICE 'Coluna use_logo_on_login readicionada com sucesso';
    END IF;
    
    -- Verificar se as colunas separadas foram removidas
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'company' 
        AND column_name IN ('environmental_license_number', 'environmental_license_validity', 'sanitary_permit_number', 'sanitary_permit_validity')
    ) THEN
        RAISE EXCEPTION 'Falha ao remover as colunas separadas de licenças';
    ELSE
        RAISE NOTICE 'Colunas separadas de licenças removidas com sucesso';
    END IF;
    
    RAISE NOTICE 'Reversão das modificações do dia 20/06 concluída com sucesso!';
END $$; 