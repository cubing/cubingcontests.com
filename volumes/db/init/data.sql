DROP EXTENSION IF EXISTS pgjwt CASCADE; -- not used for supabase/postgres from PG version 17

-- Create Cubing Contests user
\set db_username `echo "$CC_DB_USERNAME"`
\set db_password `echo "$CC_DB_PASSWORD"`
\set db_name `echo "$POSTGRES_DB"`

CREATE USER :"db_username" WITH PASSWORD :'db_password';
ALTER DATABASE :"db_name" OWNER TO :"db_username";
