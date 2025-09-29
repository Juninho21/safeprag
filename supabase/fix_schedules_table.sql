-- Migração para corrigir a tabela schedules
-- Adiciona colunas que podem estar faltando

-- Verificar se as colunas existem e adicioná-las se necessário
DO $$ 
BEGIN
    -- Adicionar client_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'client_name') THEN
        ALTER TABLE schedules ADD COLUMN client_name TEXT;
    END IF;
    
    -- Adicionar client_phone se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'client_phone') THEN
        ALTER TABLE schedules ADD COLUMN client_phone TEXT;
    END IF;
    
    -- Adicionar client_address se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'client_address') THEN
        ALTER TABLE schedules ADD COLUMN client_address TEXT;
    END IF;
    
    -- Adicionar service_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'service_type') THEN
        ALTER TABLE schedules ADD COLUMN service_type TEXT DEFAULT 'Controle de Pragas';
    END IF;
    
    -- Adicionar start_time se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'start_time') THEN
        ALTER TABLE schedules ADD COLUMN start_time TIME;
    END IF;
    
    -- Adicionar duration se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'duration') THEN
        ALTER TABLE schedules ADD COLUMN duration TEXT DEFAULT '60';
    END IF;
    
    -- Adicionar technician se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'technician') THEN
        ALTER TABLE schedules ADD COLUMN technician TEXT DEFAULT 'Técnico';
    END IF;
    
    -- Adicionar notes se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'notes') THEN
        ALTER TABLE schedules ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Atualizar registros existentes com dados dos clientes
UPDATE schedules 
SET 
    client_name = clients.name,
    client_phone = clients.phone,
    client_address = CONCAT(clients.address, ', ', clients.city, ' - ', clients.state)
FROM clients 
WHERE schedules.client_id = clients.id 
    AND (schedules.client_name IS NULL OR schedules.client_name = '');

COMMIT;