CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  student_name TEXT NOT NULL,
  mobile_phone TEXT NOT NULL,
  email TEXT NOT NULL,
  line_id TEXT NOT NULL,
  birth_date TEXT,
  gender TEXT,
  marital_status TEXT,
  nationality TEXT,
  current_region TEXT,
  referrer_name TEXT,
  learned_jiugong TEXT,
  known_from TEXT,
  motivation TEXT,
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_student_name ON submissions(student_name);
CREATE INDEX IF NOT EXISTS idx_submissions_mobile_phone ON submissions(mobile_phone);
CREATE INDEX IF NOT EXISTS idx_submissions_line_id ON submissions(line_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_key TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL,
  first_failed_at TEXT NOT NULL,
  last_failed_at TEXT NOT NULL,
  locked_until TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts(locked_until);
