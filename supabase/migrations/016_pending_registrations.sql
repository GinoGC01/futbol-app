-- 1. Crear tabla para registros pendientes
CREATE TABLE IF NOT EXISTS pending_registrations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL,
  password_hash       TEXT NOT NULL,
  nombre_organizador  TEXT NOT NULL,
  telefono            TEXT,
  nombre_liga         TEXT NOT NULL,
  slug                TEXT NOT NULL,
  tipo_futbol         TEXT,
  zona                TEXT,
  token               VARCHAR(64) UNIQUE NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  used                BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_pr_token ON pending_registrations(token);
CREATE INDEX IF NOT EXISTS idx_pr_email ON pending_registrations(email);

-- 2. Eliminar la tabla vieja de tokens de verificación (reemplazada por pending_registrations)
-- NOTA: Esto invalidará verificaciones pendientes de usuarios que ya se registraron pero no verificaron.
-- Dado que estamos limpiando el sistema, se asume aceptable.
DROP TABLE IF EXISTS email_verification_tokens;

-- 3. (Opcional) Limpiar organizadores no verificados que quedaron en el limbo?
-- Por ahora los dejamos, la lógica de grace period los manejará o podrán re-registrarse 
-- una vez que implementemos la lógica que permite re-registro si no hay organizador verificado.
