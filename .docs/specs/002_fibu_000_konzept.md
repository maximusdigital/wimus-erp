---
id: 0002
titel: FiBu — Belegerkennung, Kontierung & Reporting
status: in_arbeit          # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.6.0             # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: fibu
erstellt: 2026-06-25
geaendert: 2026-06-27
abhaengt_von: [0001]
---

# 0002 — FiBu (Belegerkennung, Kontierung & Reporting)

## Worum geht's

Vollautomatisierte Verarbeitung **eingehender** Belege von der Erfassung bis zum
Buchungsstapel-Export, integriert ins WIMUS-ERP. KI bereitet vor (Erkennung, Extraktion,
Kontierungsvorschlag), Mensch gibt frei (Batch, Selbstkontierung), das System bucht,
ermittelt Ergebnisse und liefert die Datenbasis für TaxPool/ELSTER.

Das Modul baut auf der OCR-Pipeline des ERP-Kerns (0001, `002_fibu_300_prozesse.md` Kap. 5,
`ocr_verarbeitungen`) auf und erweitert sie um mandantenfähige SKR-Kontierung,
Mehrunternehmens-/Gesellschafterstruktur mit Ergebnisverteilung, Buchungsstapel-Export
und ein grafisches Finanz-/Bank-Cockpit.

Leitprinzip: **Suggest, not Autobook** — KI schlägt vor, Mensch bestätigt. Auto-Buchung
nur über definierte Confidence- und Betragsschwellen.

## Steht (gebaut & läuft)

> Stand 2026-06-26 (Details + Testzahlen in `002_fibu_600_tests.md`).

- OCR-Basis im Kern (Mistral OCR, Confidence-Strategie, `ocr_verarbeitungen`)
- **Stammdaten-Layer:** Migration `010_fibu_stammdaten.sql` eingespielt — Firmen-Erweiterung
  (rechtsform_typ/besteuerungsart/kontenrahmen_ref), `gesellschafter`, `beteiligungen`,
  `fibu_konten`, `kontierungsregeln`, `lieferanten`, je mit RLS mandant_isolation.
- **Stammdaten-UI** `/fibu/*`: CRUD für Gesellschafter (+ Beteiligungen mit Quote/Gültigkeit),
  Kontierungsregeln, Lieferanten, Kontenrahmen. Schema/RLS/Embeds live gegen wimus verifiziert.
- **Kernlogik (deterministisch, getestet):** Kontierung Regel-Lookup (`kontiere`),
  Ergebnisverteilung zeitanteilig (`ergebnisverteilung`), stabile `buchungsIdExtern`,
  Belegprüfung (`pruefeBeleg`: netto+USt≈brutto, USt-Satz, Datum, 1-Cent-Toleranz),
  IBAN-Prüfung (`ibanGueltig` mod-97), Gating (`gating`).
- **E-Rechnungs-Weiche:** `istErechnung`/`parseErechnung` (CII + UBL, ZUGFeRD/XRechnung),
  confidence 1.0, dependency-frei.
- **EXTF-Export (Kern):** `extfBuchungsstapel` (DATEV-Header 700/21, KOST1/KOST2, stabile ID,
  CRLF). Konsistenter, per Spaltennamen importierbarer Kern (volles 116-Spalten-Layout offen).
- **Belegerkennungs-Pipeline:** Mistral angebunden (`mistralOcr`/`mistralExtrahiere`);
  `verarbeiteBeleg` (E-Rechnungs-Weiche | OCR+KI → Validierung → Kontierung → Gating);
  Migration `011_fibu_belege.sql` (belege/buchungen/korrekturen, GoBD-Versionierung, hash +
  buchungs_id_extern UNIQUE); UI `/fibu/belege` (Upload → Pipeline → Freigabe-Cockpit).
- **Feststellungs-Vorschau:** firma + Periode → Ergebnisverteilung (zeitanteilig, Summenkontrolle).
- **GuV-Auswertung (2026-06-27):** `lib/fibu/guv.ts` (`aggregateGuV`, SKR03-Heuristik
  4xxx Aufwand / 8xxx Ertrag) + Seite `/fibu/auswertung` (Firma-/Zeitraum-Filter, Ertrag/
  Aufwand je Konto, Ergebnis, Balkenchart via **Recharts**) + Tests.
