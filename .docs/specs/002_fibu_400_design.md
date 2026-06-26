---
gehoert_zu: 0002
dokument: Design
geaendert: 2026-06-27
---

# 0002 — Design

> Version & Status des Moduls stehen in `002_fibu_000_konzept.md`.
> Folgt dem Design System des Kerns (`001_erp_400_design.md`): Shadcn + Recharts (Tremor
> projektweit abgelöst, React-19-kompatibel), Token-Farben, 4px-Grid, deutsche Labels.
> Erweitert das OCR-Prüf-Pattern.

> **Umsetzungsstand (2026-06-26):** Gebaut: `/fibu/belege`-Cockpit (Upload PDF/Bild/XML →
> Pipeline; Tabelle mit Ampel 🟢/🔴; Buchen/Ablehnen; Mobile-Karten) + Feldkorrektur-API;
> Stammdaten-UI (Gesellschafter/Beteiligungen, Kontierungsregeln, Lieferanten, Kontenrahmen);
> DATEV-Export-Seite; Feststellungs-Vorschau. **Noch offen (Backlog):** Inline-Korrektur in
> der Cockpit-Tabelle, PDF-Split-Preview, Batch-/Mehrfachfreigabe, ProgressBar auto/review,
> Einheiten-Filter-Tree, Audit-Timeline, Bank-/Finanz-Cockpit (Abschnitt 5) und
> KI-Controlling-Sichten (Abschnitt 6).

## 1. Buchungsfreigabe-Cockpit

Erweiterung der OCR-Prüfansicht (0001) um Kontierung + Batch:

- Einheiten-Filter (Dropdown/Tree mit Holding-Knoten) prominent oben.
- Tabelle aller Entwürfe (status=entwurf): Beleg, Lieferant, Betrag, KI-Vorschlag
  (Soll/Haben/K1/K2/USt/Buchungstext) vorausgewählt.
- Ampel je Zeile: 🟢 hohe Confidence (auto-fähig), 🟡 Review nötig, 🔴 Validierungsfehler.
- Inline-Korrektur der Kontierungsfelder; Klick auf Beleg → PDF-Preview (Split-View).
- Footer: [Ablehnen] [Einzeln prüfen] [Batch freigeben] (pro Einheit, da Konten/Export
  mandantengebunden).
- Fortschritts-Balken (Recharts/CSS): Anteil auto-fähig vs. Review.

## 2. Review-Queues

OCR-Prüfung (niedrige OCR-Confidence), Validierungsfehler (Cross-Field), fehlende Regel
(LLM-Fallback) — je eigene Shadcn-Table mit StatusBadge.

## 3. Regelverwaltung

CRUD für `kontierungsregeln` (Scope workspace/einheit), `lieferanten`-Mappings,
`objekt_tags`. Shadcn Forms. Vorschläge aus `korrekturen` als „Regel übernehmen?"-Hinweis.

## 4. Stammdaten-UI

Gesellschafter, Einheiten (rechtsform_typ), Beteiligungen mit Gültigkeitszeiträumen
(Timeline-Darstellung der Quoten). Shadcn Forms + Table.

## 5. Finanz-/Bank-Cockpit (Reporting-Ebene)

> **Umsetzungsstand (2026-06-27):** GuV-Auswertung gebaut — `lib/fibu/guv.ts`
> (`aggregateGuV`, SKR03-Heuristik 4xxx Aufwand / 8xxx Ertrag), Seite
> `app/(dashboard)/fibu/auswertung/` (Firma-/Zeitraum-Filter, Ertrag/Aufwand, Ergebnis,
> Balkenchart via Recharts, Browser-Print). Offen: BWA/Bilanz-Kurzform, KPIs, Scope-Selektor,
> gebrandetes A4-PDF (`print-layout.tsx`) und Bankenmappe.

Recharts-Dashboards (Anschluss an 0001 Finanzen-/OCR-Dashboards):

- **Standard-Reports:** BWA, GuV, Bilanz-Kurzform — je Einheit + konsolidiert, Zeitreihen,
  als gebrandetes PDF (print-layout.tsx A4). Hinweis „kein testierter Abschluss".
- **Immobilien-KPIs (je K1 + konsolidiert):** DSCR/Kapitaldienstdeckung (mit Verlauf),
  Mietrendite brutto/netto, Leerstand-/Mietausfallquote, Instandhaltungsquote, operativer
  Cashflow (AfA-bereinigt), Mietspiegel/Bestand (Ist/Soll/Potenzial/WAULT).
- **Scope-Selektor:** zwei Achsen (Einheiten vertikal: Holding/Auswahl/einzeln × Objekte
  horizontal: gesamt/Tag-Gruppe/Auswahl), Zeitraum, Toggle „Innenumsätze eliminieren",
  gespeicherte Presets.
- **Verteilungs-Vorschau:** grafische Ergebnisverteilung je Gesellschafter/Periode.
- **Bankenmappe (Ein-Klick):** kuratiertes PDF (Objektübersicht + KPIs + GuV-/Cashflow-
  Grafik + Zeitreihen), markenkonform, direkt an Bank weitergebbar.

Technik: Recharts; Daten aus Supabase; neuer Baustein = gebrandeter PDF-Export.

## 6. KI-Controlling-Sichten

Narrativ-Panel (Stufe 1: KI-Kommentar zu KPIs), Alert-Inbox (Stufe 2: Frühwarnungen +
Vorschläge), Agent-Konfiguration (Autonomiestufe pro Scope). Eskalation via sipgate/WhatsApp.

## UI-Konventionen (FiBu-spezifisch)

> Basis: Kern, Abschnitt „UI-Konventionen" in `001_erp_400_design.md`.
> Hier nur FiBu-Spezifika.

- **Primäraktion Belege/Buchungen:** Freigeben/Buchen (neben Bearbeiten). Kebab:
  Duplizieren, Drucken, DMS, AZ kopieren, als Dublette markieren. Destruktiv: Stornieren.
- **Bulk:** Mehrfachauswahl im Freigabe-Cockpit → „Batch freigeben" pro Einheit.
- **Inline-Edit:** Kontierungs-Konto, K1/K2, Steuerschlüssel direkt in der Cockpit-Tabelle.
- **Audit-Timeline:** Status-Maschinen-Verlauf je Beleg in der Detailansicht sichtbar.
