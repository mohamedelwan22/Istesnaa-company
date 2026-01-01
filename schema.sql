-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Factories Table
CREATE TABLE IF NOT EXISTS factories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    country TEXT,
    city TEXT,
    industry TEXT[], -- Array of strings
    materials TEXT[], -- Array of strings
    capabilities TEXT,
    scale TEXT,
    notes TEXT,
    approved BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventions (Requests) Table
CREATE TABLE IF NOT EXISTS inventions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    industry TEXT NOT NULL,
    type TEXT NOT NULL,
    materials TEXT[], -- Array of strings
    country TEXT,
    analysis_result JSONB, -- Stores the top 3 matches
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventions ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Enable read access for all to factories" ON factories;
DROP POLICY IF EXISTS "Enable all access to factories" ON factories;
DROP POLICY IF EXISTS "Allow public insert inventions" ON inventions;

-- DROP NEW POLICIES O IF EXISTS (For Re-run safety)
DROP POLICY IF EXISTS "Enable full access for anon" ON factories;
DROP POLICY IF EXISTS "Enable insert for inventions" ON inventions;
DROP POLICY IF EXISTS "Enable select for inventions" ON inventions;

-- NEW PERMISSIVE POLICIES (Development Mode)

-- 1. FACTORIES: Allow FULL ACCESS (Select, Insert, Update, Delete) to everyone (Anon/Public)
-- Since we handle auth client-side ('0000'), the DB considers us 'anon'.
CREATE POLICY "Enable full access for anon" ON factories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. INVENTIONS: Allow Insert for public, Select for public (if needed for results)
CREATE POLICY "Enable insert for inventions" ON inventions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable select for inventions" ON inventions
    FOR SELECT
    USING (true);
