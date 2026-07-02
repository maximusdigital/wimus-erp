-- =====================================================================
-- Seed: Superadmin-Bootstrap (Setup-/Break-Glass-User) — Modul 010, 2d
--
-- Zweck: den Henne/Ei-Start des Admin-Bereichs lösen — `wimus.benutzer` ist real
-- leer, also kann sich niemand als Admin anmelden. Dieser Seed verankert den
-- bereits über GoTrue (GOTRUE_ADMIN_*) angelegten auth.users-Setup-User in
-- `wimus.benutzer` + gibt ihm die Rolle `superadmin`.
--
-- BEWUSST SEED (kein nummerierte Migration): hängt von der GoTrue-ENV-Vorbedingung
-- (auth.users existiert) ab — auf einer frischen DB wäre auth.users leer. Daher
-- re-runbar + idempotent, außerhalb der Migrationskette. Anwenden NACH GoTrue-Bootstrap:
--   node scripts/db-apply.mjs supabase/seed_superadmin.sql   (Guardrail: SQL zeigen → Freigabe)
--
-- Fehlt der auth-User → sauberer NOTICE-Abbruch (kein Fehler), Seed bleibt bereit.
--
-- Reale Constraints (verifiziert):
--   benutzer: PK(id), UNIQUE(email); nur id ist NOT NULL ohne Default.
--   benutzer_rollen: UNIQUE(benutzer_id, rolle_id, mandant_id) → mandant_id NICHT NULL,
--     sonst greift ON CONFLICT nicht (NULL≠NULL) und user_mandanten() liefert kein Mandant.
--   → benutzer_rollen.mandant_id = derselbe Seed-Mandant wie benutzer.mandant_id.
--   Mandantübergreifender Superadmin (user_mandanten liefert ALLE) = Stufe 1, nicht hier.
-- KEINE Scope-Spalten / rolle_rechte / Matrix (Stufe 1). Nur benutzer + superadmin-Rolle.
-- =====================================================================

do $$
declare
  v_uid       uuid;
  v_rolle_id  uuid;
  v_mandant_id uuid;
begin
  select id into v_uid from auth.users where email = 'info@wimus.de';
  if v_uid is null then
    raise notice 'auth.users info@wimus.de fehlt — GoTrue-Bootstrap (GOTRUE_ADMIN_*) + Restart zuerst.';
    return;
  end if;

  select id into v_rolle_id from wimus.rollen where name = 'superadmin';
  if v_rolle_id is null then
    raise notice 'Rolle superadmin fehlt in wimus.rollen.';
    return;
  end if;

  select id into v_mandant_id from wimus.mandanten order by created_at nulls first limit 1;
  if v_mandant_id is null then
    raise notice 'Kein Mandant vorhanden — Seed-Mandant zuerst anlegen.';
    return;
  end if;

  insert into wimus.benutzer (id, mandant_id, email, vorname, nachname, aktiv)
  values (v_uid, v_mandant_id, 'info@wimus.de', 'Setup', 'Superuser', true)
  on conflict (id) do nothing;

  insert into wimus.benutzer_rollen (benutzer_id, rolle_id, mandant_id, gueltig_von)
  values (v_uid, v_rolle_id, v_mandant_id, now())
  on conflict (benutzer_id, rolle_id, mandant_id) do nothing;

  raise notice 'Superadmin-Bootstrap ok: benutzer % + Rolle superadmin (Mandant %).', v_uid, v_mandant_id;
end $$;

-- Verifikation (read-only):
--   select id, email, aktiv, mandant_id from wimus.benutzer where email='info@wimus.de';
--   select br.* from wimus.benutzer_rollen br join wimus.rollen r on r.id=br.rolle_id
--     where r.name='superadmin' and br.benutzer_id=(select id from auth.users where email='info@wimus.de');
-- =====================================================================
