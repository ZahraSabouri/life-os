CREATE SCHEMA IF NOT EXISTS study;

CREATE TABLE study.semesters (
  id uuid PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  semester_id uuid, module_id uuid, card_id uuid,
  start_date date, end_date date, start_at timestamptz, end_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(provenance) = 'object'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at),
  CHECK (status IN ('active','planned','in-progress','done','completed','archived','draft','pending','cancelled','booked','missed','blocked'))
);

CREATE TABLE study.modules (LIKE study.semesters INCLUDING ALL);
CREATE TABLE study.cards (LIKE study.semesters INCLUDING ALL);
CREATE TABLE study.assessments (LIKE study.semesters INCLUDING ALL);
CREATE TABLE study.sessions (LIKE study.semesters INCLUDING ALL);
CREATE TABLE study.materials (LIKE study.semesters INCLUDING ALL);
CREATE TABLE study.progress (LIKE study.semesters INCLUDING ALL);
CREATE TABLE study.settings (LIKE study.semesters INCLUDING ALL);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['semesters','modules','cards','assessments','sessions','materials','progress','settings'] LOOP
    EXECUTE format('ALTER TABLE study.%I ADD FOREIGN KEY (semester_id) REFERENCES study.semesters(id) DEFERRABLE INITIALLY DEFERRED', table_name);
    EXECUTE format('ALTER TABLE study.%I ADD FOREIGN KEY (module_id) REFERENCES study.modules(id) DEFERRABLE INITIALLY DEFERRED', table_name);
    EXECUTE format('ALTER TABLE study.%I ADD FOREIGN KEY (card_id) REFERENCES study.cards(id) DEFERRABLE INITIALLY DEFERRED', table_name);
    EXECUTE format('CREATE INDEX ON study.%I (semester_id) WHERE deleted_at IS NULL', table_name);
    EXECUTE format('CREATE INDEX ON study.%I (module_id) WHERE deleted_at IS NULL', table_name);
    EXECUTE format('CREATE INDEX ON study.%I (card_id) WHERE deleted_at IS NULL', table_name);
    EXECUTE format('CREATE INDEX ON study.%I (start_date, end_date) WHERE deleted_at IS NULL', table_name);
    EXECUTE format('CREATE UNIQUE INDEX ON study.%I ((provenance->>''source''), (provenance->>''source_id'')) WHERE provenance ? ''source'' AND provenance ? ''source_id''', table_name);
  END LOOP;
END $$;

CREATE UNIQUE INDEX settings_live_key ON study.settings ((data->>'key')) WHERE deleted_at IS NULL;
ALTER TABLE study.settings ADD CHECK (data ? 'key' AND jsonb_typeof(data->'key') = 'string' AND length(data->>'key') BETWEEN 1 AND 200);

CREATE TABLE study.history (
  id uuid PRIMARY KEY,
  entity text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create','update','delete','import')),
  before_data jsonb,
  after_data jsonb,
  actor text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON study.history (record_id, created_at DESC);
CREATE INDEX ON study.history (created_at DESC);

CREATE TABLE study.import_batches (
  id uuid PRIMARY KEY,
  source text NOT NULL,
  fingerprint text NOT NULL,
  record_count integer NOT NULL CHECK (record_count >= 0),
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, fingerprint)
);
