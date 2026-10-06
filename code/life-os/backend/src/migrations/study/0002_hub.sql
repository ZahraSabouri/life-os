-- The Study hub app keeps one workspace per semester: what the app saves (state)
-- and that semester's plan (cards that were prepared in advance, schedule rules,
-- wording). A new semester starts with both empty.
CREATE TABLE study.hub_workspaces (
  semester_id uuid PRIMARY KEY REFERENCES study.semesters(id),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  state jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(state) = 'object'),
  plan jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(plan) = 'object'),
  -- Things that came with an import but are not study (life, health, admin, job hunt).
  -- Kept so nothing is lost; the Study hub never shows them.
  set_aside jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(set_aside) = 'object'),
  writer_id text NOT NULL DEFAULT '',
  written_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Earlier copies of a workspace's state, taken at the first save of a day, at the
-- first save from a new browser tab, before imports, and when a save shrinks the
-- state sharply. They let a bad save be undone.
CREATE TABLE study.hub_versions (
  id uuid PRIMARY KEY,
  semester_id uuid NOT NULL REFERENCES study.semesters(id),
  revision integer NOT NULL,
  reason text NOT NULL,
  state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hub_versions_semester_time ON study.hub_versions (semester_id, created_at DESC);

-- The app's own log of what happened (card done, checklist ticked, hours logged).
CREATE TABLE study.hub_events (
  semester_id uuid NOT NULL REFERENCES study.semesters(id),
  id text NOT NULL,
  occurred_at timestamptz,
  checksum text NOT NULL DEFAULT '',
  event jsonb NOT NULL CHECK (jsonb_typeof(event) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (semester_id, id)
);
CREATE INDEX hub_events_semester_time ON study.hub_events (semester_id, occurred_at);

GRANT SELECT, INSERT, UPDATE ON study.hub_workspaces TO {{app_role}};
GRANT SELECT, INSERT ON study.hub_versions TO {{app_role}};
GRANT SELECT, INSERT ON study.hub_events TO {{app_role}};
