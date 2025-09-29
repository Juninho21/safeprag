-- Script para remover a coluna use_logo_on_login da tabela company
-- Execute este script diretamente no Supabase SQL Editor

-- Verificar se a coluna existe antes de tentar removê-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'company' 
        AND column_name = 'use_logo_on_login'
    ) THEN
        -- Remover a coluna
        ALTER TABLE public.company DROP COLUMN use_logo_on_login;
        RAISE NOTICE 'Coluna use_logo_on_login removida com sucesso da tabela company';
    ELSE
        RAISE NOTICE 'Coluna use_logo_on_login não existe na tabela company';
    END IF;
END $$;

-- Verificar a estrutura atual da tabela company
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'company' 
ORDER BY ordinal_position; 