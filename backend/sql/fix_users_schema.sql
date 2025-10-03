-- Fix users table schema to match backend models
-- Add first_name and last_name columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';

-- If there's a 'name' column, try to split it into first/last name
-- This is a best-effort migration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        -- Update first_name and last_name from name column where they're empty
        UPDATE users
        SET
            first_name = COALESCE(NULLIF(SPLIT_PART(name, ' ', 1), ''), first_name),
            last_name = COALESCE(NULLIF(SUBSTRING(name FROM POSITION(' ' IN name) + 1), ''), last_name)
        WHERE name IS NOT NULL AND name != ''
        AND (first_name = '' OR last_name = '');

        -- Drop the old name column if you want
        -- ALTER TABLE users DROP COLUMN name;
    END IF;
END $$;