- **Gebrandeter A4-Druck (2026-06-27):** `/fibu/auswertung/druck` (PrintLayout + WIMUS-
  Briefkopf `components/fibu/report-kopf.tsx`) — GuV als druck-/PDF-fertige A4-Seite.
- **Reporting-/Konsolidierungs-Tabellen (Migration 015):** `feststellungen`,
  `auswertungs_scopes`, `objekt_tags`, `reporting_taxonomie` mit RLS angelegt.
  `ocr_verarbeitungen` als Kern-Tabelle gebaut (Migration 014).
- **Konsolidierte GuV (2026-06-27):** `/fibu/konsolidierung` — Scope-Selektor (mehrere
  Einheiten + Zeitraum), Matrix Konto × Einheit + Summe je Konto/Einheit + konsolidiertes
  Ergebnis, gebrandeter A4-Druck. Speicherbare Scope-Presets (`auswertungs_scopes`,
  `/api/fibu/auswertungs-scopes`). Logik `lib/fibu/konsolidierung.ts` (`konsolidiereGuV`) +
  Tests. Innenumsatz-Eliminierung noch offen.
- **Objekt-Tags (2026-06-27):** `/fibu/objekt-tags` — Objekte nach Nutzungsart/Marke/Region
  taggen (Chips anlegen/löschen) + Gruppierungs-Vorschau je Dimension. API
  `/api/fibu/objekt-tags`, Logik `lib/fibu/objekt-tags.ts` (`gruppiereNachTag`) + Tests.
  Basis für die horizontale Achse konsolidierter Auswertungen.
- **Lieferant-Fuzzy-Match:** `lib/fibu/lieferant-match.ts` (`matchLieferant`, Alias/
  Normalisierung) leitet `firma_id` aus dem erkannten Lieferanten ab (in `/api/fibu/belege`).
- **RowActions/Kebab** in allen FiBu-Stammdaten-Listen ausgerollt (Kern-Komponente).

## In Arbeit

- Belegzuordnung: `firma_id` jetzt via Lieferant-Match abgeleitet; Rest-Fälle (kein Treffer)
  weiterhin firma_id null → Review (OP-6 teilweise gelöst)
- EXTF-Export an echte Buchungen anbinden (volles 116-Spalten-Layout, OP-1)
- BWA/Bilanz-Kurzform + Bank-Cockpit (auf GuV-Basis); gebrandetes A4-PDF
- pgTAP-RLS-Tests

## Ideen / als Nächstes

- Bank-Cockpit (DSCR, Bankenmappe) — erst nach stabiler Beleg-Pipeline (Datenqualität)
- Konsolidierte Auswertungen: Basis steht (`/fibu/konsolidierung`); offen bleiben
  zweite Achse (objekt_tags-Gruppierung), Reporting-Taxonomie-Mapping, Innenumsatz-Eliminierung
- KI-Controlling-Agents (Analyse → Alerting → autonome Aktion mit Leitplanken)
- Phasen-Einordnung: überlappt ERP-Kern Phase 5 (DMS/OCR), Phase 7 (Reporting/Bank/DATEV),
  Agenten 4/8/11

## Entscheidungen (warum es so ist)

- 2026-06-25: **Invoice Ninja = Ausgangsrechnungen, FiBu-Modul = Eingangsbelege +
  Kontierung.** Klare Abgrenzung, keine doppelte Kontierungslogik. Invoice Ninja (TB16,
  SKR03) erstellt/verbucht Ausgangsrechnungen; dieses Modul verarbeitet Eingangsbelege.
- 2026-06-25: **Persistenz im ERP (Supabase `wimus`), nicht NocoDB.** Stammdaten, Belege,
  Buchungen, Kontierungsregeln alle über die ERP-UI. NocoDB fällt weg (war im Prototyp nur
  halb angebunden).
- 2026-06-25: **Kontierung hybrid** — LLM extrahiert Fakten, Regel-Lookup kontiert
  deterministisch, LLM-Fallback nur bei Regellücke (+ review_flag). Grund: SKR-Konten
  dürfen nicht prompt-abhängig driften; jede Buchung nachvollziehbar.
