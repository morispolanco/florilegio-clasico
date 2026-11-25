-- =============================================================================
-- Florilegio Clásico — Esquema inicial y migración idempotente para Neon
-- Ejecuta este script completo en el SQL Editor de tu proyecto en Neon.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de usuarios registrados (autores, ensayistas, investigadores, admin)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'autor'
    CHECK (role IN ('autor', 'investigador', 'editor', 'admin')),
  work_genre_pref VARCHAR(32) NOT NULL DEFAULT 'ensayo'
    CHECK (work_genre_pref IN ('ensayo', 'academico', 'divulgacion', 'discurso')),
  is_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cuenta administradora inicial (mp@ufm.edu)
INSERT INTO users (name, email, password_hash, role, work_genre_pref, is_authorized)
VALUES (
  'Administrador',
  'mp@ufm.edu',
  crypt('Mita1962!', gen_salt('bf', 10)),
  'admin',
  'ensayo',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_authorized = TRUE,
  password_hash = EXCLUDED.password_hash;

-- 2. Tabla de historial de consultas editoriales
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  citation_function VARCHAR(64) NOT NULL
    CHECK (citation_function IN ('epigrafe', 'argumento', 'contraste', 'ilustracion')),
  work_genre VARCHAR(32) NOT NULL
    CHECK (work_genre IN ('ensayo', 'academico', 'divulgacion', 'discurso')),
  tradition VARCHAR(64) NOT NULL DEFAULT 'todas',
  results_json JSONB NOT NULL,
  model_used VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de citas clásicas guardadas en «Mi florilegio»
CREATE TABLE IF NOT EXISTS saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL DEFAULT '',
  author VARCHAR(180) NOT NULL,
  work VARCHAR(255) NOT NULL,
  epoca VARCHAR(120) NOT NULL DEFAULT '',
  reference VARCHAR(255) NOT NULL,
  quote_text TEXT NOT NULL,
  is_paraphrase BOOLEAN NOT NULL DEFAULT FALSE,
  work_context TEXT NOT NULL,
  selection_justification TEXT NOT NULL,
  conceptual_bridge TEXT NOT NULL,
  insertion_suggestion TEXT NOT NULL,
  bibliographic_citation TEXT NOT NULL DEFAULT '',
  citation_function VARCHAR(64) NOT NULL
    CHECK (citation_function IN ('epigrafe', 'argumento', 'contraste', 'ilustracion')),
  work_genre VARCHAR(32) NOT NULL
    CHECK (work_genre IN ('ensayo', 'academico', 'divulgacion', 'discurso')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_authorized_created
  ON users (is_authorized, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_user_created
  ON search_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_quotes_user_created
  ON saved_quotes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_quotes_filters
  ON saved_quotes (user_id, work_genre, citation_function);
