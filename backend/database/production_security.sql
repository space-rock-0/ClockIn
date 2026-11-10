-- Run once in Supabase SQL Editor on existing ClockIn databases.
-- Prevent browser clients from invoking server-only schema/learning functions.
revoke all on function public.increment_latent_key(text) from public, anon, authenticated;
revoke all on function public.promote_latent_column(text) from public, anon, authenticated;
grant execute on function public.increment_latent_key(text) to service_role;
grant execute on function public.promote_latent_column(text) to service_role;
notify pgrst, 'reload schema';
