-- Parte 1: Añadir el valor al ENUM
ALTER TYPE estado_partido_enum ADD VALUE IF NOT EXISTS 'entre_tiempo' AFTER 'en_juego';
