-- Script para limpar dados de teste da tabela company
-- Execute este script no Supabase SQL Editor

-- Verificar dados existentes
SELECT * FROM company;

-- Remover dados de teste
DELETE FROM company 
WHERE name ILIKE '%teste%' 
   OR name ILIKE '%debug%' 
   OR email ILIKE '%teste%' 
   OR cnpj = '12.345.678/0001-90';

-- Inserir dados reais da Sulpest
INSERT INTO company (
  id, 
  name, 
  cnpj, 
  phone, 
  email, 
  address, 
  logo_url, 
  environmental_license_number, 
  environmental_license_validity, 
  sanitary_permit_number, 
  sanitary_permit_validity, 
  created_at, 
  updated_at
) VALUES (
  1,
  'Sulpest',
  '26.719.065/0001-85',
  '54991284396',
  'contato@sulpest.com.br',
  'Rua Dr. Mario Brum, 657',
  '',
  'LO 01012/2025',
  '2025-12-31',
  '',
  '',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cnpj = EXCLUDED.cnpj,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  environmental_license_number = EXCLUDED.environmental_license_number,
  environmental_license_validity = EXCLUDED.environmental_license_validity,
  sanitary_permit_number = EXCLUDED.sanitary_permit_number,
  sanitary_permit_validity = EXCLUDED.sanitary_permit_validity,
  updated_at = CURRENT_TIMESTAMP;

-- Verificar dados finais
SELECT * FROM company; 