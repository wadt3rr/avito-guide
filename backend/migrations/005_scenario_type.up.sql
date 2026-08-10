ALTER TABLE scenarios
    ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'tooltip'
    CHECK (type IN ('tooltip', 'modal', 'banner'));