- 2026-06-25: **E-Rechnungs-Weiche vor KI** — ZUGFeRD/XRechnung → XML deterministisch
  parsen (confidence 1.0), KI überspringen. Grund: E-Rechnungspflicht DE, exakte Daten
  geschenkt, keine LLM-Unschärfe, Kosten gespart.
- 2026-06-25: **Mehrere Buchungskreise ab Tag 1** (GmbH = Bilanz/KSt; GbR = transparent/
  Feststellung; Privat = §21-Überschuss). Rechtsform-Typ steuert die gesamte nachgelagerte
  Logik. Einheiten-Zuordnung als frühe Pipeline-Stufe vor der Kontierung.
- 2026-06-25: **Gesellschafter + zeitabhängige Beteiligungsquoten** als eigene Entitäten;
  Ergebnisverteilung periodengenau (zeitanteilig bei unterjährigem Quotenwechsel). Keine
  Sonder-/Ergänzungsbilanzen (reine Quotenverteilung).
- 2026-06-25: **Feststellung nur als Controlling-Vorschau im ERP, verbindlich via
  TaxPool.** Grund: TaxPool hat Gesellschafterdaten/Kapitalkontenentwicklung; kein zweiter
  Wahrheitskern.
- 2026-06-25: **Export = DATEV-Buchungsstapel-CSV (EXTF) pro Einheit → TaxPool-Import.**
  TaxPool importiert DATEV-CSV nativ (verifiziert). KOST1=K1, KOST2=K2, stabile Buchungs-ID
  (TaxPool-Dublettenerkennung Spec ≥3.0). Keine ELSTER-Anbindung im ERP.
- 2026-06-25: **AfA/Anlagenbuchhaltung macht TaxPool, nicht das ERP.**
- 2026-06-25: **Konsolidierung = Management-Aggregation, kein testierter Konzernabschluss.**
  Frei wählbarer Scope über zwei Achsen (Einheiten vertikal × Objekte/K1 horizontal),
  optionale Innenumsatz-Eliminierung, gemeinsame Reporting-Taxonomie.
