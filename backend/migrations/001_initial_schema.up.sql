CREATE TABLE users (
   id            UUID PRIMARY KEY,
   email         VARCHAR(255) NOT NULL UNIQUE,
   password_hash TEXT NOT NULL,
   role          VARCHAR(20) NOT NULL DEFAULT 'admin',
   created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

   CONSTRAINT users_role_check CHECK (role IN ('superadmin', 'admin'))
);

CREATE TABLE scenarios (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(20) NOT NULL DEFAULT 'tooltip',
    title         VARCHAR(100) NOT NULL,
    description   VARCHAR(250),
    status        VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at  TIMESTAMPTZ,
    url_pattern   TEXT NOT NULL DEFAULT '*',
    match_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority      INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT scenarios_type_check
        CHECK (type IN ('tooltip', 'modal', 'banner'))
);

CREATE TABLE steps (
    id          UUID PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    step_order  INTEGER NOT NULL,
    title       VARCHAR(100) NOT NULL,
    description VARCHAR(250),
    content     TEXT NOT NULL DEFAULT '',
    selector    TEXT NOT NULL DEFAULT '',
    action_type VARCHAR(50) NOT NULL DEFAULT 'next',
    condition   VARCHAR(50) NOT NULL DEFAULT 'always',
    timeout     INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT steps_timeout_check CHECK (timeout >= 0)
);

CREATE TABLE user_scenario_progress (
    id           UUID PRIMARY KEY,
    scenario_id  UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    session_id   VARCHAR(100) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'started',
    current_step INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (scenario_id, session_id)
);

CREATE TABLE analytics_events (
    id          UUID PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    session_id  VARCHAR(100) NOT NULL,
    anon_id     VARCHAR(100),
    step_id     UUID REFERENCES steps(id) ON DELETE SET NULL,
    event_type  VARCHAR(30) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX users_email_idx ON users (email);

CREATE INDEX scenarios_published_idx
    ON scenarios (published_at)
    WHERE published_at IS NOT NULL;

CREATE INDEX analytics_events_scenario_type_idx
    ON analytics_events (scenario_id, event_type);

CREATE INDEX analytics_events_scenario_created_idx
    ON analytics_events (scenario_id, created_at);
