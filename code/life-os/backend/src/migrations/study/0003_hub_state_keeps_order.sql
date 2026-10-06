-- The Study hub app relies on the order of the keys in its saved state (it compares the
-- state it loaded with the one it holds, and lists some things in the order they were
-- added). jsonb re-orders keys; json keeps the text exactly as saved.
ALTER TABLE study.hub_workspaces DROP CONSTRAINT hub_workspaces_state_check;
ALTER TABLE study.hub_workspaces DROP CONSTRAINT hub_workspaces_plan_check;
ALTER TABLE study.hub_workspaces DROP CONSTRAINT hub_workspaces_set_aside_check;
ALTER TABLE study.hub_workspaces ALTER COLUMN state DROP DEFAULT;
ALTER TABLE study.hub_workspaces ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE study.hub_workspaces ALTER COLUMN set_aside DROP DEFAULT;
ALTER TABLE study.hub_workspaces ALTER COLUMN state TYPE json USING state::json;
ALTER TABLE study.hub_workspaces ALTER COLUMN plan TYPE json USING plan::json;
ALTER TABLE study.hub_workspaces ALTER COLUMN set_aside TYPE json USING set_aside::json;
ALTER TABLE study.hub_workspaces ALTER COLUMN state SET DEFAULT '{}'::json;
ALTER TABLE study.hub_workspaces ALTER COLUMN plan SET DEFAULT '{}'::json;
ALTER TABLE study.hub_workspaces ALTER COLUMN set_aside SET DEFAULT '{}'::json;
ALTER TABLE study.hub_workspaces ADD CONSTRAINT hub_workspaces_state_check CHECK (json_typeof(state) = 'object');
ALTER TABLE study.hub_workspaces ADD CONSTRAINT hub_workspaces_plan_check CHECK (json_typeof(plan) = 'object');
ALTER TABLE study.hub_workspaces ADD CONSTRAINT hub_workspaces_set_aside_check CHECK (json_typeof(set_aside) = 'object');

ALTER TABLE study.hub_versions DROP CONSTRAINT hub_versions_state_check;
ALTER TABLE study.hub_versions ALTER COLUMN state TYPE json USING state::json;
ALTER TABLE study.hub_versions ADD CONSTRAINT hub_versions_state_check CHECK (json_typeof(state) = 'object');

ALTER TABLE study.hub_events DROP CONSTRAINT hub_events_event_check;
ALTER TABLE study.hub_events ALTER COLUMN event TYPE json USING event::json;
ALTER TABLE study.hub_events ADD CONSTRAINT hub_events_event_check CHECK (json_typeof(event) = 'object');
