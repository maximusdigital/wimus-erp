# Report: Benutzer-Anlegen (Admin Stufe 0, Folge) — 2026-07-02 09:00 MESZ

Auftrag: `.docs/prompts/20260702_0830_prompt_benutzer-anlegen.md`. Voller Zyklus. Commit `53768eb`.
Tests **427 grün** (+7), Build grün. Review-Subagent: **FREIGABE** (0 kritisch, 3 KLEIN).
Keine Migration/Tabelle/Trigger — nutzt bestehende `auth.users` + `wimus.benutzer`.

## 1) Gebaut (mit echten Tabellen/Feldern)

**Verifiziert (read-only, /pg/query):**
- **KEIN Trigger auf `auth.users`** (`pg_trigger` leer) → **Fall 2**: die Route legt die
  `wimus.benutzer`-Zeile SELBST an (kein Auto-Insert).
- `wimus.benutzer`-Spalten: id, mandant_id (nullable), email, vorname, nachname, aktiv (default true),
  mfa_aktiv (default false) — Insert nur mit diesen.
- Mandant-Zuordnung über `benutzer.mandant_id`; `benutzer` real **leer (0 Zeilen)** — s. Offen.

**POST `app/api/benutzer/route.ts`** (Service-Role NUR serverseitig):
1. `requireAdminApi()` als erstes Statement.
2. zod (`benutzerCreateSchema`): email Pflicht+valide, vorname/nachname optional, mandant_id Pflicht.
3. **Mandant-Erlaubnis:** `mandant_id ∈ getUserMandanten()` (RLS-basiert) — sonst 403 (Service-Role
   umgeht RLS → explizite Prüfung gegen Cross-Mandant-Anlegen).
4. `auth.admin.createUser({ email, email_confirm:false })`. Duplikat → **409** (nicht 500).
5. `wimus.benutzer`-Insert (id = auth-user-id, mandant_id, email, vorname, nachname). **Rollback:**
   scheitert der Insert → `auth.admin.deleteUser(uid)` (kein auth.users-Waise).
6. **Best-effort Einladung:** `auth.admin.generateLink({ type:"recovery", email })` → Nutzer setzt
   Passwort selbst. Fehler setzt nur `einladung_versendet:false`, **bricht das Anlegen NICHT ab**
   (201). Antwort: `{ id, einladung_versendet }`.

**Anlegen-Seite** `einstellungen/benutzer/neu/page.tsx` + `components/einstellungen/benutzer-neu-form.tsx`
(react-hook-form + zod, Felder email/vorname/nachname/mandant-Select, Design-System: Label über
Input, Pflicht `*`, Token-Farben, mobil). Bei `einladung_versendet:false` bleibt die Seite mit
Warnhinweis (kein Auto-Redirect), sonst Redirect auf die Liste. „Neuer Benutzer"-Button auf der Liste.

**Tests (+7)** `tests/unit/api/benutzer-anlegen.test.ts`: Nicht-Admin→403, ungültige Email→422,
Fremd-Mandant→403, Duplikat→409, Erfolg→201 (createUser+insert+generateLink), Rollback→`deleteUser`,
Mailfehler→201 mit `einladung_versendet:false`.

## 2) Abweichungen (inkl. Review-Findings)

- **Bug gefunden + behoben:** `mandant_id` war `z.string().uuid()` — die realen **Seed-Mandant-IDs**
  (`11111111-…`, `22222222-…`) sind KEINE RFC-4122-konformen UUIDs (falsches Version/Variant-Nibble);
  zod v4 `.uuid()` lehnt sie ab → reale Formular-Submits wären 422. Ersetzt durch permissive
  UUID-Regex (Postgres akzeptiert diese IDs). Test deckt es ab.
- Review-Findings (KLEIN, kein Blocker): Stale GET-JSDoc korrigiert (POST existiert jetzt). SMTP +
  `email_confirm` s. Offen.

## 3) Offen / Vorbehalt

- **SMTP-Versand nicht von CC verifizierbar:** `generateLink(recovery)` erzeugt den Setz-Passwort-Link;
  ob real eine Mail rausgeht, hängt an der SMTP-Konfiguration der self-hosted GoTrue. `einladung_versendet`
  spiegelt den **API-Aufruf** (Erfolg/Fehler), NICHT die garantierte Zustellung. **Bitte SMTP prüfen /
  mit echtem Postfach testen.** Falls SMTP nicht konfiguriert: Nutzer wird trotzdem angelegt, der
  Passwort-Reset ist dann manuell (Supabase-Studio) auszulösen.
- **`email_confirm:false`:** je nach Auth-Setting kann eine unbestätigte E-Mail den Login blockieren,
  bis der Recovery-/Confirm-Flow durch ist. Der Recovery-Link bestätigt die Adresse beim Passwort-Setzen.
  Kein Sicherheitsproblem; Verhalten hier festgehalten.
- **Neuer Nutzer sieht zunächst nichts:** `user_mandanten()` speist sich aus `benutzer_rollen` (nicht
  `benutzer.mandant_id`). Ohne zugewiesene Rolle ist die RLS-Sicht leer → der Nutzer sieht keine Daten,
  bis eine Rolle vergeben ist. Rollen-Vergabe = **Stufe 1**. (Er erscheint aber korrekt in der
  Admin-Benutzerliste, da diese über `benutzer.mandant_id` filtert.)
- `benutzer` ist aktuell leer → das erste Admin-Bootstrapping (erster superadmin) ist ein separater
  Vorgang (nicht dieser Auftrag).

## 4) Rückfragen

- SMTP im self-hosted Supabase konfiguriert? Wenn ja, teste ich gern mit einem echten Postfach; wenn
  nein, sollen wir `inviteUserByEmail` (statt Recovery-Link) nutzen, sobald SMTP steht?
- Erstes Admin-Bootstrapping (superadmin-Rolle für den ersten Nutzer) — eigener kleiner Auftrag?
