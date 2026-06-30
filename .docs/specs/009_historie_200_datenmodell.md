---
id: 0009
titel: ERP-weite Historie + Audit-Log — Datenmodell
modul: historie
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 009_historie_000_konzept.md
---

# 0009 — Datenmodell & Architektur

> Status: **GEBAUT + EINGESPIELT (Migration 028 via /pg/query verifiziert, 382 Tests grün).**
> `wimus`-Schema, RLS mandant_isolation. Reale Whitelist + Akteur-Lösung unten.

## 1. Audit-Log (Fundament, DB-Trigger)

### audit_log (append-only)
```
id PK (bigint/uuid), mandant_id FK NULL,
tabelle TEXT, operation (INSERT|UPDATE|DELETE),
datensatz_id,                                  -- PK der geänderten Zeile
alt JSONB NULL, neu JSONB NULL,                -- Zustände (DELETE: nur alt, INSERT: nur neu)
geaendert_felder TEXT[] NULL,                  -- bei UPDATE: welche Spalten
akteur_id FK NULL,                             -- aus Session-Var, sonst NULL = system/direkt
akteur_quelle (app|system|direkt),
zeitpunkt TIMESTAMPTZ DEFAULT now()
```
- **Append-only:** kein UPDATE/DELETE auf `audit_log` (außer Retention-Job). Kein RLS-Schreibpfad
  aus der App — nur der Trigger schreibt.
- **Lesen:** RLS mandant_isolation; nur berechtigte Rollen (Verwalter/Admin) sehen das Audit-Log.

### Generische Trigger-Funktion
```sql
CREATE OR REPLACE FUNCTION wimus.audit_trigger() RETURNS trigger AS $$
DECLARE v_akteur uuid := coalesce(
            nullif(current_setting('wimus.akteur_id', true),'')::uuid,
            nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid
          );  -- REAL: SET LOCAL nicht über PostgREST setzbar → request.jwt.claims (auto je Request)
BEGIN
  INSERT INTO wimus.audit_log(mandant_id, tabelle, operation, datensatz_id, alt, neu,
    geaendert_felder, akteur_id, akteur_quelle)
  VALUES (
    coalesce(NEW.mandant_id, OLD.mandant_id),
    TG_TABLE_NAME, TG_OP,
    coalesce(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN to_jsonb(NEW) END,
    CASE WHEN TG_OP='UPDATE' THEN wimus.changed_keys(to_jsonb(OLD), to_jsonb(NEW)) END,
    v_akteur,
    CASE WHEN v_akteur IS NULL THEN 'direkt' ELSE 'app' END
  );
  RETURN coalesce(NEW, OLD);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```
- **Akteur (REAL):** `SET LOCAL wimus.akteur_id` ist über supabase-js/PostgREST NICHT pro
  Request setzbar (HTTP, keine App-Transaktion). Daher Fallback-Kette `wimus.akteur_id` →
  `request.jwt.claims->>'sub'` (von PostgREST je authentifiziertem Request automatisch gesetzt)
  → NULL. So kennt das Audit den auth-User OHNE App-Code; Service-Role hat leere Claim → `direkt`.
- **`akteur_id uuid` OHNE harte FK:** es ist die auth-User-UUID (`auth.users`), nicht zwingend
  eine `wimus.akteure`-Zeile (FK würde auth-IDs ablehnen). Mapping auth-User→akteur = Folge-Punkt.
- Hilfsfunktion `changed_keys(old,new)` → Array der geänderten Spalten.

### Trigger-Anbringung (WHITELIST kritischer Tabellen — real verifizieren)
```sql
-- je Tabelle der Whitelist (idempotent: DROP TRIGGER IF EXISTS ... dann CREATE):
CREATE TRIGGER trg_audit_‹tabelle› AFTER INSERT OR UPDATE OR DELETE
  ON wimus.‹tabelle› FOR EACH ROW EXECUTE FUNCTION wimus.audit_trigger();
```
**Whitelist (10 reale Tabellen, verifiziert — alle mit id+mandant_id):** `mietvertraege`,
`kontakte`, `organisationen`, `forderungen`, `mahnungen`, `buchungen`, `belege`, `bank_umsaetze`,
`belegung_sperren`, `fibu_buchungen`. Zugang/Schloss WEGGELASSEN (TTLock real noch nicht da,
Phase 3); `fibu_buchungen` ergänzt. append-only via Grant (nur SELECT für authenticated).

