CREATE TABLE IF NOT EXISTS steps (
    id UUID PRIMARY KEY,
    scenario_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL ,
    description VARCHAR(250),
    step_order INTEGER NOT NULL,
    action_type VARCHAR(50),
    selector TEXT,
    content VARCHAR(50),
    condition VARCHAR(50),
    timeout INTEGER 
);