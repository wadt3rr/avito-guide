DELETE FROM steps WHERE scenario_id NOT IN (SELECT id FROM scenarios);

ALTER TABLE steps
    ALTER COLUMN content TYPE TEXT;

ALTER TABLE steps
    DROP CONSTRAINT IF EXISTS steps_scenario_id_fkey;

ALTER TABLE steps
    ADD CONSTRAINT steps_scenario_id_fkey
        FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE;

ALTER TABLE scenarios
    ADD COLUMN IF NOT EXISTS published_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS url_pattern   TEXT NOT NULL DEFAULT '*',
    ADD COLUMN IF NOT EXISTS match_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS priority      INTEGER NOT NULL DEFAULT 0;

ALTER TABLE analytics_events
    ADD COLUMN IF NOT EXISTS anon_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS scenarios_published_idx
    ON scenarios (published_at) WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS analytics_events_scenario_type_idx
    ON analytics_events (scenario_id, event_type);

CREATE INDEX IF NOT EXISTS analytics_events_scenario_created_idx
    ON analytics_events (scenario_id, created_at);
