-- ============================================================================
-- Life OS — TARGET schema reference (data dictionary, in DDL form)
-- ----------------------------------------------------------------------------
-- This is the SHAPE we are aiming at, not a script to run blindly. It folds
-- together: (a) what exists today in backend/src/migrations.sql, (b) the
-- additions Briefs 5-8 already plan (tags.color, spaces, collections, places
-- geo, files metadata, people extensions), and (c) the new entity-relationship
-- depth from this design round (favorites flag, ORGANISATIONS entity,
-- PERSON<->PERSON links, entry<->organisation links).
--
-- HOW A CODE ASSISTANT SHOULD USE THIS:
--   * DO NOT drop or replace live tables. The DB at backend/data/life-os.db
--     holds real data (permanent rule #5: never lose data).
--   * Apply changes as numbered, once-only migrations (Brief 12's runner), each
--     inside a transaction, AFTER taking a backup copy of life-os.db.
--   * SQLite ALTER TABLE ADD COLUMN cannot be "IF NOT EXISTS" — guard in the
--     migration runner by checking PRAGMA table_info before adding.
--   * The registry (entryTypes.proposed.js) is the source of truth for entry
--     TYPES and their detail fields; those live inside entries.details (JSON),
--     NOT as columns. Only add columns for things you query/sort/join on.
--
-- DESIGN SPINE: the power here is the ANCHOR ENTITIES (people, places,
-- organisations) plus the JOIN tables. An entity is defined ONCE and tangled
-- into everything by reference — a person links to events, interactions, gifts,
-- trips, memories, other people. That "specific yet tangled" web is the point.
-- ============================================================================


-- ===== CORE: the one universal record ======================================
-- Every captured thing is an entry. `type` -> registry; `archetype` derived
-- from the registry server-side (never trust a client archetype).
CREATE TABLE IF NOT EXISTS entries (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL DEFAULT 'note',   -- registry key (entryTypes.js)
  archetype   TEXT,                           -- moment|commitment|workstream|collection|practice|anchor
  title       TEXT,
  status      TEXT,                            -- entry-level lifecycle: open|done|archived (commitments)
  start_at    TEXT,                            -- ISO; presence => appears on Calendar
  end_at      TEXT,
  all_day     INTEGER DEFAULT 0,
  favorite    INTEGER NOT NULL DEFAULT 0,      -- NEW: star flag -> Favorites lens
  details     TEXT DEFAULT '{}',               -- JSON, validated against the type's registry fields
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entries_type       ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_archetype  ON entries(archetype);
CREATE INDEX IF NOT EXISTS idx_entries_start_at   ON entries(start_at);
CREATE INDEX IF NOT EXISTS idx_entries_favorite   ON entries(favorite);


-- ===== ANCHOR ENTITY: People ===============================================
-- First-class. Defined once, referenced everywhere. (Brief 6 extends the live
-- 3-column table; birthday is OPTIONAL.)
CREATE TABLE IF NOT EXISTS people (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  birthday      TEXT,                          -- optional ISO (MM-DD usable for recurrence)
  relationship  TEXT,                          -- friend|family|colleague|partner|... (headline label)
  avatar_file_id TEXT REFERENCES files(id),
  notes         TEXT
);

-- People <-> People : friendships, family, partners. THE "friendships link"
-- Xar asked for. Directional row with a relation; store one row per relationship
-- and treat as symmetric in the app, OR store both directions — pick one and
-- document it (recommend: one row, symmetric in the UI).
CREATE TABLE IF NOT EXISTS person_links (
  a_person_id  TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  b_person_id  TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  relation     TEXT NOT NULL,                  -- friend|family|partner|colleague|mentor|...
  since        TEXT,                            -- optional ISO
  notes        TEXT,
  PRIMARY KEY (a_person_id, b_person_id, relation)
);

-- Entry <-> Person : the person is on this event / did this workout with you /
-- is the recipient of this gift / is in this memory.
CREATE TABLE IF NOT EXISTS entry_people (
  entry_id   TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  person_id  TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role       TEXT,                              -- attendee|recipient|author|subject|...
  PRIMARY KEY (entry_id, person_id)
);


-- ===== ANCHOR ENTITY: Places ===============================================
CREATE TABLE IF NOT EXISTS places (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  place_kind  TEXT,                             -- home|uni|cafe|venue|landmark|... (Map legend)
  lat         REAL,
  lng         REAL,
  notes       TEXT
);
CREATE TABLE IF NOT EXISTS entry_places (
  entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  place_id  TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, place_id)
);


-- ===== ANCHOR ENTITY: Organisations (NEW) ==================================
-- Companies, universities, venues, clinics, publishers. Job applications,
-- academic applications, performances, appointments, medical records all point
-- at an org that is defined once and reused — same "tangled" idea as people.
CREATE TABLE IF NOT EXISTS organisations (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  kind     TEXT,                                -- company|university|venue|clinic|publisher|...
  url      TEXT,
  place_id TEXT REFERENCES places(id),          -- its physical location, if any
  notes    TEXT
);
CREATE TABLE IF NOT EXISTS entry_organisations (
  entry_id        TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role            TEXT,                          -- employer|host|venue|provider|...
  PRIMARY KEY (entry_id, organisation_id)
);
-- People <-> Organisations : "Sara works at DeepMind", "my supervisor at Cardiff"
CREATE TABLE IF NOT EXISTS person_organisations (
  person_id       TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role            TEXT,                          -- works-at|studies-at|supervises|...
  PRIMARY KEY (person_id, organisation_id, role)
);


-- ===== Entry <-> Entry links : the general graph ===========================
-- Anything to anything, directional, with a relation. CONVENTION: the child
-- points to the parent, e.g. a photo --part-of--> a trip; a task --part-of-->
-- a workstream. Document the direction once and keep every lens consistent.
CREATE TABLE IF NOT EXISTS entry_links (
  from_entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  to_entry_id    TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  relation       TEXT NOT NULL,                 -- part-of|about|prepares-for|follows-up|references|inspired-by
  PRIMARY KEY (from_entry_id, to_entry_id, relation)
);


-- ===== Tags & Spaces/Rooms =================================================
CREATE TABLE IF NOT EXISTS tags (
  id    TEXT PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL,
  color TEXT                                     -- Brief 5: derived from name hash if absent
);
CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

-- A SPACE is a saved filter. A ROOM is a space with is_room=1 and an accent/UI.
-- Seed from rooms.js. `filter` is a small closed JSON vocabulary
-- ({types:[],archetypes:[],tags:[],rooms:[]}) applied by buildEntriesQuery —
-- NEVER store executable SQL.
CREATE TABLE IF NOT EXISTS spaces (
  id         TEXT PRIMARY KEY,
  slug       TEXT UNIQUE,                        -- rooms.js slug when is_room
  name       TEXT NOT NULL,
  is_room    INTEGER NOT NULL DEFAULT 0,
  color      TEXT,                               -- room accent
  icon       TEXT,
  filter     TEXT NOT NULL DEFAULT '{}',
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);


-- ===== Collections (Brief 7): boards & shelves =============================
CREATE TABLE IF NOT EXISTS collections (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'board',      -- board|shelf|list|campaign
  archetype  TEXT,
  columns    TEXT DEFAULT '[]',                  -- JSON column defs (boards)
  config     TEXT DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS collection_entries (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  entry_id      TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  column        TEXT,
  position      TEXT NOT NULL,                    -- fractional index (string), Brief 7
  PRIMARY KEY (collection_id, entry_id)
);


-- ===== Files (Brief 8) =====================================================
CREATE TABLE IF NOT EXISTS files (
  id         TEXT PRIMARY KEY,
  entry_id   TEXT REFERENCES entries(id) ON DELETE CASCADE,  -- nullable: avatars attach to people
  path       TEXT NOT NULL,                        -- relative, sharded: files/YYYY/MM/<uuid>.<ext>
  thumb_path TEXT,
  mime_type  TEXT,
  size       INTEGER,
  width      INTEGER,
  height     INTEGER,
  taken_at   TEXT,                                 -- EXIF DateTimeOriginal -> seeds entry.start_at
  created_at TEXT NOT NULL
);


-- ===== Search (Brief 11): FTS over entries =================================
-- Handles mixed English + Persian/Urdu (remove_diacritics). Kept in sync via
-- triggers on entries + entry_tags + entry_people.
CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
  entry_id UNINDEXED, title, body, tags, people,
  tokenize = 'unicode61 remove_diacritics 2'
);
