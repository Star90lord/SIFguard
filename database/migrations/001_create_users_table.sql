-- Migration: 001_create_users_table.sql
-- Applied on PostgreSQL connection startup or via database CLI

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'HSE Manager',
    department VARCHAR(255) DEFAULT 'Operations Division',
    organization VARCHAR(255) DEFAULT 'Oil India Limited (OIL)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMIT;
