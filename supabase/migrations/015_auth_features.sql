-- 1. Agregar columna de verificación de email
ALTER TABLE organizador ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 2. Crear tabla para tokens de verificación de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES organizador(id) ON DELETE CASCADE,
  token       VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas (verificación de email)
CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_evt_user  ON email_verification_tokens(user_id);

-- 3. Crear tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES organizador(id) ON DELETE CASCADE,
  token       VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas (recuperación de contraseña)
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user  ON password_reset_tokens(user_id);
