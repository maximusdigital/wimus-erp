# Prozess (kurz)

## Rollen
- **Spec führen wir** (Owner + Konzept-Claude im Chat). Claude Code **baut nur**, ändert keine Specs.
- Spec geht nicht auf → Claude Code **fragt zurück** statt selbst zu ändern.

## Austausch: Report nach jeder Bausession
Claude Code schreibt eine Report-Datei ins Repo: `.docs/reports/report_<modul>_<JJJJ-MM-TT>.md`.
Owner lädt diese eine Datei bei Konzept-Claude hoch → der zieht die Spec nach (Historie).

Inhalt — vier Punkte, kurz:

```
## Gebaut          — echte Tabellen/Felder/Migrationen/UI (konkret, keine Floskeln)
## Abweichungen    — wo Code ≠ Spec, und warum
## Offen           — was die Spec verlangt, aber noch fehlt
## Rückfragen      — wo eine Entscheidung von uns nötig ist
```

So bleibt der Austausch einfach: 1 Datei, 1 Upload, 4 Punkte. Die dauerhafte Chronik lebt in
den `*_000_konzept`-Änderungshistorien — der Report ist nur die Session-Übergabe.
