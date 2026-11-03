-- Stage 5, Harvest (briefs/stage-5-harvest.md): what came in besides mail and things to do
-- (items), the real links in a message, which batch format brought a run, and her rules for
-- senders. Source fields come from batches; her fields (marked below) are written only by her.
ALTER TABLE mail.batches ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version IN (1, 2));
ALTER TABLE mail.messages ADD COLUMN links jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(links) = 'array');

CREATE TABLE mail.items (
  id uuid PRIMARY KEY,
  dedupe_key text NOT NULL,
  area text NOT NULL CHECK (area IN ('admin','academic','jobs','research','events','money','perks','health','home')),
  kind text NOT NULL CHECK (kind IN ('vacancy','opportunity','event','announcement','material','offer','info')),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  day date NOT NULL, -- the London day it came in; the Harvest log is one page per day
  -- When it happens: a time (start_at, end_at) or a day (start_day, end_day), never both
  start_at timestamptz, end_at timestamptz,
  start_day date, end_day date,
  all_day boolean NOT NULL DEFAULT false,
  deadline date, -- the day it closes, ends or is due
  location text,
  url text,
  canonical_url text, -- shared/harvest.js canonicalUrl(url): how JobMap and Cardiff Life places are found
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'), -- course, organiser, employer, salary, cost, tags
  source_id text REFERENCES mail.sources(id), -- the source of its first message; null for a web find
  message_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(message_ids) = 'array'),
  action_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(action_ids) = 'array'),
  found_url text, found_at timestamptz,
  first_batch_id uuid REFERENCES mail.batches(id), last_batch_id uuid REFERENCES mail.batches(id),
  -- Her fields
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','kept','dismissed')),
  seen_at timestamptz,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  CHECK (start_at IS NULL OR start_day IS NULL),
  CHECK (end_at IS NULL OR end_day IS NULL)
);
CREATE UNIQUE INDEX items_dedupe ON mail.items (dedupe_key) WHERE deleted_at IS NULL;
CREATE INDEX items_day ON mail.items (day DESC) WHERE deleted_at IS NULL;
CREATE INDEX items_kind ON mail.items (kind, area) WHERE deleted_at IS NULL;
CREATE INDEX items_deadline ON mail.items (deadline) WHERE deleted_at IS NULL;
CREATE INDEX items_canonical_url ON mail.items (canonical_url) WHERE deleted_at IS NULL;

-- Her rules for a sender: fold their mail to one line a day, or hide it. All of it is hers.
CREATE TABLE mail.senders (
  id uuid PRIMARY KEY,
  address text NOT NULL CHECK (address = lower(address) AND address LIKE '%@%'),
  name text,
  rule text NOT NULL CHECK (rule IN ('fold','hide')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE UNIQUE INDEX senders_address ON mail.senders (address) WHERE deleted_at IS NULL;

ALTER TABLE mail.history DROP CONSTRAINT history_table_name_check;
ALTER TABLE mail.history ADD CONSTRAINT history_table_name_check CHECK (table_name IN ('sources','messages','actions','items','senders'));

GRANT SELECT, INSERT, UPDATE ON mail.items, mail.senders TO {{app_role}};
