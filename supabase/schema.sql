-- Dropar a tabela config se existir
DROP TABLE IF EXISTS config CASCADE;

-- Criar tabela de configuração
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT config_single_row CHECK (id = 1)
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_config_updated_at') THEN
        CREATE TRIGGER update_config_updated_at
        BEFORE UPDATE ON config
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Inserir registro inicial na tabela config se não existir
INSERT INTO config (id, is_connected, last_sync, created_at, updated_at)
SELECT 1, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM config WHERE id = 1);

-- Dropar a tabela clients se existir
DROP TABLE IF EXISTS clients CASCADE;

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dropar a tabela products se existir
DROP TABLE IF EXISTS products CASCADE;

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  active_ingredient TEXT,
  chemical_group TEXT,
  registration TEXT,
  batch TEXT,
  expiration_date DATE,
  measure TEXT CHECK (measure IN ('ml', 'g')),
  diluent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dropar a tabela service_orders se existir
DROP TABLE IF EXISTS service_orders CASCADE;

-- Criar tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  schedule_id UUID REFERENCES schedules(id),
  status TEXT NOT NULL,
  service_type TEXT NOT NULL,
  target_pest TEXT,
  location TEXT,
  observations TEXT,
  application_method TEXT,
  product_amount DECIMAL(10,2),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dropar a tabela company se existir
DROP TABLE IF EXISTS company CASCADE;

-- Criar tabela da empresa
CREATE TABLE IF NOT EXISTS company (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  email TEXT,
  logo_url TEXT,
  document TEXT,
  environmental_license JSONB,
  sanitary_permit JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_updated_at') THEN
        CREATE TRIGGER update_company_updated_at
        BEFORE UPDATE ON company
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Inserir registro inicial na tabela company se não existir
INSERT INTO company (name, cnpj, phone, address, email, document, environmental_license, sanitary_permit, created_at, updated_at)
SELECT 'Sulpest', '26.719.065/0001/85', '54991284396', 'Rua Dr. Mario Brum, 657', 'contato@sulpest.com.br', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM company);

-- Dropar a tabela schedules se existir
DROP TABLE IF EXISTS schedules CASCADE;

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  client_phone TEXT,
  client_address TEXT,
  service_type TEXT DEFAULT 'Controle de Pragas',
  date DATE NOT NULL,
  time TIME,
  start_time TIME,
  duration TEXT DEFAULT '60',
  technician TEXT DEFAULT 'Técnico',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_schedules_updated_at') THEN
        CREATE TRIGGER update_schedules_updated_at
        BEFORE UPDATE ON schedules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Dropar a tabela service_order_pdfs se existir
DROP TABLE IF EXISTS service_order_pdfs CASCADE;

-- Criar tabela de PDFs das ordens de serviço
CREATE TABLE IF NOT EXISTS service_order_pdfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  pdf_data TEXT NOT NULL,
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_order_pdfs_updated_at') THEN
        CREATE TRIGGER update_service_order_pdfs_updated_at
        BEFORE UPDATE ON service_order_pdfs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Criar função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar o timestamp de atualização
DO $$ 
BEGIN
    -- Config
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_config_updated_at') THEN
        CREATE TRIGGER update_config_updated_at
        BEFORE UPDATE ON config
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Clients
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at
        BEFORE UPDATE ON clients
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Products
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Service Orders
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_orders_updated_at') THEN
        CREATE TRIGGER update_service_orders_updated_at
        BEFORE UPDATE ON service_orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Users
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Company
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_updated_at') THEN
        CREATE TRIGGER update_company_updated_at
        BEFORE UPDATE ON company
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Dropar a tabela system_settings se existir
DROP TABLE IF EXISTS system_settings CASCADE;

-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
        CREATE TRIGGER update_system_settings_updated_at
        BEFORE UPDATE ON system_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Criar bucket para armazenamento de arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company', 'company', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acesso para o bucket
CREATE POLICY "Acesso público para arquivos da empresa"
ON storage.objects FOR SELECT
USING (bucket_id = 'company');

CREATE POLICY "Upload permitido para arquivos da empresa"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company');

-- Dropar a tabela devices se existir
DROP TABLE IF EXISTS devices CASCADE;

-- Criar tabela de dispositivos
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  number INTEGER,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_devices_updated_at') THEN
        CREATE TRIGGER update_devices_updated_at
        BEFORE UPDATE ON devices
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Dropar a tabela signatures se existir
DROP TABLE IF EXISTS signatures CASCADE;

-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID REFERENCES service_orders(id),
  user_id TEXT NOT NULL,
  client_signature TEXT,
  tecnico_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_signatures_updated_at') THEN
        CREATE TRIGGER update_signatures_updated_at
        BEFORE UPDATE ON signatures
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Dropar a tabela users se existir
DROP TABLE IF EXISTS users CASCADE;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  signature_type TEXT,
  tecnico_name TEXT,
  tecnico_crea TEXT,
  tecnico_phone TEXT,
  tecnico_email TEXT,
  signature TEXT,
  tecnico_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar trigger para atualizar o timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;