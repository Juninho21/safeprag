-- Migração para adicionar a coluna schedule_id na tabela service_orders
-- Execute este comando no SQL Editor do Supabase

-- Adicionar a coluna schedule_id na tabela service_orders
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES schedules(id);

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_service_orders_schedule_id 
ON service_orders(schedule_id);

-- Criar índice composto para consultas por schedule_id e status
CREATE INDEX IF NOT EXISTS idx_service_orders_schedule_status 
ON service_orders(schedule_id, status);

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
AND column_name = 'schedule_id';