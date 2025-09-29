-- =====================================================
-- REVERSÃO DAS MODIFICAÇÕES DO SUPABASE - 20/06
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. READICIONAR a coluna use_logo_on_login
ALTER TABLE public.company 
ADD COLUMN IF NOT EXISTS use_logo_on_login BOOLEAN DEFAULT FALSE;

-- 2. REMOVER as colunas separadas de licenças
ALTER TABLE public.company 
DROP COLUMN IF EXISTS environmental_license_number;

ALTER TABLE public.company 
DROP COLUMN IF EXISTS environmental_license_validity;

ALTER TABLE public.company 
DROP COLUMN IF EXISTS sanitary_permit_number;

ALTER TABLE public.company 
DROP COLUMN IF EXISTS sanitary_permit_validity;

-- 3. VERIFICAR o resultado
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'company' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. CONFIRMAR que use_logo_on_login existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'company' 
            AND column_name = 'use_logo_on_login'
        ) THEN '✅ Coluna use_logo_on_login foi readicionada'
        ELSE '❌ Coluna use_logo_on_login NÃO foi readicionada'
    END as status_use_logo_on_login;

-- 5. CONFIRMAR que colunas separadas foram removidas
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'company' 
            AND column_name IN (
                'environmental_license_number',
                'environmental_license_validity', 
                'sanitary_permit_number',
                'sanitary_permit_validity'
            )
        ) THEN '✅ Colunas separadas de licenças foram removidas'
        ELSE '❌ Colunas separadas de licenças ainda existem'
    END as status_colunas_licencas;

-- =====================================================
-- FIM DO SCRIPT DE REVERSÃO
-- ===================================================== 