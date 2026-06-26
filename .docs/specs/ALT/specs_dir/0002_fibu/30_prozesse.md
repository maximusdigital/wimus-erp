---
gehoert_zu: 0002
dokument: Prozesse
geaendert: 2026-06-25
---

# 0002 — Prozesse

> Version & Status des Moduls stehen in `00_konzept.md`.

## 1. Kontierungslogik (Hybrid)

- **LLM-Aufgabe:** aus OCR-Text strukturierte Fakten ziehen (Belegnr., Datum, Netto/Brutto/
  USt, Lieferant, Leistung, handschriftliche K1-Kürzel) + Klassifikation (Gewerk/Leistung).
- **Regel-Aufgabe (deterministisch):** Kontierung via `kontierungsregeln`-Lookup:
  Gewerk/Leistung → SKR-Soll-Konto; K1 (Objekt) → Haben/Bankkonto der Einheit; USt-Satz →
  Steuerschlüssel; Lieferant-Alias → Standard-Gewerk.
- **LLM-Fallback:** nur bei fehlender Regel → Konto-Vorschlag + review_flag → Prüf-Queue.

## 2. Confidence- & Betrags-Gating (zweistufig)

- OCR-Confidence niedrig → gar nicht erst extrahieren, OCR-Prüf-Queue (sonst Müll mit hoher
  Extraktions-Confidence).
- Extraktions-/Kontierungs-Confidence niedrig → Buchhalter-Freigabe.
- Beide hoch + Betrag unter Schwelle → KI-Akteur bucht automatisch.
- Betrag über Schwelle → immer Mensch, unabhängig von Confidence.
(Schwellen: OP-2 im Konzept.)

## 3. Validierung vor Buchung (deterministisch, kein LLM)

netto + ust_betrag ≈ brutto (±1 Cent); ust_betrag ≈ netto × ust_satz; Datum plausibel
(nicht Zukunft/1970); IBAN-Prüfsumme falls extrahiert. Fehlschlag → review_flag, nicht buchen.

## 4. Freigabe-Workflow (Buchhalter-Cockpit)

n8n schreibt Belege als status=entwurf nach Supabase (KI-Vorschlag + confidence +
review_flag) → ERP-Seite „Buchungsfreigabe": Tabelle aller Entwürfe, KI-Vorschlag
vorausgewählt, Ampel (grün hoch / gelb Review). Buchhalter setzt Häkchen, korrigiert
Ausreißer, „Batch freigeben" pro Einheit → status=gebucht → Export + Ablage. Jede Korrektur
= Trainingssignal (`korrekturen` → Regelvorschlag).

## 5. Einheiten-Zuordnung (Mandant)

Vor Kontierung: Beleg → Einheit über Empfänger-Adresse/Steuernummer, Eingangskanal
(firmenspezifisches belege@-Postfach → direkter Mapping) oder Lieferadresse → Objekt →
Einheit. Mit Einheit stehen Rechtsform-Typ, Kontenrahmen, Bankkonten fest. Kein Treffer →
Review.

## 6. Ergebnisverteilung / Feststellung (Controlling-Vorschau)

Periodenende pro Einheit: Gewinn/Verlust ermitteln. Bei Personengesellschaft →
periodengenaue Quotenverteilung aus `beteiligungen` (zeitanteilig bei unterjährigem
Quotenwechsel) → `feststellungen`. **Nur Controlling/Grafik; steuerlich verbindlich macht
TaxPool.** GmbH: kein Verteilen. Privat: Überschuss direkt.

## 7. Export → TaxPool

Pro Einheit DATEV-Buchungsstapel-CSV (EXTF): KOST1=K1, KOST2=K2, Steuerschlüssel,
BU-Schlüssel, stabile Buchungs-ID (TaxPool-Dublettenerkennung Spec ≥3.0). Original-Belegbild
optional (TaxPool DMS / digitale Belege). TaxPool übernimmt Abschluss, AfA, Feststellung,
ELSTER.

## 8. KI-Controlling & autonome Agents (Rolle „Controller")

Über Akteure-Modell (0001), Autonomiestufe pro Auswertungs-Scope konfigurierbar.

- **Stufe 1 — Analyse/Narrativ (read-only):** automatische BWA-/KPI-Kommentierung,
  Abweichungs-/Plausibilitätsanalyse.
- **Stufe 2 — Alerting/Vorschlag (Schwellen-getriggert):** Frühwarnung (DSCR unter
  Bankauflage, Leerstand, Liquidität für Tilgung, Skonto-/Budget-Fristen) + Handlungs-
  vorschlag; Eskalation via sipgate/WhatsApp.
- **Stufe 3 — Autonome Aktion (mit Leitplanken):** Aufgaben/Mahnlauf/Forecast/Bankenmappe;
  Auto nur unter Schwellwert, geldwirksam/extern nie autonom.

Wiederverwendung der MA-KPI-Engine (Ziel/Ist/Schwelle/Bewertung) für Finanz-/Objekt-KPIs.
**Leitplanke:** aufbereiten + Optionen zeigen, keine verbindliche Finanz-/Anlageempfehlung.

## 9. Querschnitt-Use-Cases (gleiche Infrastruktur)

Eingangsrechnungsprüfung gegen Vertrag · BK-Vorkontierung mit Umlageschlüssel (Anschluss
0001 Kern 1) · Fristen-/Skonto-Wächter (→ 0001 Kern 2) · Dublettenerkennung · Mahnungseingang
→ Forderungsmanagement (→ 0001 Kern 3) · Kassenbuch-Plausibilität.

## 10. GoBD

Originale unveränderbar; Korrektur = neue Version mit Verweis (`belege.version`/
`vorgaenger_beleg_id`); vollständiges Audit-Log über Status-Maschine; Verfahrensdokumentation
(diese Spec als Baustein).
