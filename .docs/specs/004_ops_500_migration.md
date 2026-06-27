---
gehoert_zu: 0004
dokument: Migration
geaendert: 2026-06-28
---

# 0004 — Migration

> Version & Status stehen in `004_ops_000_konzept.md`. Schema `wimus`. Idempotent
> (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ON CONFLICT DO NOTHING`). Anwenden: SQL-Editor.

## Reihenfolge

1. **017_akteure.sql** (Kern-Erweiterung 0001): `akteure`, `akteur_verfuegbarkeit`,
   `akteur_faehigkeiten` + RLS/Trigger. Träger-Modell (Mensch+KI), ersetzt `ma_profile`.
2. **018_ops_vorgaenge.sql** (Modul 004):
   - `vorgaenge` schärfen: CHECK auf `typ`/`status`/`kostentraeger` ergänzen (idempotent via
     `ADD CONSTRAINT … IF NOT EXISTS`-Muster bzw. DROP+ADD), neue Spalten `owner_akteur_id`,
     `faellig_am`, `eskaliert`/`eskaliert_am`, `benachrichtigung_kanal` (ADD COLUMN IF NOT EXISTS).
   - `vorgang_verlauf`, `vorgang_zuweisung`, `vorgang_foto` (Engine-Begleiter).
   - `vorgang_reinigung`, `vorgang_uebergabe`, `vorgang_wartung`, `vorgang_reparatur`,
     `vorgang_schaden` (Typ-Erweiterungen, `vorgang_id` PK/FK).
   - `checklisten_ausfuehrungen` um `akteur_id` ergänzen (ADD COLUMN IF NOT EXISTS).
   - RLS `mandant_isolation` + Touch-Trigger + GRANTs für alle neuen Tabellen.
3. **019_vorgang_foto_ki.sql** (Modul 004): `vorgang_foto` additiv um die KI-Bildanalyse-Felder
   ergänzen (ADD COLUMN IF NOT EXISTS): `ki_analyse` JSONB, `ki_confidence` NUMERIC(3,2),
   `ki_status` TEXT CHECK(auto/pruefen/manuell), `ki_analysiert_am` TIMESTAMPTZ. Reiner ALTER,
   keine neuen Tabellen/Policies. Anwenden nach 018.

## Idempotenz-Notizen

- Bestehende `vorgaenge` (Migration 002) nur additiv ändern; vorhandene `prioritaet`-CHECK
  bleibt. `status`/`typ` waren bisher CHECK-frei → CHECK additiv ergänzen (Bestandswerte prüfen,
  ggf. erst Daten normalisieren).
- `vorgang_<typ>.vorgang_id` als PK = automatisch UNIQUE (genau ein Zusatz je Vorgang).

## Abgelöste Tabellen (OP-6, späterer Cleanup)

`ma_profile`, `ma_verfuegbarkeit`, `einsaetze`, `objekt_zuweisungen`, `auftrag_zuweisungen`,
`geraete`, `wartungsintervalle`, `prozess_bibliothek`, `prozess_ausfuehrungen` (alle Migration
002, schema-only, ungenutzt) werden durch `akteure` + `vorgang_*` ersetzt. Drop erst nach
verifiziertem 004-Stand in eigener Migration.
