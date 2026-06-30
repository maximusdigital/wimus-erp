# Report: Org Phase-B Lese-Vorlauf — offene Punkte real ausgezählt (#21) — 2026-06-29 17:45 MESZ

Auftrag: `.docs/prompts/20260629_1730_prompt_org-phase-b-lesevorlauf.md`. **Reiner Lese-/Analyse-
Auftrag, ausschließlich SELECT** über `/pg/query`. Kein Schema-/Datenänderung. Output:
`.docs/_NOTE_org-phase-b-vorlauf.md` (Roh-Ergebnisse A–E + Nachtrag D2).

## 1) Ergebnis je Abschnitt (echte Zahlen)

| # | Frage | Befund |
|---|-------|--------|
| A/#5 | DISTINCT Firmen aus Mandanten | `gesellschaften` **leer (0)**; firmen (3) + projekte (7) **schon geseedet** → Map aus projekte-Seed |
| B/#1 | versteuerungsart-Werte | **keine** (gesellschaften leer) → Mapping derzeit gegenstandslos |
| C/#7 | projekte.marke befüllt? | **0 von 7** befüllt → **Drop unkritisch** |
| D | Bestandszahlen | objekte 10 · firmen 3 · workspaces 1 · projekte 7 (ebene-0: 5, ebene-1: 2); **alle gesellschaft_id-Tabellen leer** |
| E/B0 | projekte-Ist | ALFA DEVELOPMENT fehlt als Top-Projekt; MFHSO + ABHS21A auf ebene 0 — **Spec-Annahme bestätigt** |

### Reale Org-Objekte (Live-Seed)
- **Workspace (1):** `WG` „WIMUS Gruppe" (`19277469-7ba2-41ac-bf3d-cca1d94a6d31`) → das NOT-NULL-Ziel für B1.
- **firmen (3, bereits da):** `MMP` Maxim Moser (privat) `a…001` · `WIM` WIMUS GmbH `a…002` ·
  `VVG` WIMUS vvGmbH `a…003`. **`typ` bei allen NULL** (CHECK erlaubt NULL, aber fachlich offen).
- **projekte ebene-0 (5):** AAP ALFA APARTMENTS (kzv, firma VVG) · ACA ALFA CAMPUS (wg, firma VVG) ·
  WHV WIMUS Hausverwaltung (hausverwaltung, firma WIM) · MFHSO MFH Stuttgart-Ost (bauprojekt, firma WIM) ·
  ABHS21A Ankauf BHS21A (ankauf, firma MMP).
- **projekte ebene-1 (2):** AAP-TOUR (Touristen/KZV) + AAP-MONT (Monteure) unter AAP (firma VVG). `pfad` überall NULL.

### Mandanten (4) → objekte
APART 3 · CAMPUS 1 · WIMUS 6 · **DEV 0** (Summe 10). Alle objekte haben `mandant_id`,
**`gesellschaft_id` bei 0 von 10** gesetzt.

## 2) Abweichungen (Spec-Annahme ↔ Live-Realität)

- **`gesellschaften` ist LEER (0 Zeilen)** — die Spec-Annahme „jede gesellschaft → eine firma"
  (B1b) hat **keine Quelldaten**. Die firmen sind stattdessen **bereits direkt geseedet** (3 Stück).
  → B1 ist KEINE Datenmigration aus gesellschaften, sondern höchstens: bestätigen, dass die 3
  geseedeten firmen die Ziel-Firmen sind. Der gesellschaft→firma-Backfill entfällt faktisch.
- **Alle gesellschaft_id-verdrahteten Tabellen sind leer:** finanzierungen 0, veraeusserungen 0,
  reinvestitionsruecklagen 0, intercompany 0 (leistende_/empfangende_gesellschaft_id je 0).
  objekte.gesellschaft_id 0/10. → Der „gesellschaft_id → firma_id durchgehend"-Schritt (B1c) ist
  auf Live ein **No-Op** (nichts zu backfillen).
