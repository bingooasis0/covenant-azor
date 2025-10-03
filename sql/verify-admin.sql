SELECT id, email, role, first_name, last_name, created_at
FROM users
WHERE email='colby@covenanttechnology.net';

SELECT 'password_hash set' AS status
WHERE EXISTS (SELECT 1 FROM users WHERE email='colby@covenanttechnology.net' AND coalesce(password_hash,'') <> '')
UNION ALL
SELECT 'hashed_password set'
WHERE EXISTS (SELECT 1 FROM users WHERE email='colby@covenanttechnology.net' AND coalesce(hashed_password,'') <> '');
