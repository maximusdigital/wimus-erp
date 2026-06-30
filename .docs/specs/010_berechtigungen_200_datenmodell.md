---
gehoert_zu: 0010
dokument: Datenmodell
geaendert: 2026-06-29
---

# 0010 — Datenmodell (Berechtigungen)

> Version & Status des Moduls stehen in `010_berechtigungen_000_konzept.md`.
> Schema: `wimus`. Erweitert vorhandene Tabellen `rollen` + `benutzer_rollen` (Migration 002),
> ergänzt um Rechte-Matrix + Scope. Alle ‹…›-Stellen vor Bau gegen reales Schema verifizieren.

## Bestand (Migration 002, real verifiziert — NICHT neu anlegen)

```
rollen(id, name UNIQUE, typ ∈ system|mandant|extern, beschreibung, …)
  → 12 geseedet: superadmin, steuerberater, mandant_admin, verwalter, buchhalter,
    hausmeister, reinigungskraft, aussendienst, lesezugriff, eigentuemer_portal,
    mieter_portal, gast_portal

benutzer(id = auth.users.id, mandant_id, email, vorname, nachname, aktiv, mfa_aktiv, …)

benutzer_rollen(id, benutzer_id FK, rolle_id FK, mandant_id FK NULL,
                gueltig_von, gueltig_bis, UNIQUE(benutzer_id, rolle_id, mandant_id))

user_mandanten() RETURNS setof uuid  -- security definer; leitet Mandanten aus benutzer_rollen ab
```

Hierarchie (real): `mandanten` → `gesellschaften`(mandant_id) → `objekte`(mandant_id +
gesellschaft_id NULL) → `einheiten`(objekt_id, keine eigene mandant_id).

---

## Stufe 1 — neue/erweiterte Strukturen

### NEU: rolle_rechte (Rechte-Matrix je Rolle)
```sql
create table wimus.rolle_rechte (
  id        uuid primary key default gen_random_uuid(),
  rolle_id  uuid not null references wimus.rollen(id) on delete cascade,
  bereich   text not null,   -- fibu|vorgaenge|belegung|crm|stammdaten|kommunikation|historie|berechtigungen|audit
  stufe     text not null check (stufe in ('kein','lesen','schreiben','freigeben')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rolle_id, bereich)
);
```
- `bereich` als TEXT mit offener Werteliste (kein ENUM) — neue Module = neuer Bereich ohne
  Migration. Gültige Werte als Konstante in `lib/berechtigungen/bereiche.ts` gepflegt.
- Genau EINE Stufe je (Rolle, Bereich) — `unique`. Fehlt ein Bereich für eine Rolle → implizit
  `kein` (nicht eingetragen = kein Zugriff). Das ist die sichere Default-Richtung.

### ERWEITERT: benutzer_rollen — Scope-Felder (additive ALTER)
```sql
alter table wimus.benutzer_rollen
  add column if not exists scope_typ text not null default 'mandant'
    check (scope_typ in ('global','mandant','gesellschaft','objekt')),
  add column if not exists scope_id uuid;   -- null bei global; sonst Knoten-ID
```
- **Rückwärtskompatibilität:** Default `scope_typ='mandant'` + vorhandenes `mandant_id` →
  Bestandszeilen behalten ihre Wirkung (Scope = ihr bisheriger Mandant). `scope_id` für
  Bestandszeilen aus `mandant_id` befüllen (Daten-Migration im selben Schritt, idempotent).
- **Konsistenz-Regel (CHECK/Trigger):** bei `scope_typ='global'` ist `scope_id` null; sonst
  `scope_id` not null und zeigt auf die passende Tabelle (mandant/gesellschaft/objekt). Da ein
  Multi-Target-FK in PG nicht direkt geht: `scope_id` ohne harten FK + Validierungs-Trigger ODER
  Prüfung in der Engine-Funktion. ‹Entscheidung im Bau: Trigger vs. App-Check — Trigger sicherer›.
- UNIQUE anpassen: alt `(benutzer_id, rolle_id, mandant_id)` → neu
  `(benutzer_id, rolle_id, scope_typ, scope_id)` (sonst kann dieselbe Rolle nicht für zwei
  Gesellschaften vergeben werden). Migration: alten Constraint droppen, neuen anlegen.

### Optional NEU: bereiche (Lookup für UI/Validierung)
```sql
create table wimus.bereiche (
  code        text primary key,        -- fibu, vorgaenge, …
  bezeichnung text not null,
  reihenfolge integer,
  aktiv       boolean not null default true
);
```
- Nur Komfort (UI-Liste, saubere Bezeichnungen). Kann auch als TS-Konstante leben — ‹im Bau
  entscheiden: DB-Lookup vs. nur Code-Konstante; Tendenz Code-Konstante = lean›.

