# WIMUS ERP — Spec-System

Lebende Spezifikationen für das WIMUS-ERP. Jedes Modul ist ein eigener Ordner mit
mehreren gesplitteten Dokumenten. Specs werden im Cycle (Vibecoding) fortgeschrieben
und an Meilensteinen eingefroren + versioniert.

## Prinzip

- **Eine Spec ist lebender Kontext, kein Pflichtenheft.** Sie läuft dem Code hinterher
  und hält den aktuellen Stand fest, damit Mensch und Claude Code denselben Kontext teilen.
- **Im Cycle:** lose Listen (Steht / In Arbeit / Ideen), Decision-Log wächst mit.
- **Am Meilenstein:** einfrieren, Version setzen (`status: freigegeben`), Claude Code baut.
- **Nach Umsetzung:** `status: umgesetzt`, nächster Cycle beginnt.
- **Git macht die technische Versionierung.** Kein Datum, keine Version im Dateinamen.

## Dateistruktur pro Modul

| Datei | Inhalt | Hauptleser |
|-------|--------|-----------|
| `00_konzept.md` | Nordstern, Steht/InArbeit/Ideen, Decision-Log, Meilensteine **+ Version** | Mensch / Strategie |
| `10_architektur.md` | Stufen, Datenfluss, Systemgrenzen, Kanäle | Mensch + Claude Code |
| `20_datenmodell.md` | Tabellen, Felder, Beziehungen, RLS, Status-Maschine | Claude Code |
| `30_prozesse.md` | Workflows, Freigabe, KI-Controlling, Sonderlogik | Mensch + Claude Code |
| `40_design.md` | UI/UX, Cockpit, Darstellungen | UI-Arbeit |
| `50_migration.md` | SQL-Migrationsplan, Reihenfolge, Idempotenz | Claude Code |
| `60_tests.md` | Abnahmekriterien, Validierung, Testfälle | Claude Code |

**Die Modul-Version lebt ausschließlich in `00_konzept.md`.** Die anderen Dateien tragen
`gehoert_zu: <id>` und ihr eigenes `geaendert:`-Datum. Am Meilenstein referenziert
`00_konzept.md`, welcher Stand der übrigen Dateien dazugehört.

## Neues Modul anlegen

1. `_template/` nach `NNNN_<kurzname>/` kopieren.
2. In `00_konzept.md` Frontmatter ausfüllen (id, titel, modul).
3. Im Cycle befüllen, am Meilenstein einfrieren.
4. Hier im Index eintragen.

## Status-Werte

`entwurf` → `in_arbeit` → `freigegeben` → `umgesetzt` → `abgelöst`

## Modul-Index

| ID | Modul | Status | Version | Kurzbeschreibung |
|----|-------|--------|---------|------------------|
| 0001 | erp-kern | in_arbeit | 5.0.0 | ERP-Fundament: Hierarchie, Akteure, BK-Kerne, OCR, Dashboards (migriert aus Bestand V502/V501/V104/V101) |
| 0002 | fibu | in_arbeit | 0.1.0 | Belegerkennung, Kontierung, Mehrmandanten/Gesellschafter, TaxPool-Export, Bank-Cockpit, KI-Controlling |

## Konventionen

- Sprache: Deutsch (Code/Schema englisch).
- SQL: Migrationen als Download/`.txt`, nie als Code-Block im Chat; idempotent
  (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).
- Zweistellige Nummern-Präfixe mit Lücken (00, 10, 20…) für spätere Einschübe.
- Dateinamen stabil — Querverweise zwischen Modulen über Modul-ID.
