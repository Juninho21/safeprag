-- Migração para adicionar campo end_time na tabela schedules
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna end_time se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'end_time') THEN
        ALTER TABLE schedules ADD COLUMN end_time TIME;
    END IF;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN schedules.end_time IS 'Horário de fim do agendamento/serviço';