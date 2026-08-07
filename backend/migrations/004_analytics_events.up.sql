CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    step_id      UUID REFERENCES steps(id) ON DELETE SET NULL,
    event_type   VARCHAR(30) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);