- 2026-06-25: **KI-Controlling über Akteure-Modell** (Rolle „Controller", Mensch/KI),
  Autonomie gestaffelt (Analyse → Alerting → Aktion mit Leitplanken). Leitplanke: aufbereiten
  und Optionen zeigen, keine verbindliche Finanz-/Anlageempfehlung.
- 2026-06-26: **Buchungskreis = bestehende `firmen`-Tabelle** (erweitert, nicht neue
  `einheiten`-Tabelle). Klärt OP aus 002_fibu_200_datenmodell/50_migration. Migration 010 setzt darauf auf.
- 2026-06-26: **Gating-Default (klärt OP-2):** auto-buchbar nur bei confidence ≥ 0.95 UND
  brutto ≤ 200 € (überschreibbar). Alles darüber → Mensch.
- 2026-06-26: **EXTF-Export vorerst als importierbarer Kern** (Header 700/21 + benannte
  Spalten) statt vollem 116-Spalten-Layout. Volles Layout bleibt OP-1 bis Live-Anbindung.
- 2026-06-26: **E-Rechnungs-Parser dependency-frei** (Local-Name-Extraktion, kein XML-Lib-Dep)
  für CII + UBL. Grund: schlanke Build, keine Fremd-Abhängigkeit für simples Feld-Mapping.
- 2026-06-26: **FiBu-Buchungssätze heißen `fibu_buchungen`** (+ `fibu_konten`,
  `fibu_korrekturen`). Grund: `wimus.buchungen` ist bereits durch die KZV-Reservierungen
  belegt (Namenskollision). KZV-Tabelle bleibt unangetastet. `belege` wie spezifiziert.

## Offene Punkte

- OP-1: Volles EXTF-Feldlayout (116 Spalten) — Export läuft vorerst als benannter Kern;
  volles Layout bei Live-Anbindung an echte Buchungen.
- ~~OP-2: Confidence-/Betragsschwellen~~ → vorläufig geklärt (2026-06-26): ≥ 0.95 UND ≤ 200 €,
  überschreibbar. Feinjustierung im Betrieb.
- OP-3: Gemeinsame Reporting-Taxonomie (Bilanz-Konten GmbH ↔ EÜR-Konten Privat auf neutrale
  Berichtspositionen mappen) — Detailarbeit beim Bank-Cockpit.
- OP-4: Einzelpositionen-Extraktion in V1 oder später (für gemischte Steuersätze /
  Multi-Objekt-Belege).
- OP-5: TaxPool Beleg-Verknüpfung (DMS / „DATEV digitale Belege") für Original-Belegbilder
  prüfen.
- OP-6: Einheiten-/Firma-Zuordnung des Belegs automatisieren — **teilweise gelöst
  (2026-06-27):** `firma_id` wird via Lieferant-Fuzzy-Match (`lib/fibu/lieferant-match.ts`)
  abgeleitet; ohne Lieferant-Treffer bleibt firma_id null → Review. Weitere Heuristiken offen.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 0.6.0 | 2026-06-27 | in_arbeit | Objekt-Tags: `/fibu/objekt-tags` (Nutzungsart/Marke/Region taggen + Gruppierungs-Vorschau), `/api/fibu/objekt-tags`, `lib/fibu/objekt-tags.ts` (`gruppiereNachTag`) + Tests. |
| 0.5.0 | 2026-06-27 | in_arbeit | Konsolidierte GuV: `/fibu/konsolidierung` (Scope-Selektor, Matrix Konto×Einheit, A4-Druck), speicherbare Scope-Presets (`/api/fibu/auswertungs-scopes`), `lib/fibu/konsolidierung.ts` + Tests. |
| 0.4.0 | 2026-06-27 | in_arbeit | Reporting-Tabellen gebaut (Migration 015: feststellungen/auswertungs_scopes/objekt_tags/reporting_taxonomie + RLS), ocr_verarbeitungen (014); gebrandeter A4-GuV-Druck (`/fibu/auswertung/druck`). |
| 0.3.0 | 2026-06-27 | in_arbeit | Reporting-Ergänzung: GuV-Auswertung (`lib/fibu/guv.ts` + `/fibu/auswertung`, Recharts), Lieferant-Fuzzy-Match → firma_id, RowActions/Kebab in FiBu-Listen. Tremor projektweit durch Recharts abgelöst. |
| 0.2.0 | 2026-06-26 | in_arbeit | Stammdaten-Layer + Kernlogik gebaut & getestet: Migration 010/011, Kontierung, Ergebnisverteilung, Belegprüfung, E-Rechnungs-Weiche, EXTF-Kern, Beleg-Pipeline, Freigabe-Cockpit, Feststellungs-Vorschau |
| 0.1.0 | 2026-06-25 | in_arbeit | Erstentwurf Grobspec: Pipeline, Mehrmandanten/Gesellschafter, Feststellungs-Vorschau, TaxPool-Export, Bank-Cockpit, KI-Controlling |

## Änderungshistorie

> Laufendes Protokoll aller Änderungen am Modul (neueste oben). Vorgang ≤ 100 Zeichen.
> Frühere Einträge ohne Uhrzeit (nicht erfasst); ab 2026-06-26 mit Uhrzeit.

| Datum/Zeit | Vorgang | Betroffen |
|------------|---------|-----------|
| 2026-06-27 10:35 | v0.6.0: Objekt-Tags-Verwaltung (/fibu/objekt-tags) + gruppiereNachTag + Tests | 000,200,400 + Code |
| 2026-06-27 01:50 | v0.5.0: Konsolidierte GuV (/fibu/konsolidierung) + Scope-Presets + A4-Druck + Tests | 000,200,400 + Code |
| 2026-06-27 01:10 | v0.4.0: Reporting-Tabellen (015) + ocr_verarbeitungen (014) gebaut, gebrandeter A4-GuV-Druck | 000,200,400 |
| 2026-06-27 00:50 | Spec-Sync 0.3.0: GuV/Recharts/Lieferant-Match/RowActions als Steht, OP-6 teilw. gelöst, Tremor→Recharts | 000,200,400 |
| 2026-06-26 | Build-Stand 0.2.0: firmen-Buchungskreis, Gating, EXTF-Kern, fibu_buchungen | 000,200,400,600 |
| 2026-06-25 | Erstentwurf Grobspec FiBu (Pipeline, Mehrmandanten, TaxPool-Export, Bank-Cockpit) | alle |
