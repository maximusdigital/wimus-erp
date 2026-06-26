---
gehoert_zu: 0002
dokument: Architektur
geaendert: 2026-06-25
---

# 0002 — Architektur

> Version & Status des Moduls stehen in `002_fibu_000_konzept.md`.
> Baut auf 0001 (`002_fibu_100_architektur.md`, `002_fibu_300_prozesse.md` Kap. 5) auf.

## Systemgrenzen

- **Vorne:** Mistral OCR (Kern-Pipeline, 0001). Bei E-Rechnung: XML-Parse statt OCR.
- **Hinten:** DATEV-Buchungsstapel-CSV (EXTF) pro Einheit → TaxPool. TaxPool macht
  Abschluss, AfA, Feststellung (verbindlich), E-Bilanz/EÜR, USt-Voranmeldung, ELSTER.
- **Abgrenzung Invoice Ninja (TB16):** Ausgangsrechnungen. Dieses Modul: Eingangsbelege.

## Rollenverteilung ERP ↔ TaxPool

| Aufgabe | WIMUS-ERP (Vorsystem) | TaxPool (Abschluss) |
|---------|----------------------|---------------------|
| Belegerkennung/Extraktion | ✅ | – |
| Kontierung (Eingang) | ✅ hybrid | – |
| Buchung je Einheit, K1/K2 | ✅ | – |
| Freigabe-Cockpit | ✅ | – |
| Stammdaten Einheiten/Gesellschafter | ✅ | (Gesellschafterdaten auch) |
| Verteilungs-Vorschau (Controlling) | ✅ grafisch | – |
| Buchungsstapel-Export (EXTF) | ✅ | Import |
| AfA / Anlagenbuchhaltung | – | ✅ |
| Feststellung (verbindlich) | – | ✅ |
| Bilanz/EÜR/USt-VA/ELSTER | – | ✅ |

## Verarbeitungspipeline (Stufen)

| # | Stufe | Inhalt |
|---|-------|--------|
| 0 | Eingang & Idempotenz | Original unveränderbar ablegen (GoBD), Hash, Dublettencheck |
| 1 | Einheiten-Zuordnung | Beleg → Einheit; damit Rechtsform-Typ, Kontenrahmen, Steuerlogik fest. Erkennung: Empfänger/Steuernr., Kanal (firmeneigenes belege@), Objekt→Einheit. Kein Treffer → Review |
| 2 | Format-Weiche | E-Rechnung (ZUGFeRD/XRechnung)? → XML deterministisch parsen (confidence 1.0), KI überspringen. Sonst → OCR |
| 3 | OCR | Mistral OCR → Markdown + JSON + Confidence, gecacht an Hash. Niedrige OCR-Confidence → OCR-Prüf-Queue |
| 4 | Klassifikation | Klasse, Gewerk, Leistung; vollständige Klassen-Abdeckung + Default-Branch |
| 5 | Extraktion | Belegnr., Belegdatum, Fälligkeitsdatum, Netto/Brutto/USt, Lieferant, Leistung, optional Positionen[] |
| 6 | Validierung (deterministisch) | netto+ust≈brutto, ust≈netto×satz, Datum plausibel, IBAN-Prüfsumme → Fehlschlag = review_flag |
| 7 | Zuordnung & Matching | K1/K2 (Kürzel/Referenz → ERP-Stammdaten), Lieferant (Fuzzy → Kreditor/Neuanlage), optional Vertragsabgleich |
| 8 | Kontierung (hybrid) | Regel-Lookup → SKR-Konto je Rechtsform-Typ, K1→Haben/Bank, USt→Steuerschlüssel. LLM-Fallback nur bei Regellücke. Confidence + Betrag als Gate |
| 9 | Freigabe | Cockpit mit Einheiten-Filter, Batch pro Einheit. Hohe Confidence + niedriger Betrag → KI-Akteur bucht; sonst Mensch; über Schwelle → immer Mensch |
| 10 | Buchung & Ablage | Status gebucht; Datei-Umbenennung + Ablage Jahr/Sachkonto/; Original unveränderbar |
| 11 | Verteilungs-Vorschau | Controlling-Grafik der Ergebnisverteilung nach Quote (zeitanteilig); nicht steuerverbindlich |
| 12 | Export Buchungsstapel | DATEV-EXTF-CSV pro Einheit → TaxPool. KOST1/KOST2, stabile Buchungs-ID. Belegbild optional |

## Eingangskanäle (Multi-Channel, an Kern-Channel-System)

- E-Mail `belege@…` (IMAP-Trigger), idealerweise pro Einheit eigenes Postfach
- Google Drive / Upload-Ordner (Scans, Fotos)
- ERP-Direktupload (Drag & Drop)
- später WhatsApp/GreenAPI (Belegfotos)

## KI-Akteure (aus 0001, hier detailliert)

- Agent 4 (Dokument): Erkennung, Klassifikation, Ablage
- Agent 11 (FIBU/Mieteingang): Bankimport-Abgleich, OP, Kontierung
- Agent 8 (Reporting): Bank-Cockpit, Bankenmappe, GoBD
- neue Rolle „Controller" (KI/Mensch): Controlling-Stufen 1–3 (siehe `002_fibu_300_prozesse.md`)

## Status-Maschine

`eingegangen → einheit_zugeordnet → ocr_ok → extrahiert → validiert → freigabe_offen →
gebucht → exportiert` + `fehler`, `dublette`, `abgelehnt`. Jeder Übergang mit Timestamp +
Akteur (Audit-Log, GoBD).

## Bekannte Befunde aus dem n8n-Prototyp `DEV | OCR Mistral` (zu beheben beim Neubau)

1. Pipeline endete im Nichts (Step 5 ohne Output, NocoDB/HTTP unverbunden).
2. Switch-Index-Lücke (main4 zahlungsbeleg ohne Ziel; abschlagsplan/gutschrift/
   vertragsunterlage/sonstiges ohne Branch).
3. OCR-Routing fragil (Dateiname-Substring statt MIME-Type).
4. Preprocessing-Node nicht verbunden (Cleaning lief nie).
5. K1-Liste doppelt in Classify + Account (zwei Wahrheiten).
6. SKR-Buchungslogik im LLM-Prompt statt deterministisch.
