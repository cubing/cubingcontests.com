SELECT
  pg_stat_activity.pid as connection_id,
  ssl,
  datname as database,
  usename as connected_role,
  application_name,
  client_addr as IP,
  query,
  query_start,
  state,
  backend_start
FROM pg_stat_ssl
JOIN pg_stat_activity
ON pg_stat_ssl.pid = pg_stat_activity.pid;