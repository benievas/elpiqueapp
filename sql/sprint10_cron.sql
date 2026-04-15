-- ============================================================
-- Sprint 10 — Cron job para cancelar partidos expirados
-- EJECUTAR SOLO DESPUÉS de habilitar pg_cron:
-- Dashboard → Database → Extensions → pg_cron → Enable
-- ============================================================

-- Eliminar job previo si existe
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'cancel-expired-party-payments';

-- Registrar cron: se ejecuta cada hora en el minuto 0
SELECT cron.schedule(
  'cancel-expired-party-payments',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://aracmkttghzxdnujxuca.supabase.co/functions/v1/cancel-expired-parties',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);

-- Verificar
SELECT jobid, jobname, schedule, active FROM cron.job
WHERE jobname = 'cancel-expired-party-payments';
