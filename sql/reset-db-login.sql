-- Ensure the DB role used by the backend can authenticate over TCP
ALTER ROLE azor WITH LOGIN PASSWORD 'azor';
