-- Migration: Add 'approved' column to factories table
ALTER TABLE factories ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Optional: Update existing factories (if any) to be approved if you want to keep current matches
-- UPDATE factories SET approved = TRUE; 
