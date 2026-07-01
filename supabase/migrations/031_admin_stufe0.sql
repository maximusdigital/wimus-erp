-- =====================================================================
-- Migration 031: Admin-Bereich STUFE 0 — Admin-Gate-Funktion (Modul 010)
--
-- Spec: 010_berechtigungen_300_prozesse.md, „2c. Admin-Bereich STUFE 0".
-- KEINE neuen Tabellen, KEINE Rechte-Matrix, KEINE Scope-Engine (= Stufe 1).
-- NUR die DB-Funktion `wimus.ist_admin()` als Gate-Fundament.
--
-- Bewusst KEINE zusätzliche RLS-Policy auf `benutzer`: Schreibzugriffe laufen
-- über die requireAdmin-gegateten API-Routen (Service-Role) + bestehende
-- mandant_isolation. „Weniger ist besser" (Spec 2c) → API-Gate genügt.
--
-- Muster 1:1 nach `wimus.user_mandanten()` (002): sql / STABLE SECURITY DEFINER /
-- search_path fix / zeitliche Gültigkeit der benutzer_rollen. Idempotent.
-- =====================================================================

create or replace function wimus.ist_admin()
returns boolean
language sql
stable security definer
set search_path to 'wimus', 'public', 'pg_temp'
as $function$
  select exists (
    select 1
    from wimus.benutzer_rollen br
    join wimus.rollen r on r.id = br.rolle_id
    where br.benutzer_id = auth.uid()
      and r.name in ('superadmin', 'mandant_admin')
      and (br.gueltig_von is null or br.gueltig_von <= now())
      and (br.gueltig_bis is null or br.gueltig_bis >= now())
  );
$function$;

grant execute on function wimus.ist_admin() to authenticated;

-- Kontrolle nach dem Lauf:
--   select proname, prosecdef from pg_proc
--     where pronamespace='wimus'::regnamespace and proname='ist_admin';
--   select wimus.ist_admin();  -- als service_role: false (auth.uid() null) — nur Existenz/Fehlerfreiheit
-- =====================================================================
