CREATE TABLE IF NOT EXISTS user_scenario_progress (
    id           UUID PRIMARY KEY,
    scenario_id  UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    session_id   VARCHAR(100) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'started', -- started / in_progress / completed / skipped
    current_step INT NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (scenario_id, session_id)
);