## 2. Aktivitäts-Historie (Sicht, app-seitig)

### aktivitaeten
```
id PK, mandant_id FK,
typ TEXT,                                      -- z.B. zahlung_eingegangen, mahnung_versandt,
                                               --      nachricht_gesendet, schaden_gemeldet,
                                               --      vertrag_angelegt, zugang_vergeben …
modul TEXT,                                    -- fibu|kommunikation|belegung|zugang|…
titel TEXT, beschreibung TEXT NULL,
akteur_id FK NULL,                             -- wer löste aus (Mensch/System)
audit_log_id FK NULL,                          -- optionaler Verweis aufs Audit-Fundament
payload JSONB NULL,                            -- typ-spezifische Details (Betrag, Vertrag-Ref …)
zeitpunkt TIMESTAMPTZ DEFAULT now(),
created_at
```

### aktivitaet_bezug (n:m — zentral/dezentral, analog kom_nachricht_bezug)
```
id PK, aktivitaet_id FK,
bezug_typ (kontakt|mieter|einheit|objekt|vorgang|organisation),
bezug_id,
quelle (primaer|abgeleitet),                   -- primaer = direkt, abgeleitet = via Hierarchie
UNIQUE(aktivitaet_id, bezug_typ, bezug_id)
```
- **Primär-Bezug** = die Entität, an der das Ereignis hängt (z.B. Mietvertrag → Mieter).
- **Abgeleitet** = über Hierarchie (Mieter→Einheit→Objekt), damit höhere Ebenen „untergeordnete"
  einblenden können. Genau das 0007-Muster.

### Indizes
```sql
CREATE INDEX ON wimus.aktivitaeten (mandant_id, zeitpunkt DESC);   -- Feed neueste oben
CREATE INDEX ON wimus.aktivitaeten (modul, typ);                   -- Filter
CREATE INDEX ON wimus.aktivitaet_bezug (bezug_typ, bezug_id);      -- dezentrale Sicht
CREATE INDEX ON wimus.audit_log (tabelle, datensatz_id, zeitpunkt DESC);
CREATE INDEX ON wimus.audit_log (mandant_id, zeitpunkt DESC);
```

## 3. Service-Schicht (`lib/historie/`)
```
types.ts          Aktivitaet, AuditEntry, Bezug, EntityRef
protokolliere.ts  protokolliere(typ, modul, titel, payload, primaerBezug) — schreibt
                  aktivitaeten + leitet Bezüge über Hierarchie ab (analog 0007-Loader)
feed.ts           Feed lesen: zentral + dezentral (Bezug-Filter, Ebenen-Umschalter, Ranking
                  nach zeitpunkt), Modul/Typ-Filter
audit.ts          Audit-Log lesen (Compliance-Ansicht; nur berechtigte Rollen)
akteur.ts         setzt/liest wimus.akteur_id (Session-Var) im Server-Client
```
- Module rufen NUR `protokolliere(...)`. Bezug-Ableitung (Hierarchie) zentral hier — kein Modul
  baut Bezugs-Logik selbst nach.

## 4. RLS / Datenschutz
- `aktivitaeten`/`aktivitaet_bezug`/`audit_log`: RLS mandant_isolation.
- **Datenschutz dezentrale Sicht** (wie 0007): „inkl. untergeordnete" ist Verwalter-Sicht; in
  einer Mieter-/Portal-Sicht kein Einblick in fremde/private Aktivitäten anderer.
- **Audit-Log lesen** nur für berechtigte Rollen (Verwalter/Admin), nicht für normale Nutzer.

## 5. Offen → Claude Code (Report)
1. Whitelist-Tabellen real verifizieren (Existenz, `mandant_id`/`id` vorhanden).
2. Session-Var `wimus.akteur_id` real setzbar im Server-Client/API? (sonst Akteur-Fallback).
3. Vorhandene Einzel-Historien (Mahnstatus etc.) → als Aktivitäts-Lieferant einbinden?
4. Retention-Default (Aufbewahrungsdauer Audit) — DSGVO-Spannungsfeld, Default vorschlagen.
5. `changed_keys`-Hilfsfunktion bauen oder vorhandene nutzen.
