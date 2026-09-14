-- La aplicacion habla directamente con Postgres via drizzle, no con PostgREST.
-- Sin RLS, estas tablas quedarian legibles y escribibles con la clave anonima
-- de Supabase, que es publica. Se activa RLS y NO se crea ninguna politica:
-- eso deniega todo acceso via API, mientras la conexion directa del servidor
-- (rol postgres) sigue funcionando porque ese rol omite RLS.

ALTER TABLE "public"."payment_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "public"."payment_requests" FROM anon, authenticated;
REVOKE ALL ON "public"."payment_events" FROM anon, authenticated;
