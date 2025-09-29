-- =====================================================
-- REVERSÃO COMPLETA DAS MODIFICAÇÕES DO SUPABASE - 20/06
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- VERIFICAÇÃO INICIAL - Estado atual da tabela
SELECT '=== ESTADO ATUAL DA TABELA COMPANY ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- INÍCIO DA REVERSÃO
-- =====================================================

-- 1. READICIONAR a coluna use_logo_on_login
SELECT '=== READICIONANDO COLUNA use_logo_on_login ===' as info;

ALTER TABLE public.company 
ADD COLUMN IF NOT EXISTS use_logo_on_login BOOLEAN DEFAULT FALSE;

-- 2. REMOVER colunas separadas de licenças (uma por vez para evitar erros)
SELECT '=== REMOVENDO COLUNAS SEPARADAS DE LICENÇAS ===' as info;

-- Remover environmental_license_number
ALTER TABLE public.company 
DROP COLUMN IF EXISTS environmental_license_number;

-- Remover environmental_license_validity  
ALTER TABLE public.company 
DROP COLUMN IF EXISTS environmental_license_validity;

-- Remover sanitary_permit_number
ALTER TABLE public.company 
DROP COLUMN IF EXISTS sanitary_permit_number;

-- Remover sanitary_permit_validity
ALTER TABLE public.company 
DROP COLUMN IF EXISTS sanitary_permit_validity;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT '=== VERIFICAÇÃO FINAL ===' as info;

-- Verificar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'company' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se use_logo_on_login foi readicionada
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'company' 
            AND column_name = 'use_logo_on_login'
        ) THEN '✅ SUCESSO: Coluna use_logo_on_login foi readicionada'
        ELSE '❌ ERRO: Coluna use_logo_on_login NÃO foi readicionada'
    END as status_use_logo_on_login;

-- Verificar se colunas separadas foram removidas
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
        ) THEN '✅ SUCESSO: Colunas separadas de licenças foram removidas'
        ELSE '❌ ERRO: Colunas separadas de licenças ainda existem'
    END as status_colunas_licencas;

-- Verificar dados existentes na tabela
SELECT '=== DADOS EXISTENTES NA TABELA ===' as info;

SELECT 
    id,
    name,
    logo_url,
    use_logo_on_login,
    created_at,
    updated_at
FROM public.company
LIMIT 5;

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT '=== RESUMO DA REVERSÃO ===' as info;

SELECT 
    'Reversão das modificações do dia 20/06' as operacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'company' 
            AND column_name = 'use_logo_on_login'
        ) AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'company' 
            AND column_name IN (
                'environmental_license_number',
                'environmental_license_validity', 
                'sanitary_permit_number',
                'sanitary_permit_validity'
            )
        ) THEN '✅ COMPLETA'
        ELSE '⚠️ PARCIAL'
    END as status_reversao;

-- =====================================================
-- FIM DO SCRIPT DE REVERSÃO
-- ===================================================== 