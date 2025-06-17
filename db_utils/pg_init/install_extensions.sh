#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$DB_USERNAME" --dbname "$DB_NAME" <<-EOSQL
CREATE EXTENSION unaccent;
SELECT * FROM pg_extension;
EOSQL