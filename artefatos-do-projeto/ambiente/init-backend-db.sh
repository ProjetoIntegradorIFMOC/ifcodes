#!/bin/bash
# init-backend-db.sh

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "$POSTGRES_DB_BACKEND" OWNER "$POSTGRES_USER";
EOSQL