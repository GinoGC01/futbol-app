-- Enum para status del organizador
DO $$ BEGIN
    CREATE TYPE organizer_status_enum AS ENUM ('pending', 'beta', 'subscriber', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar campos al organizador
ALTER TABLE organizador 
  ADD COLUMN IF NOT EXISTS status organizer_status_enum NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS active_leagues_limit INTEGER NOT NULL DEFAULT 1;

-- Índice para queries por status
CREATE INDEX IF NOT EXISTS idx_organizador_status ON organizador(status);

-- Organizadores existentes -> status 'beta' (ya están operando)
UPDATE organizador SET status = 'beta' WHERE email_verified = true;
