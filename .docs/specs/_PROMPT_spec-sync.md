# Uni-Prompt: Vollständiger Abgleich Spec ↔ Code ↔ Word-Bestand (WIMUS ERP)

> Wiederverwendbarer Auftrag für Claude Code. Drei-Wege-Abgleich:
> 1) Markdown-Specs unter `.docs/specs/` (flaches Schema),
> 2) tatsächlicher Stand von Code/Migrationen/Tests/Live-Schema,
> 3) Word-/Txt-Bestandsdokumente unter `.docs/specs/ALT/word/` (Quelle, aus der migriert wird;
>    Pfad ggf. an die reale Ablage anpassen).
> Ziel: ALLE Diskrepanzen zwischen den drei Quellen finden.
> WICHTIG: erst melden, dann auf Freigabe ändern — nichts blind überschreiben.

## Aufgabe

Prüfe für jedes Modul, ob Spec und Repository übereinstimmen. Specs liegen flach in
`.docs/specs/` als `MMM_kuerzel_DDD_name.md` (z.B. `001_erp_200_datenmodell.md`); ein Modul
= alle Dateien mit gleichem `MMM_kuerzel`-Präfix. Arbeite Modul für Modul (aktuell: `001_erp`, `002_fibu`, `003_crm`, `004_ops`).

## Vorgehen je Modul

0. **ZUERST sichern (vor JEDER Änderung):**
   - `git status` prüfen. Uncommittete Änderungen → erst committen oder stashen, damit der
     Arbeitsstand sauber ist.
   - Sicherungspunkt anlegen: entweder einen Commit „chore: Sicherung vor Spec-Sync
     <Datum>" oder einen Branch `spec-sync/<Datum>`. So ist der Stand VOR dem Abgleich
     jederzeit über `git restore`/`git checkout` wiederherstellbar.
   - Erst wenn der Sicherungspunkt steht, mit Schritt 1 fortfahren. Bei unklarem Git-Status
     NICHT weitermachen, sondern mich fragen.
1. **Lies zuerst die `*_000_konzept`-Datei** (Stand, Decision-Log, offene Punkte, Version) und
   danach die Detail-Dateien (`10`–`60`).
2. **Gleiche gegen die Realität ab:**
   - `*_200_datenmodell` ↔ tatsächliche Migrationen (`supabase/migrations/*.sql`) und
     das Live-Schema `wimus`.
   - `*_100_architektur` / `*_300_prozesse` ↔ tatsächlicher Code (`lib/**`, `app/**`,
     API-Routen, n8n-Flows soweit referenziert).
   - `*_400_design` ↔ tatsächliche UI/Komponenten (RowActions, Inline-Edit, Cockpits).
   - `*_500_migration` ↔ vorhandene Migrationsdateien + Reihenfolge (falls vorhanden).
   - `*_600_tests` ↔ vorhandene Tests + letzter grüner Lauf (`npm run test:run`).
2b. **Gleiche zusätzlich gegen den Word-Bestand ab** (`.docs/specs/ALT/word/`):
   - Prüfe je Modul, ob es im Word-Bestand Inhalte gibt (Tabellen, Felder, Prozesse, Regeln,
     Phasen), die WEDER in der Spec NOCH im Code angekommen sind. Das deckt nicht-migrierte
     Bestandsanforderungen auf.
   - Besonders bei Migrationen: vergleiche `supabase/migrations/*.sql` mit den
     SQL-Bestandsdateien (`*_Migration_*_sql.txt`) — welche Tabellen/Views/Funktionen aus dem
     Bestand sind gebaut, welche fehlen, welche weichen ab.
