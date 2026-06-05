CREATE TABLE IF NOT EXISTS monomers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  mass REAL NOT NULL CHECK (mass > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO monomers (id, name, mass) VALUES
  ('gly', 'Gly', 57.02146),
  ('ala', 'Ala', 71.03711),
  ('ser', 'Ser', 87.03203),
  ('val', 'Val', 99.06841),
  ('phe', 'Phe', 147.06841);
