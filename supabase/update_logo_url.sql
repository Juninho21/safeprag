-- Script para atualizar a URL do logo da empresa Sulpest
-- Execute este comando no SQL Editor do Supabase

UPDATE company
SET 
  logo_url = 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png',
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Sulpest';

-- Verificar se a atualização foi bem-sucedida
SELECT 
  id,
  name,
  logo_url,
  environmental_license_number,
  environmental_license_validity,
  sanitary_permit_number,
  sanitary_permit_validity,
  updated_at
FROM company
WHERE name = 'Sulpest'; 