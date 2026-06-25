# Auftrag für Claude Code — Spec-System einrichten & Altbestand migrieren

Dieser Auftrag richtet das neue Spec-System lokal ein und überführt die restlichen
Word-Bestandsdokumente. Die Hauptarbeit ist bereits erledigt (0001 + 0002 liegen als
Markdown vor) — hier geht es um Ablage, Git und das Aufräumen der Alt-Dateien.

## Kontext

Das neue Spec-System liegt als fertige Markdown-Struktur vor (Ordner `specs/`). Es ersetzt
die bisherigen einzelnen Word-Specs in `.docs`. Prinzip: ein Ordner pro Modul, gesplittete
Dokumente (00_konzept / 10_architektur / 20_datenmodell / 30_prozesse / 40_design /
50_migration / 60_tests), Version lebt nur in `00_konzept.md`, Git macht die Versionierung.
Details: siehe `specs/README.md`.

## Aufgaben

1. **Ablegen:** Lege den gelieferten `specs/`-Ordner unter `D:\www\home\erp.wimus.de\.docs\`
   ab (also `.docs\specs\`). Struktur:
   - `specs/README.md`
   - `specs/_template/` (Vorlage für neue Module)
   - `specs/0001_erp-kern/` (aus Bestand migriert)
   - `specs/0002_fibu/` (neues FiBu-Modul)

2. **Alt-Dateien prüfen:** In `.docs` liegen die alten Word-Specs:
   - 20260624_WIMUS_IT_ERP_10_Spezifikation_Docs_V502.docx → migriert nach
     0001/30_prozesse.md (+ Teile 00_konzept)
   - 20260624_WIMUS_IT_ERP_20_Architektur_Docs_V501.docx → 0001/10_architektur.md
   - 20260624_WIMUS_IT_ERP_21_Datenmodell_Docs_V502.docx → 0001/20_datenmodell.md
   - 20260624_WIMUS_IT_ERP_40_DesignSystem_Docs_V104.docx → 0001/40_design.md
   - 20260623_WIMUS_IT_ERP_50_Testing_Docs_V101.docx → 0001/60_tests.md

   Prüfe stichprobenartig, ob beim Markdown-Übertrag inhaltlich nichts Wichtiges verloren
   ging (insb. Tabellen im Datenmodell und Design). Falls du Lücken findest, ergänze sie in
   der jeweiligen Markdown-Datei.

3. **Alt-Dateien archivieren (nicht löschen):** Verschiebe die fünf .docx nach
   `.docs\_archiv_word\`. So bleibt der Originalstand erhalten, ist aber aus dem aktiven
   Spec-System raus.

4. **Fehlende Bestandteile prüfen — gab es weitere Specs?** Im Bestand wurden referenziert,
   lagen aber NICHT vor:
   - Ein Gesamtkonzept-/Nordstern-Dokument (00) → jetzt durch 0001/00_konzept.md abgedeckt.
   - Ein Prozess-Dokument (30) → Inhalte steckten in der Spezifikation, jetzt
     0001/30_prozesse.md.
   - `CLAUDE.md` → wird in den Specs referenziert; prüfe, ob sie im Repo-Root existiert und
     aktuell ist (UI-Konventionen V104). Gehört ins Repo, nicht in die Specs.
   - Migrations-SQL 001–005 (.txt) → prüfe, wo die liegen; im Spec-System nur referenziert.
   Falls weitere Spec-Dokumente in `.docs` existieren, die ich nicht gesehen habe (z.B.
   weitere Nummern wie 30, 41, 22): nach gleichem Muster ins neue System migrieren.

5. **Git:** Committe das neue Spec-System (`git add .docs/specs`), Commit-Message z.B.
   „specs: neues Spec-as-Code-System, 0001 migriert + 0002 FiBu". Archiv-Verschiebung als
   eigener Commit.

6. **CLAUDE.md ergänzen (Repo-Root):** Trage einen Verweis ein, dass Specs jetzt unter
   `.docs/specs/<NNNN_modul>/` als Markdown liegen und vor jeder Modul-Arbeit das zugehörige
   `00_konzept.md` (Stand/Decisions) zu lesen ist.

## Wichtig

- Nichts an den Inhalten von 0001/0002 inhaltlich umschreiben — nur Lücken aus den Word-
  Originalen nachtragen, falls vorhanden.
- Die Word-Originale NICHT löschen, nur archivieren (GoBD-Gedanke: Originalstand erhalten).
- Offene Punkte (OP-x) in den 00_konzept.md beider Module beachten — das sind die nächsten
  inhaltlichen Klärungen, nicht Teil dieses Migrations-Auftrags.
