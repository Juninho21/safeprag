-- Migration para fazer a página de atividade funcionar somente pelo Supabase
-- Este arquivo contém as tabelas necessárias para substituir o localStorage

-- Tabela para armazenar contagens de pragas por dispositivo
DROP TABLE IF EXISTS device_pest_counts CASCADE;

CREATE TABLE IF NOT EXISTS device_pest_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  device_number TEXT NOT NULL,
  pest_name TEXT NOT NULL,
  pest_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_device_pest_counts_service_order ON device_pest_counts(service_order_id);
CREATE INDEX IF NOT EXISTS idx_device_pest_counts_device ON device_pest_counts(device_type, device_number);

-- Tabela para armazenar múltiplos serviços por ordem de serviço
DROP TABLE IF EXISTS service_order_services CASCADE;

CREATE TABLE IF NOT EXISTS service_order_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  target_pest TEXT NOT NULL,
  location TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  product_amount TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_order_services_order ON service_order_services(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_services_current ON service_order_services(service_order_id, is_current);

-- Tabela para armazenar dispositivos salvos por ordem de serviço
DROP TABLE IF EXISTS service_order_devices CASCADE;

CREATE TABLE IF NOT EXISTS service_order_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_status TEXT NOT NULL,
  quantity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_order_devices_order ON service_order_devices(service_order_id);

-- Tabela para armazenar dados de atividade em tempo real
DROP TABLE IF EXISTS service_activity_state CASCADE;

CREATE TABLE IF NOT EXISTS service_activity_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE UNIQUE,
  current_service_id UUID,
  available_pests JSONB DEFAULT '[]',
  available_service_types JSONB DEFAULT '[]',
  show_new_pest_input BOOLEAN DEFAULT false,
  new_pest TEXT,
  show_new_service_input BOOLEAN DEFAULT false,
  new_service TEXT,
  local_start_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_activity_state_order ON service_activity_state(service_order_id);

-- Atualizar tabela service_orders para incluir campos necessários
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS devices JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS pest_counts JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS service_list JSONB DEFAULT '[]';

-- Criar triggers para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas novas tabelas
DO $$ 
BEGIN
    -- Device Pest Counts
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_device_pest_counts_updated_at') THEN
        CREATE TRIGGER update_device_pest_counts_updated_at
        BEFORE UPDATE ON device_pest_counts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Service Order Services
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_order_services_updated_at') THEN
        CREATE TRIGGER update_service_order_services_updated_at
        BEFORE UPDATE ON service_order_services
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Service Order Devices
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_order_devices_updated_at') THEN
        CREATE TRIGGER update_service_order_devices_updated_at
        BEFORE UPDATE ON service_order_devices
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Service Activity State
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_activity_state_updated_at') THEN
        CREATE TRIGGER update_service_activity_state_updated_at
        BEFORE UPDATE ON service_activity_state
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Função para limpar dados de atividade quando uma ordem de serviço é finalizada
CREATE OR REPLACE FUNCTION cleanup_service_activity_on_finish()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para 'completed' ou 'approved', limpar dados de atividade
  IF NEW.status IN ('completed', 'approved') AND OLD.status != NEW.status THEN
    DELETE FROM service_activity_state WHERE service_order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para limpeza automática
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'cleanup_service_activity_trigger') THEN
        CREATE TRIGGER cleanup_service_activity_trigger
        AFTER UPDATE ON service_orders
        FOR EACH ROW
        EXECUTE FUNCTION cleanup_service_activity_on_finish();
    END IF;
END $$;

-- Políticas RLS (Row Level Security) para as novas tabelas
ALTER TABLE device_pest_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_activity_state ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir tudo por enquanto - ajustar conforme necessário)
CREATE POLICY "Enable all operations for device_pest_counts" ON device_pest_counts FOR ALL USING (true);
CREATE POLICY "Enable all operations for service_order_services" ON service_order_services FOR ALL USING (true);
CREATE POLICY "Enable all operations for service_order_devices" ON service_order_devices FOR ALL USING (true);
CREATE POLICY "Enable all operations for service_activity_state" ON service_activity_state FOR ALL USING (true);

-- Comentários para documentação
COMMENT ON TABLE device_pest_counts IS 'Armazena contagens de pragas por dispositivo para cada ordem de serviço';
COMMENT ON TABLE service_order_services IS 'Armazena múltiplos serviços que podem ser executados em uma única ordem de serviço';
COMMENT ON TABLE service_order_devices IS 'Armazena dispositivos salvos para cada ordem de serviço';
COMMENT ON TABLE service_activity_state IS 'Armazena estado da página de atividade em tempo real para cada ordem de serviço ativa';

COMMENT ON COLUMN device_pest_counts.service_order_id IS 'Referência para a ordem de serviço';
COMMENT ON COLUMN device_pest_counts.device_type IS 'Tipo do dispositivo (ex: Armadilha Luminosa)';
COMMENT ON COLUMN device_pest_counts.device_number IS 'Número do dispositivo';
COMMENT ON COLUMN device_pest_counts.pest_name IS 'Nome da praga';
COMMENT ON COLUMN device_pest_counts.pest_count IS 'Quantidade de pragas encontradas';

COMMENT ON COLUMN service_order_services.is_current IS 'Indica se este é o serviço atualmente selecionado na interface';
COMMENT ON COLUMN service_activity_state.current_service_id IS 'ID do serviço atualmente selecionado';
COMMENT ON COLUMN service_activity_state.available_pests IS 'Lista dinâmica de pragas disponíveis';
COMMENT ON COLUMN service_activity_state.available_service_types IS 'Lista dinâmica de tipos de serviço disponíveis';