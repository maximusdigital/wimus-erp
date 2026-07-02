# Betrieb: Superadmin-Bootstrap (reproduzierbar)

Löst den Henne/Ei-Start des Admin-Bereichs (Modul 010): `wimus.benutzer` ist leer → ohne einen
verankerten Admin kann sich niemand anmelden. Zwei Schritte — **(1) Infrastruktur macht Max**,
**(2) den `wimus`-Seed spielt Claude Code über den Guardrail-Weg ein.**

## 1) GoTrue-ENV in Coolify (Max, manuell — NICHT Claude Code)

Am Supabase-`auth`-Service (GoTrue) setzen, dann `auth`-Container **neu starten**:

```
GOTRUE_ADMIN_EMAIL=info@wimus.de
GOTRUE_ADMIN_PASSWORD=‹starkes-Passwort›          # PLATZHALTER — nie ins Repo
# SMTP (Hetzner KonsoleH), damit Einladungs-/Reset-Mails rausgehen:
GOTRUE_SMTP_HOST=mail.your-server.de
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=info@wimus.de
GOTRUE_SMTP_PASS=‹smtp-passwort›                  # PLATZHALTER — nie ins Repo
GOTRUE_SMTP_ADMIN_EMAIL=info@wimus.de
```

Ergebnis: GoTrue legt beim Start den User in `auth.users` an. (Stand 2026-07-02: `info@wimus.de`
ist real in `auth.users` vorhanden — Schritt 1 ist erfolgt.)

## 2) wimus-Verknüpfung seeden (Claude Code, Guardrail)

```
node scripts/db-apply.mjs supabase/seed_superadmin.sql
```

- Idempotent + re-runbar. Fehlt der auth-User → sauberer NOTICE-Abbruch (kein Fehler).
- Legt `wimus.benutzer` (id = auth-user-id, erster Seed-Mandant, aktiv) + Rolle `superadmin` in
  `wimus.benutzer_rollen` an (mandant_id = derselbe Seed-Mandant → user_mandanten() greift).

## Verifikation

```sql
select id, email, aktiv, mandant_id from wimus.benutzer where email='info@wimus.de';
select br.* from wimus.benutzer_rollen br join wimus.rollen r on r.id=br.rolle_id
  where r.name='superadmin'
    and br.benutzer_id=(select id from auth.users where email='info@wimus.de');
```

Beide Zeilen müssen existieren. Danach ist `wimus.ist_admin()` für diesen eingeloggten Nutzer true
→ `/einstellungen/*` zugänglich.

## Grenzen (Stufe 1)

- Der Setup-User sieht via RLS zunächst nur **seinen einen Seed-Mandanten** (`user_mandanten()` speist
  sich aus `benutzer_rollen.mandant_id`). Echter mandantübergreifender Superadmin (alle Mandanten) =
  Stufe 1 (Erweiterung von `user_mandanten()`), bewusst nicht hier.
- Kein Secret liegt im Repo; Passwörter/SMTP nur als Coolify-ENV (Platzhalter oben).
