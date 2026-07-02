# Report: Superadmin-Bootstrap (Setup-User) — 2026-07-02 09:45 MESZ

Auftrag: `.docs/prompts/20260702_0930_prompt_superadmin-bootstrap.md`. Voller Zyklus.
Tests 427 grün (unverändert — nur SQL-Seed + Doku, kein App-Code), Build grün.
Review-Subagent: **FREIGABE** (0 kritisch). **Seed NOCH NICHT angewandt** — SQL liegt zur Freigabe vor.

## 1) Gebaut (mit echten Tabellen/Feldern)

**Verifiziert (read-only /pg/query):**
- **`auth.users` enthält `info@wimus.de` bereits** (id `1f9e3540-5450-4bea-a946-d735bbf3020b`) →
  GoTrue-Bootstrap (GOTRUE_ADMIN_*) ist erfolgt; der Seed schreibt also real (kein NOTICE-Abbruch).
- `benutzer`: PK(id), UNIQUE(email); einzige NOT-NULL-ohne-Default-Spalte = `id`.
- `benutzer_rollen`: **UNIQUE(benutzer_id, rolle_id, mandant_id)** + NOT NULL benutzer_id/rolle_id.
- `mandanten.created_at` existiert.

**`supabase/seed_superadmin.sql`** (idempotenter DO-Block):
- Setzt `wimus.benutzer` (id = auth-uid, mandant_id = erster Seed-Mandant, email, Setup/Superuser, aktiv)
  `ON CONFLICT (id) DO NOTHING`.
- Setzt `wimus.benutzer_rollen` (benutzer_id, rolle_id superadmin, mandant_id, gueltig_von=now())
  `ON CONFLICT (benutzer_id, rolle_id, mandant_id) DO NOTHING`.
- Sauberer `NOTICE`-Abbruch, wenn auth-User / Rolle / Mandant fehlt (kein Fehler, re-runbar).

**Betriebs-Notiz** `.docs/betrieb/superadmin-bootstrap.md`: der manuelle GoTrue-Schritt (ADMIN + SMTP
ENV als **Platzhalter**, keine Secrets) + Apply-/Verifikations-Kommandos, reproduzierbar.

## 2) Entscheidungen (wie im Auftrag gefordert zu dokumentieren)

- **Seed statt Migration:** re-runbarer `supabase/seed_superadmin.sql`, NICHT in der nummerierten
  Migrationskette. Grund: hängt von der GoTrue-ENV-Vorbedingung ab (auth.users muss existieren); auf
  einer frischen DB wäre auth.users leer → NOTICE-Abbruch. Ein Seed außerhalb der Kette ist dafür
  sauberer. Anwenden via `node scripts/db-apply.mjs supabase/seed_superadmin.sql`.
- **benutzer-Pflichtspalten:** nur `id` (Rest Default/nullable) → Insert wie oben ausreichend.
- **ON-CONFLICT-Target benutzer_rollen:** `(benutzer_id, rolle_id, mandant_id)` = das reale UNIQUE-Tripel.
- **mandant_id = erster Seed-Mandant (NICHT NULL)** — bewusst: bei NULL griffe das UNIQUE-Tripel nicht
  (NULL≠NULL → keine Idempotenz) UND `user_mandanten()` (speist sich aus benutzer_rollen.mandant_id)
  liefe leer → der Superuser sähe via RLS keine Daten. Echter mandantübergreifender Superadmin
  (user_mandanten liefert ALLE) = **Stufe 1** (Funktions-Erweiterung), bewusst nicht hier.

## 3) Offen

- **Seed noch nicht angewandt** (Guardrail): SQL in Abschnitt „Rückfragen" unten / im Seed-File. Nach
  Freigabe: einspielen + verifizieren (beide Zeilen existieren, `ist_admin()` true für den User).
- Nach Anwendung ist der Admin-Bereich real startfähig (erster superadmin). Der Setup-User sieht via
  RLS zunächst nur seinen einen Seed-Mandanten (s. Entscheidung mandant_id) — mandantübergreifend = Stufe 1.
- SMTP-Zustellung (Einladungs-/Reset-Mails) weiterhin von der Coolify-SMTP-Config abhängig (s.
  Report Benutzer-Anlegen) — für den Bootstrap-User nicht nötig (Passwort via GOTRUE_ADMIN_PASSWORD).

## 4) Rückfragen — Freigabe zum Einspielen

Exakte SQL (idempotent, schreibt real, da auth.users vorhanden):

```sql
do $$
declare v_uid uuid; v_rolle_id uuid; v_mandant_id uuid;
begin
  select id into v_uid from auth.users where email='info@wimus.de';
  if v_uid is null then raise notice 'auth.users fehlt'; return; end if;
  select id into v_rolle_id from wimus.rollen where name='superadmin';
  if v_rolle_id is null then raise notice 'Rolle superadmin fehlt'; return; end if;
  select id into v_mandant_id from wimus.mandanten order by created_at nulls first limit 1;
  if v_mandant_id is null then raise notice 'kein Mandant'; return; end if;
  insert into wimus.benutzer (id, mandant_id, email, vorname, nachname, aktiv)
  values (v_uid, v_mandant_id, 'info@wimus.de', 'Setup', 'Superuser', true)
  on conflict (id) do nothing;
  insert into wimus.benutzer_rollen (benutzer_id, rolle_id, mandant_id, gueltig_von)
  values (v_uid, v_rolle_id, v_mandant_id, now())
  on conflict (benutzer_id, rolle_id, mandant_id) do nothing;
end $$;
```

Freigabe („ja") → ich spiele über `/pg/query` ein + verifiziere.
