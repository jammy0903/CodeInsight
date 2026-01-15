-- Add isSequential field to Language table
ALTER TABLE languages ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN DEFAULT TRUE NOT NULL;

-- Set python-practical to false (all open)
UPDATE languages SET is_sequential = FALSE WHERE id = 'python-practical';
