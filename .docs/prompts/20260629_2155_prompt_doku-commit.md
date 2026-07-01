# Auftrag: Doku-Stand committen + pushen (Session 2026-06-29 Abend) — 21:55 MESZ

Reiner **Doku-Commit** — nur `.docs/**` + `.gitignore`. KEINE Migration, KEIN Code, KEINE
Anwendung. Der ganze uncommittete Konzept-/Aufräum-Stand dieser Session wird gesichert.

## Was zu committen ist (alles bereits geschrieben, nur add/commit/push)

**Specs (Konzept-Claude-Arbeit):**
- `010_berechtigungen_000_konzept.md` — Abschnitt „RLS-Härtung" (H1–H4) + Historie.
- `010_berechtigungen_100_architektur.md` — NEU (Engine-Tiefe: A1 #21-Kollision, A2 Auflösungspfade,
  A3 explizite Freischaltung, A4 Performance, A5 Anti-Lockout, A6 Negativ-Tests).
- `010_berechtigungen_300_prozesse.md` — Abschnitt 1b (Matrix-UI: Matrix A + B, Scope-Umschalter).
- `021_org_migration_000_phase_b.md` — Schema-Check-Befunde (SC-1/SC-2), B0-Split (marke→Phase D),
  firmen-Attribut-Modell (#11), offene Punkte #9–#11, Historie.
- `001_erp_200_datenmodell.md` — Tags-Abschnitt (Kern-Querschnitt).
- `specs/ALT/011_tags_*` — verworfene Modul-Dateien (mit Verworfen-Hinweis).

**Register (Konzept-Claude-Hoheit):**
- `_INDEX.md` — Tags 030 live, 010 um 100 erweitert, NOTES-Zeile entfernt.
- `_BACKLOG.md` — #22 (Tags) entfernt (in Kern überführt).
- `CLAUDE.md` — „KEINE _NOTE_*-Streudateien" (Doku-Typ-Regel korrigiert).

**Aufräumen (Karpathy-Schema):**
- 5 `_NOTE_*`-Dateien nach `.docs/_trash/` verschoben (3 aus Root, 2 aus notes/). Inhalte vorher
  in die Specs überführt. `notes/`-Ordner ist leer.
- `.gitignore` — Backup-Dumps ausgeschlossen (`*.dump`, `.docs/sql/` etc.).

**Prompts (Bau-Aufträge, gehören mitcommittet):**
- `20260629_1845_prompt_tags.md`, `20260629_2030_prompt_029-anwenden.md`,
  `20260629_2105_prompt_029-split-anwenden.md`.

## WICHTIG — was NICHT passiert
- KEINE Migration anwenden. 029-Split (`20260629_2105_prompt_029-split-anwenden.md`) ist ein
  SEPARATER, noch offener Bau-Auftrag — NICHT Teil dieses Doku-Commits. Nur die Prompt-DATEI wird
  mitcommittet, der Auftrag selbst läuft später durch den Zyklus.
- `.docs/sql/*.dump` NICHT committen (jetzt gitignored — verifizieren, dass `git status` die Dumps
  NICHT als staged zeigt).
- Reports 2045 (029-Stopp) + 2055 (Tags) sind bereits committet — nur falls uncommittet, mitnehmen.

## Ablauf
1. `git status` — prüfen, was uncommittet ist. **Verifizieren: kein `.dump` in der Staging-Liste**
   (falls doch, `git rm --cached` + im Report vermerken — NICHT pushen mit Produktivdaten).
2. `git add` der `.docs/**`-Änderungen + `.gitignore`. Die nach `_trash` verschobenen Dateien +
   der leere `notes/`-Ordner: Git trackt Verschiebungen automatisch (alte Pfade gelöscht, neue
   unter `_trash/`). `notes/` leer → Git führt ihn nicht.
3. `git commit` (aussagekräftig, z.B. „docs: Berechtigungen-Matrix+Härtung+Architektur, Org
   Schema-Befunde+B0-Split, Tags im Kern, NOTES-Aufräumen (Karpathy), .gitignore Dumps").
4. `git push origin main` (kein force).

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_doku-commit.md` (4 Punkte): was committet (Datei-Liste kurz),
Bestätigung „kein Dump im Commit", Push erfolgreich (Commit-Hash), Rückfragen (keine erwartet).

## Leitplanken
- Kein force-push. Nur `.docs/**` + `.gitignore` — keine Code-/Migrationsdateien in diesem Commit.
- Bei Dump in der Staging-Liste: STOPP, entfernen, im Report melden.
