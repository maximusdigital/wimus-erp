# Auftrag Claude Code: Belegungs-Engine + Beds24-Block (Kern 0001)

Zentrale Verfügbarkeitsprüfung über alle Belegungsquellen + ausgehender Beds24-Block.
Prozess: Git-Sicherung, gegen realen Kern-Stand bauen, Tests grün, Report danach.
Autonomie-Modus (durcharbeiten, Blocker parken) + Report-Pflicht gelten (s. CLAUDE.md).

## Architektur-Entscheidung (fix)

- **ERP = Single Source of Truth für Belegung.** Beds24 ist nur Vertriebskanal und wird vom ERP
  geblockt. NICHT umgekehrt (ERP fragt nicht Beds24 nach Verfügbarkeit).
- Belegung ist **quellenübergreifend** — eine Einheit ist belegt durch:
  1. `buchungen` (KZV, ex buchungen_kzv)
  2. `mietvertraege` (regulär: LZV/WG/Gewerbe)
  3. **neu** `belegung_sperren` (manuell: renovierung/eigennutzung/leerstand_gewollt)

## 1. Datenmodell — neue Tabelle `belegung_sperren`

mandant_id FK (RLS), einheit_id FK, von DATE, bis DATE (NULL = offen/unbefristet),
grund ENUM (renovierung/eigennutzung/leerstand_gewollt/sonstiges), notiz TEXT,
beds24_geblockt BOOL (ob nach Beds24 gespiegelt), created_at/updated_at, created_by_akteur_id.
RLS mandant_isolation, idempotente Migration.

## 2. Belegungs-Engine — `lib/belegung/verfuegbarkeit.ts`

Kernfunktion: `istVerfuegbar(einheit_id, von, bis, { ausser?: {typ, id} })` → prüft Overlap
gegen ALLE drei Quellen. Rückgabe: frei | Liste der Kollisionen (Quelle/Typ/Zeitraum/Referenz).
- **Overlap-Logik:** [von1,bis1] überlappt [von2,bis2] wenn `von1 < bis2 AND von2 < bis1`
  (Halboffene Intervalle; Check-out-Tag = frei für Check-in). Bei MV mit offenem Ende (bis=NULL)
  → läuft unbegrenzt.
- `ausser` für Bearbeiten (eigenen Eintrag aus der Prüfung ausnehmen).
- Reine Funktion, testbar (Unit-Tests Pflicht: kein Overlap, Rand-Tag, offenes Ende,
  Multi-Quellen-Kollision).

## 3. Vorab-Check beim Anlegen (KZV-Buchung UND regulärer MV)

Vor dem Speichern einer Buchung/eines MV: `istVerfuegbar` aufrufen.
- **Kollision → WARNEN** (kein Hard-Block): UI zeigt Kollision(en) + Quelle, Mensch entscheidet
  „trotzdem anlegen" oder abbrechen. (Bewusst weich: Sonderfälle existieren.)
- Gilt für beide Anlege-Flows: `/buchungen` (KZV) und `/vertraege` (regulär).

## 4. Beds24-Block (ausgehend, synchron) — NEU

Beim Bestätigen einer ERP-Belegung (Buchung/MV/Sperre), die eine Beds24-gekoppelte Einheit
betrifft: Einheit für [von,bis] in Beds24 **synchron blocken** (direkter API-Call).
- Nutzt vorhandene `lib/integrations/beds24.ts` (Beds24 API V2). **Prüfen/im Report melden:**
  exakter Endpoint/Methode zum Kalender-Blocken (Availability/Inventory setzen) — falls unklar,
  als Rückfrage parken, NICHT raten.
- Mapping Einheit → Beds24 roomId/propId: prüfen wie real hinterlegt (Feld an `einheiten`?).
  Falls Mapping fehlt → Rückfrage.
- Fehlerfall (Beds24-API down): ERP-Belegung trotzdem speichern, Block als „offen" markieren
  (`beds24_geblockt=false`), später retry (n8n). NIE die ERP-Speicherung am Beds24-Call scheitern lassen.

## 5. UI

- Anlege-Dialoge (Buchung/MV): Verfügbarkeits-Hinweis inline bei Datumswahl (frei/Kollision).
- Neue Sperren-Verwaltung `/einheiten/[id]` oder `/belegung`: Sperreinträge CRUD (RowActions-Pattern).
- Optional Belegungs-Kalender je Einheit (alle 3 Quellen farblich) — falls Zeit, sonst parken.

## Offen / Rückfragen (im Report sammeln)
- Beds24 V2: korrekter Calendar-Block-Endpoint + Einheit→roomId-Mapping.
- Bestehende Doppelbuchungs-Vermeidung im Beds24-Webhook (eingehend) — kollidiert nicht mit Block?
- Sollen bestehende offene MV/Buchungen rückwirkend nach Beds24 geblockt werden (Initial-Sync)?

## Pflicht
Decision-Log + Änderungshistorie in Kern-Konzept (001_erp_000_konzept), Datenmodell (200),
Prozesse (300). Migration idempotent. Tests grün. Report `.docs/reports/JJJJMMTT_UHRZEIT_grobangabe.md`.
