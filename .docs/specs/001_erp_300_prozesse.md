---
gehoert_zu: 0001
dokument: Prozesse
geaendert: 2026-06-28
quelle: 20260624_WIMUS_IT_ERP_10_Spezifikation_Docs_V502.docx
---

# 0001 — Prozesse

> Version & Status des Moduls stehen in `001_erp_000_konzept.md`.
> Fachliche Prozesslogik (BK, Fristen, Forderungen, Mietrecht, OCR, Verwaltungsverträge).

## 1. Betriebskosten — vereinheitlichte Logik

Alle BK laufen durch dieselbe Logik, egal ob Strom, Gas, Müll, Hausmeister, WEG-extern
oder Grundsteuer.

Quellen: `zaehler` (Strom kWh, Gas m³→kWh, Wasser m³, Fernwärme MWh) → bk_berechnungslogik
+ brennwerte; `rechnung` (Hausmeister, Müll, Versicherung, Garten) → direkt als Betrag;
`weg_extern` (WEG-HV Jahresabrechnung) → KI klassifiziert umlagefähig/nicht; `pauschal`
(Warmwasser als % Heizkosten); `bescheid` (Grundsteuer, Gebühren).

Berechnungslogiken je BK-Art: Strom (kWh direkt × Preis), Gas (m³ → kWh via Brennwert ×
Zustandszahl × Preis), Wasser (m³ direkt), Fernwärme (Grund + Arbeit × MWh), Heizöl (L ×
~9,8 kWh/L), Pellets (kg × ~4,8 kWh/kg), Warmwasser (= Heizkosten × 18%), HKVO (70%
Verbrauch / 30% m²), Pauschal/Rechnung (Betrag direkt). Brennwert Gas schwankt je
Netzgebiet → in `brennwerte` versioniert je Versorger.

### Abrechnungseinheiten (universell)

Ersetzt wg_gruppen + bk_umlagegruppen + Zählergruppen + Heizkreise in EINEM Konzept.
Typen: wg (kopfzahl), zaehlergruppe (flaeche/individuell), heizkreis (flaeche/verbrauch),
bk_gruppe (kopfzahl/flaeche), sonstige (individuell).

Umlageschlüssel: kopfzahl (Funktion `kopfzahl_gruppe()` zum Stichtag), flaeche (Standard
§556a BGB), einheit (Gleichteilung), verbrauch (Einzelzähler), miteigentum (WEG MEA),
individuell (fester_anteil_pct), intern (KZV → intern_abgerechnet = TRUE → 0 EUR).

### WEG-Extern Durchleitung

Umlagefähig (→ kostenverteilung_positionen): Allgemeinstrom, Hausmeister, Versicherung,
Garten, Grundsteuer. Nicht umlagefähig (→ Eigentümer-Report): Instandhaltungsrücklage,
Verwaltungshonorar HV, Reparaturen, Versicherungs-Selbstbehalt. KI-Usecase: Mistral OCR →
KI klassifiziert → Verwalter bestätigt (1 Klick) → auto in BK-Abrechnung.

### BK-Modelle je Mietvertrag

pauschale (§560 BGB, fester Betrag, kein Jahresabschluss); vorauszahlung (§556 BGB,
monatliche VZ + Jahres-BKA).

### KI-Automatisierung BK

Zählerstand-Trend +15% → bk_pauschalen_anpassungen → §560 Brief → Frist; WEG-PDF → OCR →
KI klassifiziert → Verwalter bestätigt → DB; Leerstandsanteil automatisch (Vermieter trägt
BK-Anteil); Gewerbe BK + 19% USt; HKVO Fernablesepflicht ab 01.01.2027.

## 2. Fristenmanagement

Eine Tabelle für alle Deadlines — n8n prüft täglich, löst Aktionen aus. Typen u.a.:
bk_anpassung (§560 1 Monat), mieterhoehung (2 Monate vorher), modernisierung (§555b 3
Monate), kuendigung, raeumung (§546a), kautionsabrechnung (6 Monate §259), gewaehrleistung
(2 Jahre §634a), wartung_rauchmelder (1 Jahr), wartung_aufzug (TÜV 1 Jahr),
wartung_legionellen (3 Jahre), staffelmiete (1 Monat vorher), indexmiete (12 Monate +
VPI), verjährung (3 Jahre §195).

## 3. Forderungsmanagement

Eine Tabelle für alle Forderungen, Kaution als Verrechnungstopf, Mahnwesen automatisch.
Typen: miete, bk_nachzahlung, sachschaden, reinigung_zusatz, nutzungsausfall, mietausfall,
renovierungskosten, hausgeld, citytax.

### Schadensmanagement (Eskalation nach Betrag)

