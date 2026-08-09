DROP INDEX IF EXISTS analytics_events_scenario_created_idx;
DROP INDEX IF EXISTS analytics_events_scenario_type_idx;
DROP INDEX IF EXISTS scenarios_published_idx;

ALTER TABLE analytics_events DROP COLUMN IF EXISTS anon_id;

ALTER TABLE scenarios
    DROP COLUMN IF EXISTS priority,
    DROP COLUMN IF EXISTS match_context,
    DROP COLUMN IF EXISTS url_pattern,
    DROP COLUMN IF EXISTS published_at;

ALTER TABLE steps DROP CONSTRAINT IF EXISTS steps_scenario_id_fkey;

ALTER TABLE steps ALTER COLUMN content TYPE VARCHAR(50);
