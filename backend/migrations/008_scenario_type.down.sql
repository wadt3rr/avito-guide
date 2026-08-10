ALTER TABLE scenarios
    DROP CONSTRAINT IF EXISTS scenarios_type_check;

ALTER TABLE scenarios
    DROP COLUMN IF EXISTS type;
