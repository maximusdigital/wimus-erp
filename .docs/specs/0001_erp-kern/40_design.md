---
gehoert_zu: 0001
dokument: Design
geaendert: 2026-06-24
quelle: 20260624_WIMUS_IT_ERP_40_DesignSystem_Docs_V104.docx
---

# 0001 — Design System

> Version & Status des Moduls stehen in `00_konzept.md`.
> Verbindliches Design-Referenzdokument. Tailwind v4 CSS-first, app/** Root, tw-animate-css.

## 1. UI-Stack

- Formulare & Layout: Shadcn/UI (Inputs, Select, Dialog, Tabs, Table, Navigation, Sidebar)
- Charts & Visualisierungen: Tremor (@tremor/react) (KPI-Cards, Charts, BarList, Tracker,
  Sparklines, ProgressBar)
- WIMUS-spezifisch: Custom (AktenzeichenBadge, DmsButton, StatusBadge, AddressBlock etc.)

## 2. Design-Tokens

Font: Inter only. Größen: 12/14/16/18/20/24/30px only.
Farben: primary #1F4E5F, secondary #2E75B6, teal #0D7680, success #2E7D32, danger #C62828,
warning #F59E0B. Spacing: 4px-Grid. Sidebar: 240px fix, bg-primary.
Tremor-Farben: ['primary','secondary','teal','success','warning','danger'].

## 3. Dashboard-Konzepte je Projekttyp (Tremor je Seite)

| Seite | Tremor | Shadcn |
|-------|--------|--------|
| Workspace | KpiCard(4)+BadgeDelta, AreaChart, DonutChart (KZV/LZV/WEG/SEV), BarList | Table: Fälligkeiten 7T, Letzte Vorgänge |
| KZV (ALFA APARTMENTS) | KpiCard(4: Auslastung/ADR/RevPAR/Umsatz), Tracker(30T), AreaChart, BarChart, DonutChart (Kanal-Mix), BarList | Table: Nächste Buchungen |
| WG/LZV (ALFA CAMPUS) | KpiCard(4: Belegung/Leerstand/Ø Mietdauer/OP), AreaChart (Soll vs Ist), BarChart, BarList | Table: Auslaufende Verträge 90T |
| HV (WIMUS HV) | KpiCard(4: Einheiten/Hausgeld OP/Mahnquote/WEG offen), AreaChart, DonutChart (Miet/WEG/SEV/KZV) | Table: ETV + BK fällig |
| Bauprojekt (ALFA DEV) | KpiCard(4: Budget/Verbraucht/Rest/Zeitplan), ProgressBar je DIN276, BarChart HOAI LPH | Table: Gewerke + Meilensteine |
| BK (je Objekt) | KpiCard(4: VZ Soll/Kosten Ist/Delta/CityTax), AreaChart gestapelt, BarChart EUR/m², BarList, Sparklines Zähler | Table: BK-Abrechnungen |
| Finanzen | KpiCard(4: Einnahmen/Ausgaben/Cashflow/OP), AreaChart, BarChart (OP-Alter), DonutChart (Forderungs-Mix) | Table: Top-10 OP |
| Fristen | KpiCard(4: heute/7T/verpasst/erledigt), BarChart je Typ | Table: alle Fristen sortiert, PriorityBadge |
| Workforce | KpiCard(4: Einsätze/Ø Zeit/KI-Quote/Kosten Mensch-vs-KI), BarChart, AreaChart (Break-Even) | Table: Top-Akteure |
| OCR | KpiCard(4: Verarbeitet/Offen/Ø Confidence/Kosten), DonutChart (Dok-Typen) | Table: OCR-Queue |
| Mobile PWA Hausmeister | ProgressBar, KpiCard minimal | Table: Heutige Einsätze |

## 4. Spezial-Screens

### OCR-Prüfansicht (Prompt 7)
Zwei-Spalten: PDF-Preview links (50%), extrahierte Felder rechts (50%). Je Feld Value-Input
+ Confidence-Badge (🟢 ≥0.90 auto, 🟡 0.75–0.89 check, 🔴 <0.75 required). Klick auf Feld
highlightet im PDF. Footer: [Ablehnen] [Einzeln prüfen] [Alle bestätigen]. ProgressBar
Gesamt-Confidence.

> Bezug FiBu (0002): Das Freigabe-Cockpit des FiBu-Moduls erweitert dieses OCR-Prüf-Pattern
> um Batch-Freigabe pro Einheit und Kontierungsvorschau.

## 5. CLAUDE.md — UI-Konventionen (PFLICHT vor jedem Commit)

1. Nur Token-Farben · 2. 4px-Grid · 3. Labels über Input · 4. Fehler unter Input ·
5. Adresse: adresse-block.tsx · 6. Anrede: Herr/Frau/Firma/Keine · 7. Detailansicht:
AktenzeichenBadge + DmsButton + Drucken · 8. Reports: print-layout.tsx A4 · 9. Charts:
immer Tremor (nie custom) · 10. Formulare: immer Shadcn (nie Tremor Input/Select) ·
11. Mobile 390px testen.

Dashboard-Layout-Kürzel je Projekttyp: kzv, wg, hv, bauprojekt, bk, finanzen, fristen,
ocr, mobile (Komponenten-Sets siehe Tabelle oben).
