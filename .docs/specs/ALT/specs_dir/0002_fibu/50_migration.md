---
gehoert_zu: 0002
dokument: Migration
geaendert: 2026-06-25
---

# 0002 — Migration

> Version & Status des Moduls stehen in `00_konzept.md`.
> SQL als Download/`.txt` (nie Code-Block im Chat), idempotent (IF NOT EXISTS, ON CONFLICT
> DO NOTHING). Reihenfolge respektiert FK-Abhängigkeiten. Setzt Kern-Schema (0001) voraus.

## Migrationsreihenfolge (Grobplan)

1. **Stammdaten Steuerstruktur:** `gesellschafter`, Erweiterung `einheiten`
   (rechtsform_typ, besteuerungsart, steuernummer, kontenrahmen_ref, datev_*),
   `beteiligungen`. — Fundament, hängt nichts dran.
2. **Kontenrahmen & Regeln:** `kontenrahmen`/`konten`, `kontierungsregeln`,
   `lieferanten`/`kreditoren`. — Hängt an einheiten.
3. **Belege & Buchungen:** `belege` (FK → 0001.ocr_verarbeitungen, einheiten, lieferanten),
   `buchungen`, `korrekturen`. — Hängt an 1+2.
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

Policies pro Tabelle nach `einheit_id`. Akteur-Einheiten-Berechtigung über Mapping-Tabelle
(aus 0001 Akteure-Modell). Default-deny, explizite SELECT/INSERT/UPDATE je Rolle.

## Offen (vor Umsetzung klären)

- OP-1 (Konzept): exaktes EXTF-Feldlayout für Export — kein DB-Thema, aber Export-Job.
- Prüfen ob `einheiten` neu oder bestehende `firmen`/`mandanten` erweitert werden (0001).
