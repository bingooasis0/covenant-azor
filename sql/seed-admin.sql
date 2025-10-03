\
    -- Seed/ensure an app admin (COVENANT) with the given password.
    -- Requires pgcrypto for bcrypt 'crypt(...)' call.
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    DO $$
    DECLARE pass_col text;
    BEGIN
      SELECT column_name INTO pass_col
      FROM information_schema.columns
      WHERE table_name='users' AND column_name IN ('password_hash','hashed_password')
      ORDER BY CASE WHEN column_name='password_hash' THEN 0 ELSE 1 END
      LIMIT 1;

      IF pass_col IS NULL THEN
        RAISE EXCEPTION 'users table missing password column (password_hash/hashed_password)';
      END IF;

      INSERT INTO users (id,email,first_name,last_name,role)
      VALUES (gen_random_uuid(),'colby@covenanttechnology.net','Colby','West','COVENANT')
      ON CONFLICT (email) DO UPDATE
        SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, role=EXCLUDED.role;

      EXECUTE format('UPDATE users SET %I=crypt($1, gen_salt(''bf'',12)) WHERE email=$2', pass_col)
      USING 'Admin#Passw0rd#2025#SetMeNow', 'colby@covenanttechnology.net';
    END $$;
