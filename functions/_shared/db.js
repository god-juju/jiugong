export async function ensureSchema(db) {
  await db.batch([
    db.prepare(`
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
      )
    `),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_submissions_student_name ON submissions(student_name)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_submissions_mobile_phone ON submissions(mobile_phone)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_submissions_line_id ON submissions(line_id)"),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        attempt_key TEXT PRIMARY KEY,
        failed_count INTEGER NOT NULL,
        first_failed_at TEXT NOT NULL,
        last_failed_at TEXT NOT NULL,
        locked_until TEXT
      )
    `),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts(locked_until)")
  ]);
}

const MAX_LOGIN_FAILURES = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

export async function getActiveLoginLock(db, attemptKey, nowMs = Date.now()) {
  const row = await db.prepare(`
    SELECT locked_until
    FROM login_attempts
    WHERE attempt_key = ?
  `).bind(attemptKey).first();

  if (!row || !row.locked_until) return null;

  const lockedUntilMs = Date.parse(row.locked_until);
  if (!Number.isFinite(lockedUntilMs) || lockedUntilMs <= nowMs) {
    await clearLoginAttempt(db, attemptKey);
    return null;
  }

  return {
    lockedUntil: row.locked_until,
    retryAfterSeconds: Math.ceil((lockedUntilMs - nowMs) / 1000)
  };
}

export async function recordFailedLogin(db, attemptKey, nowMs = Date.now()) {
  const row = await db.prepare(`
    SELECT failed_count, first_failed_at
    FROM login_attempts
    WHERE attempt_key = ?
  `).bind(attemptKey).first();

  let firstFailedMs = nowMs;
  let failedCount = 1;

  if (row && row.first_failed_at) {
    const storedFirstFailedMs = Date.parse(row.first_failed_at);
    if (Number.isFinite(storedFirstFailedMs) && nowMs - storedFirstFailedMs < LOGIN_WINDOW_MS) {
      firstFailedMs = storedFirstFailedMs;
      failedCount = Number(row.failed_count || 0) + 1;
    }
  }

  const lockedUntilMs = failedCount >= MAX_LOGIN_FAILURES ? nowMs + LOGIN_LOCK_MS : null;
  const firstFailedAt = new Date(firstFailedMs).toISOString();
  const lastFailedAt = new Date(nowMs).toISOString();
  const lockedUntil = lockedUntilMs ? new Date(lockedUntilMs).toISOString() : null;

  await db.prepare(`
    INSERT INTO login_attempts (
      attempt_key,
      failed_count,
      first_failed_at,
      last_failed_at,
      locked_until
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(attempt_key) DO UPDATE SET
      failed_count = excluded.failed_count,
      first_failed_at = excluded.first_failed_at,
      last_failed_at = excluded.last_failed_at,
      locked_until = excluded.locked_until
  `).bind(attemptKey, failedCount, firstFailedAt, lastFailedAt, lockedUntil).run();

  return {
    failedCount,
    lockedUntil,
    remainingAttempts: Math.max(MAX_LOGIN_FAILURES - failedCount, 0),
    retryAfterSeconds: lockedUntilMs ? Math.ceil((lockedUntilMs - nowMs) / 1000) : 0
  };
}

export async function clearLoginAttempt(db, attemptKey) {
  await db.prepare("DELETE FROM login_attempts WHERE attempt_key = ?").bind(attemptKey).run();
}

export function compactSubmission(row) {
  let payload = {};
  try {
    payload = JSON.parse(row.payload_json || "{}");
  } catch {
    payload = {};
  }

  return {
    id: row.id,
    createdAt: row.created_at,
    studentName: row.student_name,
    mobilePhone: row.mobile_phone,
    email: row.email,
    lineId: row.line_id,
    birthDate: row.birth_date || "",
    gender: row.gender || "",
    maritalStatus: row.marital_status || "",
    nationality: row.nationality || "",
    currentRegion: row.current_region || "",
    referrerName: row.referrer_name || "",
    learnedJiugong: row.learned_jiugong || "",
    knownFrom: row.known_from || "",
    motivation: row.motivation || "",
    payload
  };
}
