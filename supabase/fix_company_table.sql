-- Migração para corrigir a estrutura da tabela company
-- Adicionar campos separados para licenças e permissões

-- Adicionar colunas separadas para licenças ambientais
ALTER TABLE company 
ADD COLUMN IF NOT EXISTS environmental_license_number TEXT,
ADD COLUMN IF NOT EXISTS environmental_license_validity DATE;

-- Adicionar colunas separadas para permissões sanitárias
ALTER TABLE company 
ADD COLUMN IF NOT EXISTS sanitary_permit_number TEXT,
ADD COLUMN IF NOT EXISTS sanitary_permit_validity DATE;

-- Migrar dados existentes do JSONB para os campos separados
UPDATE company 
SET 
  environmental_license_number = COALESCE(
    (environmental_license->>'number')::TEXT, 
    environmental_license_number
  ),
  environmental_license_validity = COALESCE(
    (environmental_license->>'date')::DATE, 
    environmental_license_validity
  ),
  sanitary_permit_number = COALESCE(
    (sanitary_permit->>'number')::TEXT, 
    sanitary_permit_number
  ),
  sanitary_permit_validity = COALESCE(
    (sanitary_permit->>'expiry_date')::DATE, 
    sanitary_permit_validity
  )
WHERE environmental_license IS NOT NULL OR sanitary_permit IS NOT NULL;

-- Comentário sobre a estrutura atual
COMMENT ON TABLE company IS 'Tabela da empresa com campos separados para licenças e permissões';
COMMENT ON COLUMN company.environmental_license_number IS 'Número da licença ambiental';
COMMENT ON COLUMN company.environmental_license_validity IS 'Data de validade da licença ambiental';
COMMENT ON COLUMN company.sanitary_permit_number IS 'Número da permissão sanitária';
COMMENT ON COLUMN company.sanitary_permit_validity IS 'Data de validade da permissão sanitária'; 