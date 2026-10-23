-- Author: Lliftime. Isolated local teaching data, never the feedback database.
CREATE TABLE IF NOT EXISTS lab_users (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('employee','manager','director','viewer'))
);
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY,
    applicant_id TEXT NOT NULL REFERENCES lab_users(id),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
    purpose TEXT NOT NULL CHECK (length(purpose) BETWEEN 1 AND 2000),
    cost_center TEXT NOT NULL DEFAULT '' CHECK (length(cost_center) <= 40),
    amount_cents INTEGER NOT NULL CHECK (typeof(amount_cents)='integer' AND amount_cents BETWEEN 1 AND 100000000),
    threshold_cents INTEGER NOT NULL CHECK (threshold_cents >= 0),
    required_role TEXT NOT NULL CHECK (required_role IN ('manager','director')),
    status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','withdrawn')),
    version INTEGER NOT NULL CHECK (version >= 1),
    decided_by TEXT REFERENCES lab_users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS application_events (
    id INTEGER PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id),
    actor_id TEXT NOT NULL REFERENCES lab_users(id),
    action TEXT NOT NULL CHECK (action IN ('submitted','approved','rejected','withdrawn')),
    from_status TEXT CHECK (from_status IN ('pending','approved','rejected','withdrawn')),
    to_status TEXT NOT NULL CHECK (to_status IN ('pending','approved','rejected','withdrawn')),
    version INTEGER NOT NULL CHECK (version >= 1),
    reason TEXT NOT NULL,
    request_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    UNIQUE(application_id, version)
);
CREATE INDEX IF NOT EXISTS applications_by_applicant ON applications(applicant_id, id);
PRAGMA user_version = 1;
