# Auftrag: Org Phase B0 — Seed-Korrektur projekte (harmloser Schreibschritt) (2026-06-29 18:10 MESZ)

**ERSTER DATEN-SCHREIBENDER SCHRITT von #21 Phase B.** B0 fasst BEWUSST KEINE Bestandsdaten
(objekte/einheiten/mietvertraege/buchungen) an — nur die neue projekte/firmen-Stammdatenwelt. Damit
ist es der risikoärmste Einstieg. Trotzdem gelten alle Leitplanken.

## FREIGABE-VORAUSSETZUNGEN — VOR JEDEM SCHREIBEN (Stopp-Bedingungen)
**Migration NUR anwenden, wenn (a) Max das DB-Backup bestätigt hat UND (b) Max die firmen.typ-Werte
(s.u.) freigegeben hat.** Ist eines davon offen: Migration NUR SCHREIBEN (Datei anlegen) +
exakte SQL im Report zeigen, NICHT anwenden, auf Freigabe warten. Das ist der /pg/query-Guardrail:
exakte SQL zeigen → explizite Freigabe → erst dann ausführen.

## Kontext
Spec: `.docs/specs/021_org_migration_000_phase_b.md` (v0.4.0), Abschnitt „Teilschritt B0".
Vorlauf-Fakten (`.docs/_NOTE_org-phase-b-vorlauf.md`, Report 1745):
- projekte: 7 (5 ebene-0, 2 ebene-1), **marke 0/7 befüllt** → Drop unkritisch.
- firmen: 3 (MMP/WIM/VVG), **typ überall NULL**.
- pfad: überall NULL.
- ALFA DEVELOPMENT war nur ein DISKUSSIONS-Beispiel → **NICHT anlegen**, keine MFHSO/ABHS21A-Umhängung.

## Was B0 tut (NUR diese, nichts an Bestandsdaten)

### 1. projekte.marke-Spalte droppen
- 0/7 befüllt (Vorlauf) → kein Inhalt zu sichern. `ALTER TABLE wimus.projekte DROP COLUMN IF EXISTS marke;`
- Vorher zur Sicherheit erneut prüfen, dass marke wirklich leer ist (SELECT count(marke)). Falls
  wider Erwarten >0: STOPP + Report (nicht droppen).

### 2. firmen.typ setzen (Stammdaten, kein Bestandsdatensatz)
- Alle 3 firmen haben typ NULL. **VORSCHLAG (Max bestätigt vor Anwendung):**
  - MMP (Maxim Moser) → `privat`
  - WIM (WIMUS GmbH) → `operativ`
  - VVG (WIMUS vvGmbH) → `vvGmbH`
- CHECK erlaubt: privat/operativ/vvGmbH/GbR/holding/sonstige ✓.
- Per gezieltem UPDATE je firma (über kuerzel ODER id — id aus DB ziehen, nicht hardcoden).
- **Diese Werte sind ein VORSCHLAG — im Report explizit zur Bestätigung vorlegen, NICHT ungefragt
  anwenden, solange Max sie nicht freigegeben hat.**

> **pfad ist NICHT Teil von B0** (ins Backlog #23 verschoben). Das Feld bleibt vorerst NULL; es wird
> gefüllt, wenn die Hierarchie-Auswertung/Drill-down (B5) gebaut wird und die Pfad-Konvention
> feststeht. JETZT nicht spekulativ füllen.

## NICHT in B0
- KEINE objekte/einheiten-Spalten, KEIN firma_id/projekt_id-Backfill (das ist B2, eigener Auftrag
  mit Max-Gegenprüfung der Einheiten).
- KEINE RLS-Änderung. KEIN Drop von mandant/gesellschaft.
- ALFA DEVELOPMENT NICHT anlegen.

## Migration schreiben
- Datei: `supabase/migrations/‹nächste_freie_nr›_org_phase_b0.sql` (höchste vorhandene Nummer real
  prüfen, +1). Idempotent (IF EXISTS / IF NOT EXISTS / UPDATE nur wo NULL).
- Header-Kommentar: Zweck, #21 Phase B0, „fasst keine Bestandsdaten an", Quelle Vorlauf-NOTE.
- Kein force, sequenziell.

## Anwenden (nur nach Doppel-Freigabe Backup + typ-Werte)
- Über /pg/query, exakte SQL vorher im Report/Chat zeigen. Nach Anwendung verifizieren:
  - `SELECT count(*) FROM information_schema.columns WHERE table_schema='wimus' AND table_name='projekte' AND column_name='marke';` → 0
  - `SELECT kuerzel, typ FROM wimus.firmen ORDER BY kuerzel;` → MMP/WIM/VVG mit gesetzten typ
- Falls Backup/Freigabe NICHT vorliegt: NUR Datei + SQL liefern, NICHT anwenden.

## Tests / Review / Commit (euer Zyklus)
- `npm run test:run` + `npm run build` grün (B0 ist Schema-only, aber Build muss grün bleiben).
- Review-Subagent: diff gegen Spec B0 + Konventionen (idempotent, kein Bestandsdaten-Zugriff,
  kein Secret, kein ALFA DEVELOPMENT).
- Commit erst nach grün + (falls angewandt) erfolgreicher Verifikation. Sonst Datei committen mit
  klarer Report-Notiz „noch nicht angewandt, wartet auf Backup/typ-Freigabe".

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_org-phase-b0.md` (4 Abschnitte). Wichtig:
- Was gebaut/angewandt vs. nur geschrieben (Backup-/Freigabe-Status).
- firmen.typ-Werte zur Bestätigung (Abschnitt Rückfragen), falls noch nicht freigegeben.
- Verifikations-Ergebnisse (falls angewandt).

## Leitplanken (immer)
- Bei Unsicherheit STOPP + parken (Questions). Nichts raten.
- Specs/Backlog NICHT ändern (Konzept-Claude-Hoheit).
- Migration NIE Fast-Path. Idempotent. Kein force-push.
