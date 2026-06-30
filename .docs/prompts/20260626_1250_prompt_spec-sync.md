# Uni-Prompt: Spec ↔ Code abgleichen (WIMUS ERP)

> Wiederverwendbarer Auftrag für Claude Code. Gleicht die Markdown-Specs unter
> `.docs/specs/` mit dem tatsächlichen Stand von Code, Migrationen und Tests ab.
> WICHTIG: erst melden, dann auf Freigabe ändern — nichts blind überschreiben.

## Aufgabe

Prüfe für jedes Modul unter `.docs/specs/<NNNN_modul>/`, ob Spec und Repository
übereinstimmen. Arbeite Modul für Modul (aktuell: `0001_erp-kern`, `0002_fibu`).

## Vorgehen je Modul

0. **ZUERST sichern (vor JEDER Änderung):**
   - `git status` prüfen. Uncommittete Änderungen → erst committen oder stashen, damit der
     Arbeitsstand sauber ist.
   - Sicherungspunkt anlegen: entweder einen Commit „chore: Sicherung vor Spec-Sync
     <Datum>" oder einen Branch `spec-sync/<Datum>`. So ist der Stand VOR dem Abgleich
     jederzeit über `git restore`/`git checkout` wiederherstellbar.
   - Erst wenn der Sicherungspunkt steht, mit Schritt 1 fortfahren. Bei unklarem Git-Status
     NICHT weitermachen, sondern mich fragen.
1. **Lies zuerst `00_konzept.md`** (Stand, Decision-Log, offene Punkte, Version) und
   danach die Detail-Dateien (`10`–`60`).
2. **Gleiche gegen die Realität ab:**
   - `20_datenmodell.md` ↔ tatsächliche Migrationen (`supabase/migrations/*.sql`) und
     das Live-Schema `wimus`.
   - `10_architektur.md` / `30_prozesse.md` ↔ tatsächlicher Code (`lib/**`, `app/**`,
     API-Routen, n8n-Flows soweit referenziert).
   - `40_design.md` ↔ tatsächliche UI/Komponenten (RowActions, Inline-Edit, Cockpits).
   - `50_migration.md` ↔ vorhandene Migrationsdateien + Reihenfolge.
   - `60_tests.md` ↔ vorhandene Tests + letzter grüner Lauf (`npm run test:run`).
3. **Erstelle einen Abgleich-Bericht** (NICHT sofort ändern) mit drei Kategorien je Fund:
   - **A) Code ist weiter als Spec** → Spec nachziehen (Code = Wahrheit). Beispiel: neue
     Tabelle/Funktion gebaut, steht nicht in der Spec.
   - **B) Spec ist weiter als Code** → Code fehlt noch (Spec = Wahrheit). Beispiel:
     Konvention/Anforderung in der Spec, im Code nicht umgesetzt.
   - **C) Widerspruch** → Spec und Code sagen Unterschiedliches, keine Richtung offensichtlich.
     Hier KEINE Änderung, sondern mir die Entscheidung vorlegen.

## Regeln (verbindlich)

- **Nichts blind überschreiben.** Erst den Bericht zeigen, dann auf meine Freigabe handeln.
- **Spec-Dateinamen sind stabil** (`00_konzept` … `60_tests`). Keine neuen Nummern, kein
  Umbenennen, keine Datums-/Versionssuffixe im Dateinamen.
- **Version lebt NUR in `00_konzept.md`** (Frontmatter + Meilenstein-Tabelle). Andere Dateien
  tragen nur `gehoert_zu` + `geaendert`. Beim Nachziehen einer Detail-Datei nur `geaendert`
  aktualisieren, NICHT die Modulversion.
- **Decision-Log nur ergänzen, nie löschen.** Jede beim Bauen getroffene Implementierungs-
  Entscheidung als datierte Zeile ergänzen (Grund nennen).
- **Querschnitt-Konventionen** (UI, Datenintegrität) stehen ausführlich im Kern
  (`0001/40_design.md`, `0001/20_datenmodell.md`). Module führen nur ihre Spezifika als
  Abschnitt in ihren eigenen `40`/`20` und verweisen auf den Kern. Beim Nachziehen diese
  Trennung wahren.
- **Kategorie A (Spec nachziehen):** Spec-Datei so editieren, dass sie den realen Code
  beschreibt; Stand in `00_konzept.md` (Steht/In Arbeit) und ggf. Decision-Log aktualisieren.
- **Kategorie B (Code fehlt):** NICHT einfach die Spec löschen. Als offenen Punkt / „In Arbeit"
  vermerken und mir vorlegen, ob gebaut oder Spec angepasst werden soll.
- **Meilenstein:** Wenn ein zusammenhängender Stand fertig + getestet ist, schlage einen
  Versionssprung in `00_konzept.md` vor (Minor = Ergänzung, Major = Umbau) mit Changelog-Zeile.
- **KEIN Commit ohne grüne Tests.** Vor jedem Commit (auch dem Sicherungs-Commit, falls er
  Code berührt): `npm run test:run` UND `npm run build` müssen grün sein. Bei Rot: NICHT
  committen, sondern Fehler melden und mir vorlegen. Wenn eine A-Änderung (Spec folgt Code)
  Code berührt hat, der die Tests bricht, ist das ein Befund, kein Commit-Hindernis zum
  Wegklicken. Reine Spec-/Markdown-Änderungen ohne Code-Wirkung: Tests trotzdem laufen
  lassen, um sicherzugehen, dass nichts mitgerissen wurde.

## Ausgabe

1. Pro Modul: Tabelle mit Funden (Datei | Kategorie A/B/C | kurze Beschreibung).
2. Konkreter Änderungsvorschlag je A-Fund (welche Spec-Datei, was wird ergänzt).
3. Liste der B- und C-Funde als Entscheidungsfragen an mich.
4. Erst nach meiner Freigabe: Spec-Dateien editieren → **`npm run test:run` + `npm run build`
   ausführen → nur bei GRÜN committen** (`git add .docs/specs`, sprechende Message) — als
   EIGENER Commit, getrennt vom Sicherungspunkt aus Schritt 0. Bei rotem Lauf: nicht
   committen, Fehler melden. C-Funde bleiben bis zur Klärung unangetastet. So bleibt der
   Vor-Abgleich-Stand jederzeit wiederherstellbar.
