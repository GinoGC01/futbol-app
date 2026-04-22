-- 1. Borrar políticas que dependen de auth_id
DROP POLICY IF EXISTS "organizador: solo propio" ON organizador;
DROP POLICY IF EXISTS "organizador: solo propio actualiza" ON organizador;

-- 2. Borrar o actualizar funciones helper que dependan de auth_id
-- Nota: Esta función se usa en casi todas las políticas del sistema. 
-- Al borrarla, es posible que otras políticas den error si intentas usarlas.
-- Como el backend usa service_role (bypass RLS), lo más limpio es desactivar RLS 
-- temporalmente o limpiar las dependencias.
DROP FUNCTION IF EXISTS get_auth_organizador_id() CASCADE;

-- 3. Ahora sí, borrar la columna y el FK
ALTER TABLE organizador DROP CONSTRAINT IF EXISTS organizador_auth_id_fkey;
ALTER TABLE organizador DROP COLUMN IF EXISTS auth_id;

-- 4. Agregar columna para password
ALTER TABLE organizador ADD COLUMN password_hash TEXT;

-- 5. Email único para el login
ALTER TABLE organizador ADD CONSTRAINT organizador_email_unique UNIQUE (email);
