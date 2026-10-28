-- Base dédiée à Umami, dans la même instance Postgres que l'application.
-- Exécuté une seule fois, à la création du volume pgdata.
-- Sur une installation déjà en place, créez-la à la main :
--   docker compose exec postgres psql -U user -c 'CREATE DATABASE umami;'
SELECT 'CREATE DATABASE umami'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'umami')\gexec
