-- SDR Swarm initial schema

-- Researches table
create table if not exists researches (
    id uuid primary key default gen_random_uuid(),
    company_name text not null,
    company_url text,
    service_to_sell text,
    seller_context text,
    input_data jsonb,
    status text not null default 'pending'
        check (status in ('pending', 'running', 'completed', 'partial', 'failed')),
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

-- Research results (one row per agent step)
create table if not exists research_results (
    id uuid primary key default gen_random_uuid(),
    research_id uuid not null references researches(id) on delete cascade,
    step text not null check (step in ('researcher', 'analyst', 'writer', 'scorer')),
    result_data jsonb not null,
    duration_ms integer,
    created_at timestamptz not null default now()
);

create index if not exists idx_research_results_research_id on research_results(research_id);

-- API keys (BYOK — encrypted at rest)
create table if not exists api_keys (
    id uuid primary key default gen_random_uuid(),
    key_name text unique not null,
    encrypted_value text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- No RLS — single user portfolio project
