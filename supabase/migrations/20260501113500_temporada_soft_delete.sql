-- Agregar columna deleted_at para soft delete
ALTER TABLE "temporada"
ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL;

-- Crear un índice para optimizar las queries que excluyen archivados
CREATE INDEX IF NOT EXISTS "idx_temporada_deleted_at" ON "temporada" ("deleted_at");
