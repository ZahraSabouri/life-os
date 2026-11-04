-- Stage 6, the Desk (briefs/stage-6-desk.md): more kinds of things, the state a moving thing is in
-- and what happened to it (item_events), an opportunity's form, a reference and an amount, her own
-- domain for a thing and a sender's taught domain. What is new carries an owner, so accounts
-- (stage 7) do not redo it; until then every row belongs to the one owner.
ALTER TABLE mail.items DROP CONSTRAINT items_area_check;
ALTER TABLE mail.items ADD CONSTRAINT items_area_check CHECK (area IN ('admin','academic','jobs','research','events','people','money','perks','health','home','travel'));
ALTER TABLE mail.items DROP CONSTRAINT items_kind_check;
ALTER TABLE mail.items ADD CONSTRAINT items_kind_check CHECK (kind IN ('vacancy','application','opportunity','event','announcement','material','offer','bill','payment',
  'subscription','order','tenancy','booking','appointment','official','document','account','person','info'));
ALTER TABLE mail.items
  ADD COLUMN owner_id text NOT NULL DEFAULT 'owner',
  ADD COLUMN state text CHECK (state ~ '^[a-z][a-z-]{1,30}$'),
  ADD COLUMN form text CHECK (form IN ('hackathon','competition','research','scholarship','volunteering','course','programme','other')),
  ADD COLUMN external_ref text, -- an order or booking number, as the message gives it
  ADD COLUMN amount_pence bigint,
  ADD COLUMN currency text CHECK (currency ~ '^[A-Z]{3}$'),
  -- Her field: the domain she moved it to
  ADD COLUMN her_domain text CHECK (her_domain IN ('work','learning','social','money','home','health','travel','admin'));
CREATE INDEX items_state ON mail.items (kind, state) WHERE deleted_at IS NULL;

-- What happened to a thing, oldest first: it came in, then each new state a harvest brought, at
-- the time of the message that brought it. Undoing a run marks its events undone.
CREATE TABLE mail.item_events (
  id bigserial PRIMARY KEY,
  owner_id text NOT NULL DEFAULT 'owner',
  item_id uuid NOT NULL REFERENCES mail.items(id),
  at timestamptz NOT NULL,
  state text,
  note text NOT NULL DEFAULT '',
  message_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(message_ids) = 'array'),
  batch_id uuid REFERENCES mail.batches(id),
  undone_at timestamptz
);
CREATE INDEX item_events_item ON mail.item_events (item_id, at);
CREATE INDEX item_events_batch ON mail.item_events (batch_id);

-- A sender's rule can now also be only a domain ("file"), and any rule can carry one.
ALTER TABLE mail.senders ADD COLUMN owner_id text NOT NULL DEFAULT 'owner';
ALTER TABLE mail.senders ADD COLUMN domain text CHECK (domain IN ('work','learning','social','money','home','health','travel','admin'));
ALTER TABLE mail.senders DROP CONSTRAINT senders_rule_check;
ALTER TABLE mail.senders ADD CONSTRAINT senders_rule_check CHECK (rule IN ('fold','hide','file'));

GRANT SELECT, INSERT, UPDATE ON mail.item_events TO {{app_role}};
GRANT USAGE, SELECT ON SEQUENCE mail.item_events_id_seq TO {{app_role}};
