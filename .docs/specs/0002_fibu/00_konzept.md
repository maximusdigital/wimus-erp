---
id: 0002
titel: FiBu — Belegerkennung, Kontierung & Reporting
status: in_arbeit          # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.1.0             # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: fibu
erstellt: 2026-06-25
geaendert: 2026-06-25
abhaengt_von: [0001]
---

# 0002 — FiBu (Belegerkennung, Kontierung & Reporting)

## Worum geht's

Vollautomatisierte Verarbeitung **eingehender** Belege von der Erfassung bis zum
Buchungsstapel-Export, integriert ins WIMUS-ERP. KI bereitet vor (Erkennung, Extraktion,
Kontierungsvorschlag), Mensch gibt frei (Batch, Selbstkontierung), das System bucht,
ermittelt Ergebnisse und liefert die Datenbasis für TaxPool/ELSTER.

Das Modul baut auf der OCR-Pipeline des ERP-Kerns (0001, `30_prozesse.md` Kap. 5,
`ocr_verarbeitungen`) auf und erweitert sie um mandantenfähige SKR-Kontierung,
Mehrunternehmens-/Gesellschafterstruktur mit Ergebnisverteilung, Buchungsstapel-Export
und ein grafisches Finanz-/Bank-Cockpit.

Leitprinzip: **Suggest, not Autobook** — KI schlägt vor, Mensch bestätigt. Auto-Buchung
nur über definierte Confidence- und Betragsschwellen.

## Steht (gebaut & läuft)

- OCR-Basis vorhanden im Kern (Mistral OCR, Confidence-Strategie, `ocr_verarbeitungen`)
- Bestehende n8n-Pipeline `DEV | OCR Mistral` als Prototyp (wird abgelöst, siehe Decision)

## In Arbeit

- Konzeption / Spec (dieses Modul)

## Ideen / als Nächstes

- Phasen-Einordnung: überlappt ERP-Kern Phase 5 (DMS/OCR), Phase 7 (Reporting/Bank/DATEV),
  Agenten 4/8/11
- Bank-Cockpit (DSCR, Bankenmappe) — erst nach stabiler Kern-Pipeline (Datenqualität)
- KI-Controlling-Agents (Analyse → Alerting → autonome Aktion mit Leitplanken)

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

## Offene Punkte

- OP-1: Exaktes EXTF-Feldlayout (Header + Spaltenreihenfolge) für den Buchungsstapel-Export
  — beim Bau von `50_migration.md`/Export-Stufe festlegen.
- OP-2: Confidence-/Betragsschwellen für Auto-Buchung final festlegen.
- OP-3: Gemeinsame Reporting-Taxonomie (Bilanz-Konten GmbH ↔ EÜR-Konten Privat auf neutrale
  Berichtspositionen mappen) — Detailarbeit in `40_design.md`/Feinspec.
- OP-4: Einzelpositionen-Extraktion in V1 oder später (für gemischte Steuersätze /
  Multi-Objekt-Belege).
- OP-5: TaxPool Beleg-Verknüpfung (DMS / „DATEV digitale Belege") für Original-Belegbilder
  prüfen.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 0.1.0 | 2026-06-25 | in_arbeit | Erstentwurf Grobspec: Pipeline, Mehrmandanten/Gesellschafter, Feststellungs-Vorschau, TaxPool-Export, Bank-Cockpit, KI-Controlling |
