-- SQL Migration: Run this in your Supabase SQL Editor to enable persistence across refreshes.

-- 1. Create factory_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS factory_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed initial groups if empty
INSERT INTO factory_groups (name)
SELECT name FROM (
    VALUES 
    ('صناعة الأدوية'), 
    ('الاستزراع المائي'), 
    ('صناعة البلاستيك'), 
    ('صناعة المعادن'), 
    ('صناعة الأغذية'),
    ('صناعة الملابس'),
    ('أخرى')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM factory_groups);

-- 3. Update factories table structure
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factories' AND column_name = 'status') THEN
        ALTER TABLE factories ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Add is_contacted column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factories' AND column_name = 'is_contacted') THEN
        ALTER TABLE factories ADD COLUMN is_contacted BOOLEAN DEFAULT false;
    END IF;

    -- Add batch_id as UUID if it exists but is TEXT, or just ensure it exists
    -- We'll keep batch_id and batch_name for compatibility, but batch_id should target factory_groups.id
END $$;

-- 4. Indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_factories_status ON factories(status);
CREATE INDEX IF NOT EXISTS idx_factories_is_contacted ON factories(is_contacted);
CREATE INDEX IF NOT EXISTS idx_factories_batch_id ON factories(batch_id);

-- 5. CRITICAL: Security Policies
-- Disable RLS for easy admin management (or set permissive policies)
ALTER TABLE factories DISABLE ROW LEVEL SECURITY;
ALTER TABLE factory_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventions DISABLE ROW LEVEL SECURITY;
