-- Migração para remover a coluna use_logo_on_login da tabela company
-- Reverter a alteração: ALTER TABLE public.company ADD COLUMN use_logo_on_login BOOLEAN DEFAULT FALSE;

-- Remover a coluna use_logo_on_login
ALTER TABLE public.company 
DROP COLUMN IF EXISTS use_logo_on_login;

-- Verificar se a coluna foi removida
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'company' 
        AND column_name = 'use_logo_on_login'
    ) THEN
        RAISE EXCEPTION 'A coluna use_logo_on_login ainda existe na tabela company';
    ELSE
        RAISE NOTICE 'Coluna use_logo_on_login removida com sucesso da tabela company';
    END IF;
END $$; 