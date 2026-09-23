-- PostgreSQL Demo Users Seed Script
-- Password for all demo accounts: 'password123' (bcrypt hash: $2a$08$4qJ3/T5aF3V12z5Fq5iPSe9UjL.0.V0L3N9Lq1oPSe9UjL.0.V0L3)

INSERT INTO users (name, email, password, role, department, organization)
VALUES 
    ('HSE Administrator', 'hse.admin@oilindia.example', '$2a$08$4qJ3/T5aF3V12z5Fq5iPSe9UjL.0.V0L3N9Lq1oPSe9UjL.0.V0L3', 'HSE Administrator', 'HSE Operations Division', 'Oil India Limited (OIL)'),
    ('HSE Manager', 'hse.manager@oilindia.example', '$2a$08$4qJ3/T5aF3V12z5Fq5iPSe9UjL.0.V0L3N9Lq1oPSe9UjL.0.V0L3', 'HSE Manager', 'Corporate Safety', 'Oil India Limited (OIL)'),
    ('Site Safety Officer', 'safety.officer@oilindia.example', '$2a$08$4qJ3/T5aF3V12z5Fq5iPSe9UjL.0.V0L3N9Lq1oPSe9UjL.0.V0L3', 'Site Safety Officer', 'Field Operations', 'Oil India Limited (OIL)'),
    ('HSE Operator', 'operator@oilindia.example', '$2a$08$4qJ3/T5aF3V12z5Fq5iPSe9UjL.0.V0L3N9Lq1oPSe9UjL.0.V0L3', 'HSE Operator', 'Field Operations', 'Oil India Limited (OIL)')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    updated_at = CURRENT_TIMESTAMP;
