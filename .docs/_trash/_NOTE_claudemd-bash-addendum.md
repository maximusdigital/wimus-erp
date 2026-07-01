# Zusatz für CLAUDE.md — Dateien/Bash sauber schreiben (löst Permission-Sperre)

> In die bestehende `CLAUDE.md` einfügen (z.B. unter einem Abschnitt „Bash-Konventionen").
> Zweck: die Sperre „Compound command contains cd with output redirection — manual approval
> required to prevent path resolution bypass" gar nicht erst auslösen.

## Bash: keine `cd && Umleitung`-Kombination

Auslöser der Sperre ist die **Kombination** aus Verzeichniswechsel und Ausgabe-Umleitung in
EINEM Befehl. Beides getrennt halten:

- **Nie:** `cd /pfad && befehl > datei.txt` · `cd /pfad && cat > datei << 'EOF'` ·
  `cd /pfad && echo "..." >> datei`
- **Stattdessen absolute/relative Pfade direkt in der Umleitung**, ohne `cd`-Vorspann:
  - `befehl > /pfad/datei.txt`
  - `cat > /pfad/datei.md << 'EOF'`
  - `echo "..." >> /pfad/datei`
- Wenn ein Arbeitsverzeichnis nötig ist: Pfade einfach voll ausschreiben statt `cd`. Oder den
  Verzeichniswechsel als EIGENEN Befehl (eigener Tool-Call) ohne Umleitung.

## Dateien bevorzugt über die nativen Tools schreiben

Zum Erstellen/Ändern von Dateien die **Datei-Tools** (Write/Edit) nutzen, nicht Bash-Umleitung.
Bash-Heredocs/`>`/`tee` nur, wenn es wirklich um Befehls-Output geht — dann mit vollem Pfad
(s.o.), nie mit `cd` davor.

## Hintergrund (kurz)
Die Sperre schützt davor, dass `cd` + Umleitung den Zielpfad anders auflösen als beabsichtigt
(Path-Resolution-Bypass). `allow`-Regeln in settings.json heben sie nicht zuverlässig auf
(bekannte Claude-Code-Bugs bei dateiverändernden Befehlen). Ursache vermeiden ist robuster als
Sperre genehmigen.