- **B0-Seed-Inkonsistenz bestätigt:** ALFA DEVELOPMENT existiert NICHT als Top-Projekt; seine
  Vorhaben MFHSO + ABHS21A liegen auf ebene 0 — exakt wie die Spec vermutet.

## 3) Offen (nicht Teil dieses Lese-Auftrags)

- B0/B1/B2-Migrationen NICHT geschrieben/angewandt (kommen in separaten Aufträgen nach Backup-Freigabe).
- DB-Backup vor Phase B (#4) = Max' Vorbedingung, hier nicht prüfbar.
- B4/B5 (Projekt-Bankkonten, projekt_id an FiBu, Filter/Auswertung) unberührt.

## 4) Rückfragen — Entscheidungen für Max VOR B0 (wichtigster Teil)

1. **mandant→firma/projekt-Map (aus projekte-Seed ableitbar, NICHT aus gesellschaften):**
   | Mandant | objekte | → Projekt (ebene-0) | → Firma |
   |---------|---------|---------------------|---------|
   | ALFA APARTMENTS (APART) | 3 | AAP | **VVG** (vvGmbH) |
   | ALFA CAMPUS (CAMPUS) | 1 | ACA | **VVG** (vvGmbH) |
   | WIMUS Hausverwaltung (WIMUS) | 6 | WHV | **WIM** (WIMUS GmbH) |
   | ALFA DEVELOPMENT (DEV) | 0 | (kein Top-Projekt) | — |
   → **Bestätigt Spec-Hypothese #5: AA + Campus = DIESELBE Firma (VVG).** DISTINCT Firmen hinter den
   Mandanten MIT Objekten = **2** (VVG, WIM). **Bitte bestätigen**, dass diese Map (objekte → AAP/ACA/WHV
   bzw. firma VVG/WIM) für den B2-Backfill der 10 Objekte gilt.

2. **DEV ist mehrdeutig:** Mandant DEV hat 0 Objekte und kein Top-Projekt; seine Vorhaben hängen an
   ZWEI verschiedenen Firmen (MFHSO → WIM `a…002`, ABHS21A → MMP `a…001`). → Wenn B0 „ALFA DEVELOPMENT"
   als Top-Projekt anlegt: **welche firma_id** bekommt es (WIM? MMP? oder bleibt DEV ein firmen-
   übergreifender Akquise-Funnel ohne eigene Firma)? **Max entscheidet** — nicht aus Daten ableitbar.

3. **versteuerungsart→besteuerungsart-Mapping (#1):** gegenstandslos — gesellschaften leer, keine
   Werte. firmen.besteuerungsart/umsatzsteuer_typ sind direkt zu pflegen (Max), kein Backfill möglich.
   Auch **firmen.typ ist überall NULL** — soll B0/B1 typ setzen (MMP=privat, WIM=operativ/GmbH,
   VVG=vvGmbH)? (Bitte Werte bestätigen.)

4. **projekte.marke (#7):** 0/7 befüllt → **Drop in B unkritisch** (kein Inhalt zu sichern). Bestätigt.

5. **Überraschungen:** Die Migration ist VIEL kleiner als die Spec annimmt — es gibt keine Alt-
   Datenmasse in gesellschaften/finanz-Tabellen. Real zu backfillen sind im Kern **nur 10 objekte**
   (firma_id + projekt_id aus mandant). Die „anspruchsvollste Datenmigration" reduziert sich auf
   Seed-Korrektur (B0) + 10-Zeilen-Backfill (B2) + leere FK-Umstellung (B1c No-Op). **Bitte prüfen,
   ob das mit Max' Erwartung übereinstimmt** (oder ob produktive Alt-Daten woanders liegen, die hier
   nicht im wimus-Schema sind).

---
*Read-only; keine Tests/Build/Review (kein App-Code). Verifikation = direkte Live-SELECTs (NOTE).*
