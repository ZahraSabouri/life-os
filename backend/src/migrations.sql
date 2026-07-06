CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'note',
  title TEXT,
  status TEXT,
  start_at TEXT,
  end_at TEXT,
  all_day INTEGER DEFAULT 0,
  details TEXT DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birthday TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS entry_people (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  person_id TEXT NOT NULL REFERENCES people(id),
  role TEXT,
  PRIMARY KEY (entry_id, person_id)
);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL,
  lng REAL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS entry_places (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  place_id TEXT NOT NULL REFERENCES places(id),
  PRIMARY KEY (entry_id, place_id)
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id),
  path TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_links (
  from_entry_id TEXT NOT NULL REFERENCES entries(id),
  to_entry_id TEXT NOT NULL REFERENCES entries(id),
  relation TEXT,
  PRIMARY KEY (from_entry_id, to_entry_id, relation)
);

