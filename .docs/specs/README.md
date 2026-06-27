# WIMUS ERP — Spec-System

Lebende Spezifikationen für das WIMUS-ERP. Jedes Modul besteht aus mehreren gesplitteten
Dokumenten, die als **flache Dateien mit Präfix** in einem gemeinsamen `specs/`-Ordner
liegen (keine Unterordner). Specs werden im Cycle (Vibecoding) fortgeschrieben und an
Meilensteinen eingefroren + versioniert.

## Prinzip

- **Eine Spec ist lebender Kontext, kein Pflichtenheft.** Sie läuft dem Code hinterher
  und hält den aktuellen Stand fest, damit Mensch und Claude Code denselben Kontext teilen.
- **Im Cycle:** lose Listen (Steht / In Arbeit / Ideen), Decision-Log wächst mit.
- **Am Meilenstein:** einfrieren, Version setzen (`status: freigegeben`), Claude Code baut.
- **Nach Umsetzung:** `status: umgesetzt`, nächster Cycle beginnt.
- **Git macht die technische Versionierung.** Kein Datum, keine Version im Dateinamen.

## Namensschema (flach)

Format: `MMM_kuerzel_DDD_name.md`

- **MMM** — dreistellige Modulnummer (`001`, `002`, `003`, `000` = Template).
- **kuerzel** — kurzes Modulkürzel (`erp`, `fibu`, `crm`, `tpl`).
- **DDD** — dreistellige Dokumentnummer mit Lücken (`000`, `100`, `200` … für Einschübe).
- **name** — Dokumenttyp (`konzept`, `architektur`, …).

Beispiele: `001_erp_000_konzept.md`, `002_fibu_200_datenmodell.md`,
`003_crm_400_design.md`. Sortiert automatisch nach Modul, dann Dokument. Jeder Dateiname
ist auch ohne Ordnerkontext eindeutig.

> Die **Modul-ID im Frontmatter** bleibt vierstellig (`id: 0001`, `gehoert_zu: 0001`) —
> sie ist die stabile logische Kennung; nur der Dateiname ist dreistellig.

## Dokumenttypen pro Modul

| Doku-Nr | Datei | Inhalt | Hauptleser |
|---------|-------|--------|-----------|
| 000 | `*_000_konzept` | Nordstern, Steht/InArbeit/Ideen, Decision-Log, Änderungshistorie, Meilensteine **+ Version** | Mensch / Strategie |
| 100 | `*_100_architektur` | Stufen, Datenfluss, Systemgrenzen, Kanäle | Mensch + Claude Code |
| 200 | `*_200_datenmodell` | Tabellen, Felder, Beziehungen, RLS, Datenintegrität | Claude Code |
| 300 | `*_300_prozesse` | Workflows, Freigabe, KI-Controlling, Sonderlogik | Mensch + Claude Code |
| 400 | `*_400_design` | UI/UX, Cockpit, Darstellungen | UI-Arbeit |
| 500 | `*_500_migration` | SQL-Migrationsplan, Reihenfolge, Idempotenz | Claude Code |
| 600 | `*_600_tests` | Abnahmekriterien, Validierung, Testfälle | Claude Code |

> Nicht jedes Modul hat alle Dokumente (z.B. Kern 0001 führt Migration in 200/210 statt
> in einer eigenen 500-Datei).

**Die Modul-Version lebt ausschließlich in der `*_000_konzept`-Datei.** Die anderen Dateien
tragen `gehoert_zu: <id>` und ihr eigenes `geaendert:`-Datum. Am Meilenstein referenziert
das Konzept, welcher Stand der übrigen Dateien dazugehört.

## Änderungshistorie (Pflicht in jeder konzept-Datei)

Jede `*_000_konzept`-Datei führt einen Abschnitt **Änderungshistorie** — ein laufendes
Protokoll aller Änderungen am Modul, neueste oben:

```
| Datum/Zeit | Vorgang | Betroffen |
|------------|---------|-----------|
| 2026-06-26 14:30 | kurzer Vorgang (≤ 100 Zeichen) | betroffene Doku |
```

Jede inhaltliche Änderung an einer Moduldatei wird hier mit Datum/Uhrzeit nachgetragen.
Datenmodell-/Inhaltsänderungen ohne Konzept-Nachtrag (Decision-Log + Historie) sind nicht
zulässig. Version springt nur am Meilenstein; im Cycle wachsen nur Historie + `geaendert`.

## Neues Modul anlegen

1. Die `000_tpl_*`-Dateien kopieren, Präfix auf neue Modulnummer + Kürzel ändern
   (z.B. `004_hr_000_konzept.md`).
2. Im Konzept-Frontmatter id, titel, modul ausfüllen.
3. Im Cycle befüllen, am Meilenstein einfrieren.
4. Hier im Index eintragen.

## Status-Werte

`entwurf` → `in_arbeit` → `freigegeben` → `umgesetzt` → `abgelöst`

## Modul-Index

| ID | Kürzel | Status | Version | Kurzbeschreibung |
|----|--------|--------|---------|------------------|
| 0001 | erp | in_arbeit | 5.1.0 | ERP-Fundament: Hierarchie, Akteure, BK-Kerne, OCR (ocr_verarbeitungen), Dashboards, Organisationen (migriert aus Bestand V502/V501/V104/V101) |
| 0002 | fibu | in_arbeit | 0.6.0 | Belegerkennung, Kontierung, Mehrmandanten/Gesellschafter, GuV + konsolidierte GuV (Scope-Presets, A4-Druck), Objekt-Tags, Reporting-Tabellen, Lieferant-Match, TaxPool-Export |
| 0003 | crm | in_arbeit | 0.2.0 | CRM-Pipelines: Lead-Inbox + Deal-Kanban (implementiert, crm_-Tabellen), Verknüpfungsmodell, Custom Fields, Pipedrive-UI, amoCRM-Ablösung |

## Konventionen

- Sprache: Deutsch (Code/Schema englisch).
- SQL: Migrationen als Download/`.txt`, nie als Code-Block im Chat; idempotent
  (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).
- Dreistellige Nummern-Präfixe mit Lücken (000, 100, 200…) für spätere Einschübe.
- Dateinamen flach + stabil — Querverweise zwischen Modulen über den vollen Dateinamen
  (z.B. `001_erp_200_datenmodell.md`).
- Jede konzept-Datei führt die Änderungshistorie (s.o.).
