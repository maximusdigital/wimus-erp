# Report: Offene Migrationen einspielen + verifizieren (2026-06-28 16:45 MESZ)

Auftrag: `20260628_1630_prompt_migrationen-einspielen.md` (023 · 024 · 027). Reiner Einspiel-/
Verifikations-Lauf, kein Code/keine Spec-Änderung.

## Kernbefund: kein automatischer Schreibweg aus dieser Umgebung
- Etablierter Runner `scripts/db-push.mjs` (wie 022) → **`connect ECONNREFUSED 159.69.241.148:5432`**.
  Direkter Postgres-Port ist zu.
- Tunnel-Modus des Runners (`TUNNEL_LOCAL_PORT`) ist **nicht konfiguriert**; in `.env.local` steht
  nur `DATABASE_URL`, **kein** SSH-Ziel/`TUNNEL_LOCAL_PORT`. Ein SSH-Tunnel ließe sich nur durch
  **Raten** von SSH-User/Key öffnen → laut Auftrag verboten („NICHT raten").
- Verbleibender Lesepfad: Supabase REST (Service-Role, Port 443) — **read-only**, sieht nur
  exponierte `wimus`-Tabellen, **nicht** `pg_extension`/`pg_indexes`/`pg_catalog`.

→ Verifiziert wurde, was über REST geht (023, 027). 024 (nur Extension + GIN-Indizes) ist über
REST prinzipiell nicht prüfbar und mangels Schreibweg auch nicht einspielbar → **geparkt** (s.u.).

## Ergebnis je Migration

### 023 belegung_sperren — ✅ bereits eingespielt + verifiziert
REST-Probe (Äquivalent zu `to_regclass` + `count`):
```
belegung_sperren : da (0 Zeilen)          → to_regclass NICHT NULL, count=0, fehlerfrei ✓
```
Tabelle vorhanden, leer, fehlerfrei abfragbar. Erfüllt beide Soll-Checks des Auftrags.

### 024 suche_trigram (pg_trgm + GIN) — ⚠️ OFFEN (manuell einzuspielen/zu verifizieren)
- **Nicht einspielbar** hier (Port zu, kein Tunnel) und **nicht REST-verifizierbar** (Extension +
  GIN-Indizes liegen im `pg_catalog`, für PostgREST unsichtbar). ILIKE-Suche funktioniert auch
  ohne Trigram-Index — ein REST-Funktionstest könnte „Index vorhanden" also gar nicht beweisen.
- Status (applied ja/nein) ließ sich von hier **nicht** feststellen. Idempotent → gefahrlos
  (erneut) anwendbar.
- **Kopierfertiger SQL-Block** (Supabase SQL-Editor):
```sql
SET search_path TO wimus, public;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_kontakte_nachname_trgm   ON wimus.kontakte   USING gin (nachname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kontakte_vorname_trgm    ON wimus.kontakte   USING gin (vorname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kontakte_firmenname_trgm ON wimus.kontakte   USING gin (firmenname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kontakte_email_trgm      ON wimus.kontakte   USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_objekte_kuerzel_trgm     ON wimus.objekte    USING gin (kuerzel gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_objekte_strasse_trgm     ON wimus.objekte    USING gin (strasse gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_objekte_stadt_trgm       ON wimus.objekte    USING gin (stadt gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_einheiten_kuerzel_trgm   ON wimus.einheiten  USING gin (kuerzel gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_einheiten_bez_trgm       ON wimus.einheiten  USING gin (bezeichnung gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_einheiten_vzc_trgm       ON wimus.einheiten  USING gin (verwendungszweck_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mietvertraege_az_trgm    ON wimus.mietvertraege USING gin (aktenzeichen gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vorgaenge_az_trgm        ON wimus.vorgaenge  USING gin (aktenzeichen gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_buchungen_az_trgm        ON wimus.buchungen  USING gin (aktenzeichen gin_trgm_ops);
```
- **Verifikation danach** (im SQL-Editor):
```sql
SELECT extname FROM pg_extension WHERE extname='pg_trgm';                 -- 1 Zeile
SELECT count(*) FROM pg_indexes WHERE schemaname='wimus' AND indexname LIKE '%trgm%';  -- erwartet 13
```

### 027 felder_kontaktmodell — ✅ bereits eingespielt + verifiziert
REST-Probe:
```
kontakt_typen        : da (44 Zeilen)
geschützte Typen     : { person: 24, organisation: 20 }   → /4 Mandanten = person 6, organisation 5 ✓
custom_field_werte   : da (0 Zeilen, typisierte Spalten wert_text/zahl/datum/bool vorhanden) ✓
```
Erfüllt beide Soll-Checks (`kontakt_typen` person 6/org 5 je Mandant; `custom_field_werte` NICHT NULL).

## Smoke (App)
- **Nicht ausgeführt.** Die eingeloggte App-Smoke (`/belegung`, ⌘K-Suche, `/einstellungen/kontakttypen`)
  setzt laufenden Dev-Server + Auth-Session voraus; sie würde für 024 ohnehin nur die *Funktion*
  (ILIKE) zeigen, nicht die *Index-Existenz*. Da 023/027 bereits auf DB-Ebene (REST) bestätigt sind
  und 024 nicht einspielbar war, wurde auf die schwere App-Smoke verzichtet (kein Code geändert →
  kein E2E-Trigger). Kann auf Wunsch nachgeholt werden.

## Offen / Rückfragen
1. **024 manuell einspielen (Port zu).** Bitte den SQL-Block oben im Supabase-SQL-Editor ausführen
   und mit den zwei Kontroll-Queries (pg_trgm = 1 Zeile, %trgm%-Indizes = 13) bestätigen.
2. **Schreibweg für künftige Migrationen:** Direkter Port 5432 ist von außen zu, kein Tunnel
   hinterlegt. Wenn Max einen **SSH-Tunnel öffnet** und `TUNNEL_LOCAL_PORT` in `.env.local` setzt
   (Runner unterstützt das bereits), kann ich `node --env-file=.env.local scripts/db-push.mjs 024`
   direkt fahren. Alternativ bleibt der SQL-Editor der etablierte Weg. **Nicht geraten**, kein SSH
   selbst geöffnet (keine Credentials hinterlegt).
3. **Kein Fehler/keine Schema-Exposure-Probleme** beobachtet: REST-Zugriff auf `wimus`-Tabellen
   funktioniert (Schema ist exposed) — die self-hosted Stolperfalle „schema wimus not exposed"
   liegt NICHT vor.

## Fazit
- 023 ✅ · 027 ✅ (beide schon in der DB, REST-verifiziert).
- 024 ⚠️ einziger offener Punkt — kopierfertig oben, 1 Editor-Lauf + 2 Kontroll-Queries.
- Kein Schein-Erfolg gemeldet: 024 sauber geparkt statt geraten.