3. **Erstelle einen Abgleich-Bericht** (NICHT sofort ändern) mit drei Kategorien je Fund:
   - **A) Code ist weiter als Spec** → Spec nachziehen (Code = Wahrheit). Beispiel: neue
     Tabelle/Funktion gebaut, steht nicht in der Spec.
   - **B) Spec ist weiter als Code** → Code fehlt noch (Spec = Wahrheit). Beispiel:
     Konvention/Anforderung in der Spec, im Code nicht umgesetzt.
   - **C) Widerspruch** → Spec und Code sagen Unterschiedliches, keine Richtung offensichtlich.
     Hier KEINE Änderung, sondern mir die Entscheidung vorlegen.
   - **D) Nur im Word-Bestand** → Inhalt existiert im Word-Bestand, aber weder in Spec noch
     Code. Nicht-migrierte Anforderung. NICHT automatisch übernehmen — als Liste vorlegen
     („gehört das ins ERP? in welches Modul?"), ich entscheide pro Punkt.

## Regeln (verbindlich)

- **Nichts blind überschreiben.** Erst den Bericht zeigen, dann auf meine Freigabe handeln.
- **Spec-Dateinamen sind stabil** (Schema `MMM_kuerzel_DDD_name.md`). Keine neuen Nummern,
  kein Umbenennen, keine Datums-/Versionssuffixe im Dateinamen.
- **Version lebt NUR in der `*_000_konzept`-Datei** (Frontmatter + Meilenstein-Tabelle). Andere Dateien
  tragen nur `gehoert_zu` + `geaendert`. Beim Nachziehen einer Detail-Datei nur `geaendert`
  aktualisieren, NICHT die Modulversion.
- **Decision-Log nur ergänzen, nie löschen.** Jede beim Bauen getroffene Implementierungs-
  Entscheidung als datierte Zeile ergänzen (Grund nennen).
- **Änderungshistorie pflegen.** Jede inhaltliche Spec-Änderung zusätzlich als Zeile in den
  Abschnitt „Änderungshistorie" der `*_000_konzept`-Datei eintragen (Datum/Uhrzeit, Vorgang
  ≤ 100 Zeichen, betroffene Doku; neueste oben). Keine Datenmodell-/Inhaltsänderung ohne
  Konzept-Nachtrag.
- **Querschnitt-Konventionen** (UI, Datenintegrität) stehen ausführlich im Kern
  (`001_erp_400_design.md`, `001_erp_200_datenmodell.md`). Module führen nur ihre Spezifika als
  Abschnitt in ihren eigenen `40`/`20` und verweisen auf den Kern. Beim Nachziehen diese
  Trennung wahren.
- **Kategorie A (Spec nachziehen):** Spec-Datei so editieren, dass sie den realen Code
  beschreibt; Stand in der `*_000_konzept`-Datei (Steht/In Arbeit) und ggf. Decision-Log aktualisieren.
- **Kategorie B (Code fehlt):** NICHT einfach die Spec löschen. Als offenen Punkt / „In Arbeit"
  vermerken und mir vorlegen, ob gebaut oder Spec angepasst werden soll.
- **Meilenstein:** Wenn ein zusammenhängender Stand fertig + getestet ist, schlage einen
  Versionssprung in der `*_000_konzept`-Datei vor (Minor = Ergänzung, Major = Umbau) mit Changelog-Zeile.
- **KEIN Commit ohne grüne Tests.** Vor jedem Commit (auch dem Sicherungs-Commit, falls er
  Code berührt): `npm run test:run` UND `npm run build` müssen grün sein. Bei Rot: NICHT
  committen, sondern Fehler melden und mir vorlegen. Wenn eine A-Änderung (Spec folgt Code)
  Code berührt hat, der die Tests bricht, ist das ein Befund, kein Commit-Hindernis zum
  Wegklicken. Reine Spec-/Markdown-Änderungen ohne Code-Wirkung: Tests trotzdem laufen
  lassen, um sicherzugehen, dass nichts mitgerissen wurde.

## Ausgabe

1. Pro Modul: Tabelle mit Funden (Datei | Kategorie A/B/C | kurze Beschreibung).
2. Konkreter Änderungsvorschlag je A-Fund (welche Spec-Datei, was wird ergänzt).
3. Liste der B-, C- und D-Funde als Entscheidungsfragen an mich (D = nicht-migrierte
   Word-Bestandsinhalte, pro Punkt: ins ERP übernehmen? welches Modul?).
4. Erst nach meiner Freigabe: Spec-Dateien editieren → **`npm run test:run` + `npm run build`
   ausführen → nur bei GRÜN committen** (`git add .docs/specs`, sprechende Message) — als
   EIGENER Commit, getrennt vom Sicherungspunkt aus Schritt 0. Bei rotem Lauf: nicht
   committen, Fehler melden. C-Funde bleiben bis zur Klärung unangetastet. So bleibt der
   Vor-Abgleich-Stand jederzeit wiederherstellbar.
