# WIMUS ERP — Modul-Index (Landkarte)

> Übersicht aller Module: Status, Version, Spec-Dateien, Abhängigkeiten. **Zuerst lesen** für den
> Gesamtüberblick, dann gezielt in die Modul-Specs springen (statt alle Specs zu scannen).
>
> Pflege: Konzept-Claude aktualisiert bei jedem Modul-Bau/Spec-Update (wie `_LOG.md`).
> Versionen/Status spiegeln die `*_000_konzept.md`-Frontmatter. Detail-Chronik → `_LOG.md`,
> offene Ideen → `_BACKLOG.md`.

## Status-Legende
`entwurf` (Spec in Arbeit) · `in_arbeit` (teils gebaut) · `freigegeben` · `umgesetzt` · `abgelöst`
Live-Hinweis = Migration eingespielt + verifiziert.

## Module

| Modul | Version | Status | Live? | Specs | Hängt ab von |
|-------|---------|--------|-------|-------|--------------|
| **001 erp-kern** | 5.3.0 | in_arbeit | Belegung 023 ✅ | 000/200/300 | — |
| **002 fibu** | 0.12.0 | in_arbeit | Bank 021+022 ✅ | 000/200/300 | 001 |
| **003 crm** | 0.2.0 | in_arbeit | (real prüfen) | 000–600 | 001 |
| **004 ops** | 0.4.1 | in_arbeit | Kanban 020 ✅ | 000–600 | 001 |
| **005 automation** | — | geplant | nein | (Backlog #7) | 001 |
| **006 suche** | 0.2.0 | in_arbeit | Trigram 024 ✅ | 000/200/300 | 001 |
| **007 kommunikation** | 0.4.0 | in_arbeit | WA Empfang+Sendeweg gebaut (nicht live, Deploy unhealthy #17) | 000/200/300 | 001 |
| **008 felder** | 0.2.0 | in_arbeit | Felder 027 ✅ | 000/200/300 | 001, 006 |
| **009 historie** | 0.2.0 | in_arbeit | Audit 028 ✅ | 000/200/300 | 001, 007 |
| **010 berechtigungen** | 0.1.0 | entwurf | nein (Spec) | 000/200/300 | 001 |

> Hinweis 003/004/005: 003 = crm (Kanban-Pipelines, v0.2.0), 004 = ops (Vorgangs-Engine, v0.4.1,
> Kanban Migration 020 gebaut), 005 = automation (noch Backlog #7, nicht gebaut). 003/004 haben
> volle Spec-Sätze (000–600) im Repo. Live-Stand von 003 bei Gelegenheit real verifizieren.

## Abhängigkeits-Kurzbild

```
001 erp-kern ── Fundament für alle
  ├─ 002 fibu
  ├─ 004 ops
  ├─ 006 suche ──────┐
  ├─ 007 kommunikation ──┐
  └─ 008 felder (auch auf 006)
                         │
  009 historie (auf 007) ┘   ← sammelt Aktivitäten aller Module (Lieferanten)
  005 automation (geplant)   ← nutzt 007-Bausteine, liefert an 009
```

- **006 suche** ist Filter-Backend auch für **008** (Custom-Field-Filter docken an 006 an).
- **007 kommunikation** liefert Aktivitäten an **009** (nachricht_empfangen/gesendet) und nutzt
  **008** (Custom Fields als Baustein-Platzhalter).
- **009 historie** ist die Klammer: alle Module liefern via `protokolliere()`.

## Querschnittliche Schichten (Muster)

Vier Module folgen demselben „eine Schicht, alle docken an"-Muster:
`006 suche` (Filter) · `007 kommunikation` (Kanäle) · `008 felder` (Custom Fields) ·
`009 historie` (Audit/Aktivität). Gemeinsames Bau-Muster: zentral + dezentral über n:m-Bezug
(`kom_nachricht_bezug` / `aktivitaet_bezug`), Service-Schicht in `lib/<modul>/`.

## Doku-Landkarte (wo steht was)

| Datei | Inhalt |
|-------|--------|
| `_INDEX.md` (diese) | Modul-Landkarte: Status/Version/Specs/Abhängigkeiten |
| `_LOG.md` | Projekt-Changelog (Teil A chronologisch + Teil B nach Modul) |
| `_BACKLOG.md` | Offene Ideen (P1/P2/P3) |
| `CLAUDE.md` | Regelwerk für Claude Code (Arbeitszyklus, Migrationsweg, Permissions) |
| `.docs/specs/MMM_kuerzel_DDD_name.md` | Modul-Specs (000 Konzept / 200 Datenmodell / 300 Prozesse) |
| `.docs/prompts/` ↔ `.docs/reports/` | Bau-Aufträge ↔ Rückmeldungen |
| `_NOTE_*.md` | Doku-Schnipsel (englischer Begriff, kein Datum) |

## Änderungshistorie (dieser Index)

| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-29 09:50 | 003=crm präzisiert (aus CLAUDE.md); CLAUDE.md Schritt 1 + Spec-System um _INDEX ergänzt (CC steigt mit Index ein). |
| 2026-06-29 09:45 | _INDEX.md angelegt (Karpathy-style Modul-Landkarte). Stand: 001 v5.3.0, 002 v0.12.0, 006 v0.2.0, 007 v0.4.0, 008 v0.2.0, 009 v0.2.0. 003/004/005 als Repo-only markiert. |
