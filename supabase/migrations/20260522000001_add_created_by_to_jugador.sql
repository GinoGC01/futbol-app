ALTER TABLE jugador ADD COLUMN created_by UUID REFERENCES organizador(id);

CREATE INDEX idx_jugador_created_by ON jugador(created_by);
