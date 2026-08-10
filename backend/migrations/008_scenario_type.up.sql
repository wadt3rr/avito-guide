ALTER TABLE scenarios
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'tooltip';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'scenarios'
          AND column_name = 'format'
    ) THEN
        EXECUTE 'UPDATE scenarios
                 SET type = CASE
                     WHEN format IN (''tooltip'', ''modal'', ''banner'') THEN format
                     ELSE ''tooltip''
                 END';
    END IF;
END
$$;

ALTER TABLE scenarios
    DROP CONSTRAINT IF EXISTS scenarios_type_check;

ALTER TABLE scenarios
    ADD CONSTRAINT scenarios_type_check
        CHECK (type IN ('tooltip', 'modal', 'banner'));
