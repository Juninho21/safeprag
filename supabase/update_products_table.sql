-- Migração para atualizar a tabela products do Supabase
-- Execute este script no Supabase SQL Editor

-- Primeiro, fazer backup dos dados existentes (opcional)
-- CREATE TABLE products_backup AS SELECT * FROM products;

-- Remover colunas desnecessárias que não são usadas no formulário
DO $$ 
BEGIN
    -- Remover coluna description se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE products DROP COLUMN description;
    END IF;
    
    -- Remover coluna price se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE products DROP COLUMN price;
    END IF;
    
    -- Remover coluna stock se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'stock') THEN
        ALTER TABLE products DROP COLUMN stock;
    END IF;
    
    -- Remover coluna unit se existir (já foi removida do código)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'unit') THEN
        ALTER TABLE products DROP COLUMN unit;
    END IF;
    
    -- Remover coluna concentration se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'concentration') THEN
        ALTER TABLE products DROP COLUMN concentration;
    END IF;
    
    -- Remover coluna application_method se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'application_method') THEN
        ALTER TABLE products DROP COLUMN application_method;
    END IF;
    
    -- Remover coluna manufacturer se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'manufacturer') THEN
        ALTER TABLE products DROP COLUMN manufacturer;
    END IF;
    
    -- Remover coluna registration_number se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'registration_number') THEN
        ALTER TABLE products DROP COLUMN registration_number;
    END IF;
END $$;

-- Atualizar constraints e tipos de dados para corresponder ao formulário
DO $$ 
BEGIN
    -- Garantir que measure aceita apenas 'ml' ou 'g'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'measure') THEN
        -- Remover constraint existente se houver
        ALTER TABLE products DROP CONSTRAINT IF EXISTS products_measure_check;
        -- Adicionar nova constraint
        ALTER TABLE products ADD CONSTRAINT products_measure_check 
            CHECK (measure IN ('ml', 'g'));
    END IF;
END $$;

-- Comentários explicativos para as colunas mantidas
COMMENT ON COLUMN products.id IS 'ID único do produto (UUID)';
COMMENT ON COLUMN products.name IS 'Nome do produto/concentração';
COMMENT ON COLUMN products.active_ingredient IS 'Princípio ativo do produto';
COMMENT ON COLUMN products.chemical_group IS 'Grupo químico do produto';
COMMENT ON COLUMN products.registration IS 'Número de registro do produto';
COMMENT ON COLUMN products.batch IS 'Lote do produto';
COMMENT ON COLUMN products.expiration_date IS 'Data de validade do produto';
COMMENT ON COLUMN products.measure IS 'Unidade de medida (ml ou g)';
COMMENT ON COLUMN products.diluent IS 'Diluente utilizado';
COMMENT ON COLUMN products.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN products.updated_at IS 'Data da última atualização';

-- Atualizar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;