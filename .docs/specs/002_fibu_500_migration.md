---
gehoert_zu: 0002
dokument: Migration
geaendert: 2026-06-28
---

# 0002 — Migration

> Version & Status des Moduls stehen in `002_fibu_000_konzept.md`.
>
> **Bank-Abgleich (Migration 021, 2026-06-28):** `021_bank_abgleich.sql` legt additiv +
> idempotent `bank_konten` + `bank_umsaetze` an (RLS `mandant_isolation`, Touch-Trigger,
> `import_hash` UNIQUE als Dublettenschutz, FK auf objekte/einheiten/mietvertraege/forderungen).
> Kein neues OP-Modell — Einnahmen verrechnen gegen `forderungen` (typ=miete).
> SQL als Download/`.txt` (nie Code-Block im Chat), idempotent (IF NOT EXISTS, ON CONFLICT
> DO NOTHING). Reihenfolge respektiert FK-Abhängigkeiten. Setzt Kern-Schema (0001) voraus.

## Migrationsreihenfolge (Grobplan)

1. **Stammdaten Steuerstruktur:** `gesellschafter`, Erweiterung `firmen`
   (rechtsform_typ, besteuerungsart, kontenrahmen_ref; steuernummer/datev_* bereits da),
   `beteiligungen`. — Fundament, hängt nichts dran. (real: Migration 010)
2. **Kontenrahmen & Regeln:** `fibu_konten`, `kontierungsregeln`,
   `lieferanten`. — Hängt an firmen. (real: Migration 010)
3. **Belege & Buchungen:** `belege` (FK → firmen/lieferanten; `ocr_verarbeitung_id`
   referenzlos), `fibu_buchungen`, `fibu_korrekturen`. — Hängt an 1+2. (real: Migration 011)
4. **Auswertung/Konsolidierung:** `auswertungs_scopes`, `objekt_tags`,
   `reporting_taxonomie`, `feststellungen`. — Hängt an Buchungen/Stammdaten.

## Idempotenz-Notizen

- Alle CREATE TABLE mit `IF NOT EXISTS`.
- ENUMs via `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`.
- Seed/Defaults (z.B. Standard-Kontierungsregeln, Reporting-Taxonomie) mit
  `ON CONFLICT DO NOTHING`.
- `belege.hash` UNIQUE-Constraint = DB-seitige Dublettensicherung.
- `buchungen.buchungs_id_extern` stabil generieren (für TaxPool-Dublettenerkennung).

## RLS

**Umgesetzt (Migration 010/011/014/015):** Policy `mandant_isolation` je Tabelle über
`mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())`.
Buchungskreis ist `firmen` (FK `firma_id`), NICHT `einheiten` — die ursprünglich erwogene
`einheit_id`-Policy + „einheiten erweitern" wurde verworfen (firmen tragen bereits
rechtsform/steuernummer/datev_*). Akteur-Feinberechtigung (Akteure-Modell 0001) noch offen.
**Hinweis Seeds:** Die oben angedachten FiBu-Seeds (Standard-Kontierungsregeln,
Reporting-Taxonomie) sind NICHT gebaut — Kontierungsregeln/Taxonomie werden über die UI
gepflegt (`/fibu/kontierungsregeln`, `/fibu/reporting-taxonomie`).

## Offen (vor Umsetzung klären)

- OP-1 (Konzept): exaktes EXTF-Feldlayout für Export — kein DB-Thema, aber Export-Job.
- Prüfen ob `einheiten` neu oder bestehende `firmen`/`mandanten` erweitert werden (0001).
