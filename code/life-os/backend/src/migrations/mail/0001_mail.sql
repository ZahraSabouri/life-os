-- Mail and admin: gathered batches, their sources, messages and what she owes.
-- Source fields come from batches; her fields (marked below) are written only by her.
CREATE SCHEMA IF NOT EXISTS mail;

CREATE TABLE mail.batches (
  id uuid PRIMARY KEY,
  run_id text NOT NULL UNIQUE,
  file_name text NOT NULL DEFAULT '',
  gathered_at timestamptz NOT NULL,
  agent text NOT NULL DEFAULT '',
  imported_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','undone')),
  counts jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(counts) = 'object'),
  sources jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sources) = 'array'),
  digest jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(digest) = 'object'),
  backup_file text,
  undone_at timestamptz
);

CREATE TABLE mail.sources (
  id text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT '',
  route text,
  last_status text,
  coverage text,
  window_from timestamptz,
  window_to timestamptz,
  last_batch_id uuid REFERENCES mail.batches(id),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);

CREATE TABLE mail.messages (
  id uuid PRIMARY KEY,
  source_id text NOT NULL REFERENCES mail.sources(id),
  source_message_id text NOT NULL,
  thread_id text,
  kind text NOT NULL,
  received_at timestamptz NOT NULL,
  from_name text, from_address text,
  to_list jsonb NOT NULL DEFAULT '[]'::jsonb, cc_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  subject text NOT NULL DEFAULT '',
  course text, folder text,
  unread_at_source boolean, replied_at_source boolean,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  link text, body text, text_complete boolean,
  summary text NOT NULL DEFAULT '',
  category text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('urgent','high','normal','low')),
  priority_reason text,
  deadline date,
  first_batch_id uuid REFERENCES mail.batches(id), last_batch_id uuid REFERENCES mail.batches(id),
  -- Her fields
  her_priority text CHECK (her_priority IN ('urgent','high','normal','low')),
  seen_at timestamptz, hidden_at timestamptz, pinned boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE UNIQUE INDEX messages_source_key ON mail.messages (source_id, source_message_id) WHERE deleted_at IS NULL;
CREATE INDEX messages_received ON mail.messages (received_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX messages_category ON mail.messages (category) WHERE deleted_at IS NULL;
CREATE INDEX messages_priority ON mail.messages ((coalesce(her_priority, priority))) WHERE deleted_at IS NULL;

CREATE TABLE mail.actions (
  id uuid PRIMARY KEY,
  origin text NOT NULL CHECK (origin IN ('gathered','hers','birthday')),
  dedupe_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('reply','email','text','call','read','do','decide','congratulate')),
  area text NOT NULL CHECK (area IN ('admin','relationships')),
  person_name text, person_address text,
  person_id text, -- a core people.id; people live in the core's SQLite, so no foreign key
  message_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(message_ids) = 'array'),
  since timestamptz,
  title text NOT NULL,
  why text,
  priority text NOT NULL CHECK (priority IN ('urgent','high','normal','low')),
  due date,
  resolved_at_source boolean NOT NULL DEFAULT false,
  resolved_note text,
  first_batch_id uuid REFERENCES mail.batches(id), last_batch_id uuid REFERENCES mail.batches(id),
  -- Her fields
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','snoozed','not-needed')),
  snoozed_until date,
  done_at timestamptz,
  done_by text CHECK (done_by IN ('her','source')),
  her_priority text CHECK (her_priority IN ('urgent','high','normal','low')),
  her_title text, her_note text,
  reopened boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE UNIQUE INDEX actions_dedupe ON mail.actions (dedupe_key) WHERE deleted_at IS NULL;
CREATE INDEX actions_open ON mail.actions (status, due) WHERE deleted_at IS NULL;
CREATE INDEX actions_priority ON mail.actions ((coalesce(her_priority, priority))) WHERE deleted_at IS NULL;
CREATE INDEX actions_person ON mail.actions (person_id) WHERE deleted_at IS NULL;

-- Every change, from a batch (batch_id), an undo (change 'undo') or her (batch_id null). Undo reads it.
CREATE TABLE mail.history (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL CHECK (table_name IN ('sources','messages','actions')),
  record_id text NOT NULL,
  batch_id uuid REFERENCES mail.batches(id),
  change text NOT NULL CHECK (change IN ('import','undo','hers')),
  before jsonb, after jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX history_batch ON mail.history (batch_id);
CREATE INDEX history_record ON mail.history (table_name, record_id);

GRANT USAGE ON SCHEMA mail TO {{app_role}};
GRANT SELECT, INSERT, UPDATE ON mail.batches, mail.sources, mail.messages, mail.actions TO {{app_role}};
GRANT SELECT, INSERT ON mail.history TO {{app_role}};
GRANT USAGE, SELECT ON SEQUENCE mail.history_id_seq TO {{app_role}};
