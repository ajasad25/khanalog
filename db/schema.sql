-- Khana Log schema. Idempotent: safe to run on every deploy (npm run db:push).

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,                 -- 'user:<clerk id>' or 'demo:<random>'
  kind        TEXT NOT NULL DEFAULT 'user',     -- 'user' | 'demo'
  profile     JSONB NOT NULL DEFAULT '{}',
  goal        JSONB NOT NULL DEFAULT '{"source":null}',
  foods       JSONB NOT NULL DEFAULT '{}',
  usage       JSONB,
  expires_at  TIMESTAMPTZ,                      -- demo sandboxes only
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS days (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day       DATE NOT NULL,
  steps     INTEGER,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS entries (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        DATE NOT NULL,
  kind       TEXT NOT NULL,                      -- 'food' | 'burned'
  name       TEXT NOT NULL,
  calories   INTEGER NOT NULL,
  quantity   TEXT,
  logged_at  TIMESTAMPTZ NOT NULL,
  position   INTEGER NOT NULL                    -- order within the day
);
CREATE INDEX IF NOT EXISTS entries_user_day ON entries (user_id, day);

CREATE TABLE IF NOT EXISTS messages (
  id       BIGSERIAL PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role     TEXT NOT NULL,                        -- 'user' | 'assistant'
  content  TEXT NOT NULL,
  sent_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_user ON messages (user_id, id);