---

## Engine-Funktionen (security definer, analog user_mandanten)

> Kern der Durchsetzung. In Stufe 1 gebaut + getestet, aber RLS nutzt sie noch nicht.

### erlaubte_mandanten(p_bereich text, p_minstufe text) RETURNS setof uuid
Liefert alle Mandant-IDs, für die der aktuelle User (`auth.uid()`) im Bereich `p_bereich`
mindestens Stufe `p_minstufe` hat — unter Berücksichtigung der Scope-Vererbung:
- global-Scope → alle Mandanten.
- mandant-Scope → dieser Mandant.
- gesellschaft-Scope → der Mandant der Gesellschaft (für mandant-Ebene-Tabellen) — Feinheit:
  Gesellschafts-/Objekt-Scope schränkt UNTERHALB des Mandanten ein, s. `erlaubte_objekte`.

### erlaubte_objekte(p_bereich text, p_minstufe text) RETURNS setof uuid
Liefert die Objekt-IDs im Scope (für objekt-/einheit-gebundene Tabellen). Vererbung:
- global → alle Objekte; mandant → alle Objekte des Mandanten; gesellschaft → Objekte der
  Gesellschaft; objekt → genau dieses Objekt.

### hat_recht(p_bereich text, p_minstufe text, p_mandant uuid, p_objekt uuid DEFAULT null) RETURNS boolean
Bool-Convenience für App/API-Checks: prüft, ob der User für die konkrete Ressource
(über Mandant und optional Objekt) die Stufe erreicht. Implementiert über die beiden setof-
Funktionen. Stufen-Ordnung als Helper `stufe_rang(text) → int` (kein=0,lesen=1,schreiben=2,
freigeben=3); „mind. Stufe" = Rang-Vergleich.

> **Performance:** Funktionen `stable security definer set search_path=wimus,public,pg_temp`
> (wie user_mandanten). In RLS-Policies (Stufe 2) als `(mandant_id in (select erlaubte_mandanten
> (...)))` — PG cached die Funktion pro Statement. Bei objekt-gebundenen Tabellen analog
> `objekt_id in (select erlaubte_objekte(...))`.

---

## Stufe 2 — RLS-Umstellung (NUR Skizze, eigener Auftrag je Modul)

Pro Modul-Tabelle die `mandant_isolation`-Policy ersetzen durch bereichs-/stufen-spezifische
Policies, getrennt nach Operation:
```sql
-- Beispiel fibu-Tabelle (mandant-gebunden):
create policy fibu_lesen on wimus.‹fibu_tabelle› for select to authenticated
  using (mandant_id in (select wimus.erlaubte_mandanten('fibu','lesen')));
create policy fibu_schreiben on wimus.‹fibu_tabelle› for insert/update/delete to authenticated
  using/with check (mandant_id in (select wimus.erlaubte_mandanten('fibu','schreiben')));
```
- SELECT vs. INSERT/UPDATE/DELETE getrennt → lesen/schreiben sauber trennbar.
- objekt-gebundene Tabellen (vorgaenge, belegung_sperren, …): `objekt_id in (select
  erlaubte_objekte(...))` statt mandant.
- Reihenfolge + genaue Tabellen je Modul = im jeweiligen Stufe-2-Auftrag (nicht hier raten).

## Stufe 3 — Gruppen (Skizze)
```sql
create table wimus.gruppen (id, mandant_id NULL, name, beschreibung, …);
create table wimus.gruppen_rechte (gruppe_id, rolle_id, scope_typ, scope_id);  -- Bündel
create table wimus.benutzer_gruppen (benutzer_id, gruppe_id, gueltig_von, gueltig_bis);
```
Effektives Recht erweitert um Gruppen-Pfad (Vereinigung User-Rollen ∪ Gruppen-Rollen). Engine-
Funktionen erweitern, nicht ersetzen.

## Indizes
- `rolle_rechte(rolle_id)`, `rolle_rechte(bereich)`.
- `benutzer_rollen(benutzer_id, scope_typ, scope_id)` für die Engine-Lookups.
- (FK-Indizes legt der generische Index-Block aus Migration 002 ohnehin an.)

## Offene Punkte (im Bau klären, nicht raten)
- scope_id-Validierung: Trigger vs. App-Check (Tendenz Trigger = race-sicher).
- bereiche als DB-Lookup vs. Code-Konstante (Tendenz Code).
- Genaues Rechte-Mapping der 12 Rollen → 300_prozesse Abschnitt „Rollen-Seed".
