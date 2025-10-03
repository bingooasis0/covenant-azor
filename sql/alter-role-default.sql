-- Optional: normalize app-level roles if your schema ever defaulted to 'AGENT'
ALTER TABLE IF EXISTS users ALTER COLUMN role SET DEFAULT 'AZOR';
UPDATE users SET role='AZOR' WHERE role='AGENT';
