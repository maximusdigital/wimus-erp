# Auftrag: Phase-B Lese-Vorlauf — offene Punkte real auszählen (#21) (2026-06-29 17:30 MESZ)

**REINER LESE-/ANALYSE-AUFTRAG. Ausschließlich SELECT. KEIN CREATE/ALTER/DROP/INSERT/UPDATE/DELETE.**
Ziel: die offenen Design-Punkte der Phase-B-Spec (`.docs/specs/021_org_migration_000_phase_b.md`,
v0.3.2) mit ECHTEN Zahlen aus der Live-DB beantworten, damit die folgenden Schreibschritte (B0–B3)
faktenbasiert statt geraten sind. Du baust NICHTS und änderst KEIN Schema.

## Hintergrund
#21 = mandant→firma/projekt-Migration. Phase A (Migration 004) ist erledigt. Phase B steht an,
ist aber NOCH NICHT freigegeben — vorher müssen 3 offene Punkte real geklärt werden. Das ist
dieser Auftrag. Lies zuerst die Spec 021 (Abschnitte „Offene Punkte" + „Backfill-Logik" +
„Attribut-Modell"), damit du den Kontext der Abfragen verstehst.

## Weg
Über `POST https://supa.m81s.de/pg/query` (Service-Role). **Alle Abfragen sind SELECT — kein
Bestätigungs-Guardrail nötig (der gilt nur für Schreibzugriffe). Falls irgendeine Abfrage etwas
anderes als SELECT wäre: STOPP + im Report parken.**

## Zu klären (mit echten Zahlen)

### A) Offener Punkt #5 — wie viele DISTINCT Firmen ergeben die 4 Mandanten?
Das bestimmt, wie viele firmen B1 anlegt (mandant→firma ist evtl. n:1, z.B. AA+Campus = 1 Firma).
- Alle Mandanten listen: `SELECT id, name, kuerzel FROM wimus.mandanten ORDER BY name;`
- Falls es eine bestehende Verknüpfung mandant↔gesellschaft gibt, diese zeigen:
  `SELECT g.id, g.name, g.kuerzel, g.typ, g.mandant_id FROM wimus.gesellschaften g ORDER BY g.mandant_id;`
- Einschätzung ableiten (NICHT raten, nur aus Daten): Wie viele reale juristische Personen /
  Firmen stecken hinter den 4 Mandanten? Tabelle mandant → (vermutete) Firma, mit Begründung aus
  den Namen/Gesellschaften. Wenn nicht eindeutig aus Daten ableitbar → als offene Frage im Report
  vermerken (Max entscheidet).

### B) Offener Punkt #1 — versteuerungsart-Werte real auszählen
Bestimmt das Feld-Mapping gesellschaften.versteuerungsart → firmen.besteuerungsart/umsatzsteuer_typ.
- `SELECT versteuerungsart, count(*) FROM wimus.gesellschaften GROUP BY versteuerungsart;`
- Alle DISTINCT-Werte auflisten. Dann VORSCHLAG für das Mapping auf firmen-Felder
  (besteuerungsart ∈ bilanz/euer/ueberschuss; umsatzsteuer_typ ∈ regelbesteuerung/kleinunternehmer/
  istversteuerung/sollversteuerung) — als Tabelle, NICHT anwenden, nur vorschlagen.

### C) Offener Punkt #7 — ist projekte.marke befüllt?
Bestimmt, ob der Spalten-Drop unkritisch ist oder Inhalt gesichert werden muss.
- `SELECT count(*) total, count(marke) mit_marke FROM wimus.projekte;`
- Falls befüllt: `SELECT id, kuerzel, name, marke FROM wimus.projekte WHERE marke IS NOT NULL;`
  → zeigen, ob marke-Inhalt schon in name/kuerzel steckt (dann Drop unkritisch) oder eigene Info.

### D) Bestandszahlen — Umfang der Migration real beziffern
Damit der Schreib-Umfang bekannt ist, bevor wir schreiben. Je Tabelle count(*) UND count der
relevanten FK-Spalte:
- `wimus.objekte`: count total, count(mandant_id), count(gesellschaft_id), count(projekt_id falls
  Spalte existiert), count(firma_id falls existiert)
- `wimus.gesellschaften`: count
- Tabellen mit gesellschaft_id: finanzierungen, veraeusserungen, reinvestitionsruecklagen,
  intercompany — je count total + count(gesellschaft_id)
- `wimus.projekte`: count total + count je ebene (`GROUP BY ebene`) + Liste der ebene-0-Projekte
  (id, kuerzel, name, firma_id) — um den B0-Seed-Fix (ALFA DEVELOPMENT) zu planen
- `wimus.firmen`: count + Liste (id, kuerzel, name, typ) — was ist schon da?
- `wimus.workspaces`: count + die eine workspace_id (für B1 gebraucht)

### E) B0-Vorbereitung — projekte-Ist real zeigen
- Alle ebene-0 und ebene-1 Projekte mit parent_projekt_id, damit klar ist, ob MFHSO/ABHS21A wirklich
  fälschlich auf Top-Level liegen und ALFA DEVELOPMENT fehlt:
  `SELECT id, kuerzel, name, typ, ebene, parent_projekt_id, firma_id, pfad FROM wimus.projekte ORDER BY ebene, name;`

## Output
- Eine Notiz-Datei: `.docs/_NOTE_org-phase-b-vorlauf.md` (via filesystem write_file). Roh-Ergebnisse
  je Abschnitt A–E klar beschriftet, plus pro Abschnitt eine kurze Klartext-Einschätzung
  („daraus folgt: …"). KEINE Interpretation erzwingen wo Daten nicht reichen — dann „unklar, Frage
  an Max".
- KEIN Schema-Wissen raten: nur zeigen, was die DB real liefert.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_org-phase-b-vorlauf.md` (4 Abschnitte). Abschnitt 4
(Rückfragen) ist hier der WICHTIGSTE — bündele die Entscheidungen, die Max vor B0 treffen muss:
- Wie viele Firmen real? mandant→firma-Mapping bestätigen.
- versteuerungsart→besteuerungsart-Mapping bestätigen.
- marke-Drop unkritisch ja/nein.
- Irgendwelche Überraschungen (unerwartete NULLs, mehr/weniger Daten als gedacht, projekt-Welt
  anders als die Spec annimmt).

## NICHT tun
- KEIN Schema-/Datenänderung jeglicher Art. Nur SELECT.
- Migration B0/B1/B2 NICHT schreiben/anwenden — das kommt in separaten Aufträgen NACH diesem
  Vorlauf + nach Backup-Freigabe durch Max.
- Spec 021 / Backlog NICHT ändern (Konzept-Claude-Hoheit).
- Bei Unsicherheit oder wenn eine Abfrage Schreibzugriff bräuchte: STOPP + im Report parken.
