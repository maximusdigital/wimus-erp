# Auftrag Claude Code: Spec festschreiben + Bau-Chronik nachtragen

1. **Spec festschreiben** nach unserer Konvention (siehe `README.md` + `_PROMPT_spec-sync.md`):
   flaches Schema `004_ops_DDD_name.md`, Version nur in `*_000_konzept`, Decision-Log,
   Charts = shadcn-charts. Deine bisher gebaute Spec auf dieses Schema bringen.

2. **Bau-Chronik nachtragen** in die Änderungshistorie von `004_ops_000_konzept.md`:
   Trage rückwirkend ein, **wann welche Funktion gebaut** wurde — Datum/Uhrzeit aus der echten
   Git-Commit-Historie ablesen (nicht schätzen). Format, neueste oben:

   ```
   | Datum/Zeit | Vorgang | Betroffen |
   |------------|---------|-----------|
   | JJJJ-MM-TT HH:MM | <gebaute Funktion, ≤100 Zeichen> | <Tabelle/Datei> |
   ```

   Eine Zeile je gebauter Funktion/Tabelle/Migration. Quelle = `git log` (echte Zeitstempel).

3. **Danach: ein kurzer Stand-Report** `.docs/reports/report_004-ops_<JJJJ-MM-TT>.md`,
   vier Punkte: Gebaut (echte Tabellen/Felder) / Abweichungen / Offen / Rückfragen.

Nichts blind überschreiben, Git-Sicherung vorab.
