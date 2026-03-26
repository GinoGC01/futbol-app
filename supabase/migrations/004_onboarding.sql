-- =============================================
-- ENMIENDA 2: Función de onboarding transaccional
-- Crea liga + vincula admin en una sola operación atómica.
-- Se invoca desde el backend via supabaseAdmin.rpc()
-- =============================================

CREATE OR REPLACE FUNCTION onboard_liga(
  p_user_id    UUID,
  p_email      TEXT,
  p_nombre     TEXT,
  p_slug       TEXT,
  p_zona       TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_liga_id UUID;
BEGIN
  -- Validaciones
  IF length(p_nombre) < 3 THEN
    RAISE EXCEPTION 'El nombre de la liga debe tener al menos 3 caracteres';
  END IF;

  IF p_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'El slug solo puede contener letras minúsculas, números y guiones';
  END IF;

  -- Verificar que el usuario no tenga ya una liga asignada
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'El usuario ya tiene una liga asignada';
  END IF;

  -- Verificar slug único
  IF EXISTS (SELECT 1 FROM ligas WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'El slug ya está en uso';
  END IF;

  -- Crear liga
  INSERT INTO ligas (nombre, slug, zona)
  VALUES (p_nombre, p_slug, p_zona)
  RETURNING id INTO v_liga_id;

  -- Vincular admin
  INSERT INTO admin_users (id, liga_id, email)
  VALUES (p_user_id, v_liga_id, p_email);

  -- Crear temporada inicial automáticamente
  INSERT INTO temporadas (liga_id, nombre, activa)
  VALUES (v_liga_id, 'Temporada 1', true);

  RETURN v_liga_id;
END;
$$;
