-- Enable RLS on factories table
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow admin read" ON factories;
DROP POLICY IF EXISTS "Allow admin update" ON factories;
DROP POLICY IF EXISTS "Allow admin insert" ON factories;
DROP POLICY IF EXISTS "Allow admin delete" ON factories;
DROP POLICY IF EXISTS "Enable full access for anon" ON factories;

-- Create comprehensive policies allowing access to all (Public/Anon)
-- Since we are fixing a dashboard that might not have authenticated users in the DB sense (using '0000' user or similar)
-- we allow public access for now as per the symptoms description and previous schema.

-- 1. Allow SELECT (Fixes the "disappearing rows" issue)
CREATE POLICY "Allow admin read"
ON factories
FOR SELECT
USING (true);

-- 2. Allow UPDATE (Fixes the persistence issue)
CREATE POLICY "Allow admin update"
ON factories
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 3. Allow INSERT
CREATE POLICY "Allow admin insert"
ON factories
FOR INSERT
WITH CHECK (true);

-- 4. Allow DELETE
CREATE POLICY "Allow admin delete"
ON factories
FOR DELETE
USING (true);

-- Ensure columns exist and have correct types (Idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factories' AND column_name = 'status') THEN
        ALTER TABLE factories ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factories' AND column_name = 'is_contacted') THEN
        ALTER TABLE factories ADD COLUMN is_contacted BOOLEAN DEFAULT false;
    END IF;
END $$;
