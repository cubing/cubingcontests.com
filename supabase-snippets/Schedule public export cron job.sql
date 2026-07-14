select
  cron.schedule(
    'Create public export',
    '0 0 * * *', -- at 00:00 every night; you can set a different schedule, using the cron syntax
    $$
    select
      net.http_post(
        url:=(select decrypted_secret from vault.decrypted_secrets where name = 'base_url') || '/api/export/create-public-export',
        headers:=jsonb_build_object(
          'Content-type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        timeout_milliseconds:=5000
      ) as request_id;
    $$
  );