> **Detail in `004_ops_*`** (Vorgangs-Engine, `vorgang_schaden.abwicklungsstufe` + `lib/ops/schaden`):
> Betrags-Staffel < 50 / 50–500 / 500–5.000 / 5.000–10.000 / > 10.000 (Kaution → Versicherung →
> Mahnbescheid → Anwalt). Der **Kern** hält nur den Forderungs-/Kaution-Bezug: jeder Schaden =
> Vorgang (004) + **Forderung (1:n)**, Verrechnung über die Kaution (s.u.).

### Kaution als Verrechnungstopf

Erst alle offenen Forderungen verrechnen → Rest positiv: Rückzahlung SEPA; Rest negativ:
Nachforderung → Mahnwesen. Frist §259 BGB 6 Monate. KI erstellt Kautionsabrechnung auto.

## 4. Mietrecht

Mieterhöhungsarten: vergleichsmiete (§558, 2 Monate, Kappung BW 15%/3J), modernisierung
(§559, 3 Monate, 8% p.a.), staffel (§557a, im Vertrag), index (§557b, 12 Monate, VPI
Destatis), einvernehmlich (§557).

### KZV-Vertrag automatisch

Beds24-Webhook → Buchung → mietvertrag V03 (KZV) automatisch: einheit/mieter/beginn/ende
aus Buchung, grundmiete + 7% USt, bk_modell pauschale, citytax berechnet (Satz × Personen
× Nächte), Forderung miete (fällig checkin), Rechnung Invoice Ninja (7% USt, WhatsApp +
E-Mail). CityTax versioniert (Stuttgart 3,00 / Ludwigsburg 2,00 EUR/Person/Nacht ab
01.07.2026; Buchungen über Monatswechsel: nur Nächte ab 01.07.).

## 5. OCR-Pipeline (Mistral OCR)

> Diese Pipeline ist die gemeinsame OCR-Basis für den Kern und das FiBu-Modul (0002).

Dokument-Typen (Auswahl): Mietvertrag → mietvertraege; Eingangsrechnung →
kostenverteilung_positionen; WEG-Jahresabrechnung → weg_abrechnungen_extern;
Zählerabrechnung → zaehlerstaende + brennwerte; Grundsteuerbescheid; Handwerkerrechnung →
vorgaenge; Übergabeprotokoll → einheit_uebergaben + forderungen; Exposé → objekte +
einheiten; Schufa; Behördenpost → fristen + vorgaenge; WEG-Protokoll → weg_wirtschaftsplaene.

Ausgabe-Formate: Markdown Rohtext (ocr_raw_md + Paperless _ocr.md); JSON strukturiert
(ocr_structured + Paperless _structured.json); DB-Felder granular; Paperless Tags auto.

### Confidence-Strategie

≥ 0.90 automatisch übernehmen (🟢); 0.75–0.89 übernehmen + markieren (🟡 Prüfung
empfohlen); < 0.75 manuelle Pflicht (🔴); kritische Felder (Miete, Kaution, Betrag) immer
manuell prüfen (🔴).

### n8n OCR-Flow

1) Dokument eingeht (Caya/Paperless/E-Mail/Upload) → 2) Mistral OCR API → ocr_raw_md +
Confidence → 3) Claude API Dokument-Typ klassifizieren → 4) Claude API Felder extrahieren
(System-Prompt je Typ) → 5) Confidence-Check → auto oder manuelle Prüfung → 6) Paperless
_ocr.md + _structured.json + Tags → 7) Ziel-Tabellen befüllen → 8) Alert wenn Prüfung
nötig → ERP + Zammad Ticket. Kosten < 5 EUR/Monat.

## 6. Verwaltungsverträge

mietverwaltung (5–8% Nettomiete / 25–50 EUR/Einheit), weg_verwaltung (300–600 EUR/Monat +
ETV-Honorar), sev (30–60 EUR/Einheit/Monat), kzv (15–25% Buchungsumsatz).

## 7. Mieter-Portal (Phase 10)

Postfach ein/ausgehend (portal_nachrichten + Zammad), Mein Vertrag, Meine Dokumente
(Paperless RLS), Meine Zahlungen (forderungen RLS), Schadensmeldung (Foto → Vorgang),
Zählerstand (Foto → zaehlerstaende). PWA, Supabase Auth, Rolle mieter_portal, RLS nur
eigene Einheit, URL mieter.wimus.de je Marke.

## 8. Sonstige Use Cases (geplant)

Inventar/Assets (QR+OCR+AfA, P5), Versicherungsmanagement (P4), Energieausweis + CO2 §559b
(P11), DSGVO Löschkonzept (P11), Handwerker-Bewertung + Preisspiegel (P4), Fahrtenbuch
(P9), Kommunikations-Protokoll (P6), Leerstandsmanagement (P3), Retell AI Transkripte
(P12), Revenue Events (P3), ESG-Reporting (P7).
