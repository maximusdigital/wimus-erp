---
gehoert_zu: 0001
dokument: Design
geaendert: 2026-06-25
quelle: 20260624_WIMUS_IT_ERP_40_DesignSystem_Docs_V104.docx
---

# 0001 — Design System

> Version & Status des Moduls stehen in `001_erp_000_konzept.md`.
> Verbindliches Design-Referenzdokument. Tailwind v4 CSS-first, app/** Root, tw-animate-css.

## 1. UI-Stack

> **Umsetzung (2026-06-26): „Tremor" = Recharts.** `@tremor/react` ist nicht
> React-19-kompatibel (s. Decision-Log 001_erp_000_konzept) → Charts via **Recharts 3**
> (`components/charts/wimus-charts.tsx`, WIMUS-Palette); KPI-Cards = custom `KpiCard`.
> Alle „Tremor"-Nennungen unten sinngemäß als Recharts-basierte Charts lesen.

- Formulare & Layout: Shadcn/UI (Inputs, Select, Dialog, Tabs, Table, Navigation, Sidebar)
- Charts & Visualisierungen: Recharts 3 (ehem. Tremor) — Balken/Donut/Linie, KPI-Cards
  (custom), ProgressBar/Tracker als schlanke Eigenbauten
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

---

## UI-Konventionen (Listen, Aktionen, Bearbeitung)

> **Umsetzungsstand (2026-06-26): Soll-Konvention, Code-Umsetzung offen (Backlog).**
> Aktuelle Listen nutzen Row-Link + getrennte Bearbeiten/Löschen-Buttons und einen
> Lösch-Dialog. `<RowActions>` (3-stufiges Schema), Inline-Edit, Bulk-Aktionen, Undo statt
> Vorab-Dialog, Audit-Timeline und Tastatur-Nav sind noch NICHT implementiert.
>
> Version & Status des Moduls stehen in `001_erp_000_konzept.md`.
> Verbindliche, modulübergreifende UI-Patterns. Alle Module (FiBu 0002 etc.) folgen diesen.
> Folgt dem Design System (`001_erp_400_design.md`): Shadcn + Tremor, Token-Farben, 4px-Grid,
> deutsche Labels, Mobile 390px.

## 1. Zeilen-Interaktion (Listen/Tabellen)

Gilt für ALLE Listen (Belege, Objekte, Einheiten, Kontakte, Vorgänge, Fristen, …).

- **Row-Klick → Detailansicht.** Klick irgendwo auf die Zeile öffnet die Detailansicht.
- **Aktions-Icons rechts**, erscheinen bei Zeilen-Hover (Muster A). Icon-Klick löst die
  Aktion aus und öffnet NICHT die Detailansicht → `e.stopPropagation()` zwingend.
- **Optionaler „⋯"-Kebab** dahinter, wenn mehr Werkzeuge nötig sind als direkt sinnvoll.
  Nicht jede Liste braucht den Kebab; wo viele Aktionen existieren, ja.

### Dreistufiges Aktions-Schema

1. **Primär (direkte Hover-Icons, max. 2):** immer `Bearbeiten` + die EINE wichtigste
   kontextspezifische Aktion der Liste.
2. **Sekundär (Kebab oben):** Duplizieren, Drucken/PDF, Im DMS öffnen, Aktenzeichen kopieren.
3. **Destruktiv (Kebab unten, abgesetzt, rot):** Löschen / Stornieren / Archivieren — je
   nach Entität (siehe Abschnitt „Datenintegrität" in `001_erp_200_datenmodell.md`, GoBD).

### Wiederverwendbare Komponente `<RowActions>`

Eine zentrale Komponente, NICHT pro Liste neu erfinden. Props (mind.):
- `primaryAction` (die eine Kontextaktion neben Bearbeiten)
- `secondaryActions[]` (Kebab oben)
- `deletable: 'hard' | 'soft' | 'storno' | 'none'` (steuert destruktive Aktion, s. 55)
- `recordId`, Callbacks
Claude Code baut sie einmal, alle Listen nutzen sie identisch.

### Primäraktionen je Liste (Festlegung)

| Liste | Primär (neben Bearbeiten) | Sekundär (Kebab) | Destruktiv |
|-------|---------------------------|------------------|------------|
| Belege/Buchungen | Freigeben/Buchen | Duplizieren, Drucken, DMS, AZ kopieren, als Dublette markieren | Stornieren (storno) |
| Objekte | Einheit anlegen | Duplizieren, Drucken, Auf Karte | Archivieren (soft) |
| Einheiten | Vertrag anlegen | Duplizieren, Drucken, DMS | Archivieren (soft) |
| Kontakte | Nachricht senden | Duplizieren, Anrufen, Vorgang anlegen, AZ kopieren | Archivieren (soft) |
| Vorgänge/Schäden | Status ändern | Duplizieren, Handwerker zuweisen, Anhang, Drucken | Löschen (soft) |
| Fristen | Erledigt markieren | Verschieben/Snooze, Eskalieren | Löschen (soft) |

> Icons (Tabler/lucide): Bearbeiten edit, Duplizieren copy, Drucken printer, DMS folder,
> AZ hash, Freigeben check, Nachricht mail/whatsapp, Anrufen phone, Status
> arrows-exchange, Erledigt check, Snooze clock, Eskalieren arrow-up, Löschen trash,
> Stornieren ban, Kebab dots-vertical.

## 2. Duplizieren (allgemein, alle Bereiche)

Duplizieren legt den **gesamten Datensatz** neu an (neue ID, Status `Entwurf`), alle Felder
vorbefüllt. Sehr praktisch z.B. für Einheiten eines Objekts, ähnliche Verträge,
wiederkehrende Belege.

**Pflicht:** Eindeutige Felder werden NICHT mitkopiert (sonst sofort Dubletten-Kollision) —
Belegnummer, Aktenzeichen, Hash, externe IDs (Beds24, finAPI), Zählernummer etc. bleiben
leer/neu. Siehe Unique-Felder je Entität in Abschnitt „Datenintegrität" in `001_erp_200_datenmodell.md`.

## 3. Bulk-Aktionen (Mehrfachauswahl)

- Checkbox-Spalte links; Aktionsleiste erscheint, sobald ≥1 Zeile selektiert.
- Gemeinsame Aktionen: Freigeben/Buchen (Beleg-Cockpit!), Taggen, Export, Status setzen,
  Archivieren. Destruktive Bulk-Aktionen immer mit Bestätigung + Konsequenz-Anzeige.
- Im RowActions-Pattern von Anfang an mitgedacht (nicht zweimal bauen).

## 4. Inline-Bearbeitung (wo zulässig)

Manche Felder direkt in der Tabelle editierbar, ohne Detailansicht — spart im Massengeschäft
(Belegkontierung) enorm Zeit.

- **Nur erlaubt, wo das Feld Edit-Stufe `inline` hat** (siehe Abschnitt „Datenintegrität" in `001_erp_200_datenmodell.md`).
  Felder mit Propagations-/Sperr-Risiko (z.B. Fläche mit hängenden Abrechnungen) NIE inline.
- Typische inline-Felder: Status, K1/K2-Zuordnung, Kontierungs-Konto (im Cockpit), Tags,
  Notiz, Priorität.
- Optimistic UI (s.u.), Validierung beim Verlassen des Feldes.

## 5. Optimistic UI & Fehlerverhalten

- Aktion (z.B. Freigeben) reagiert sofort in der UI, ohne auf Supabase zu warten.
- Server lehnt ab → Zustand zurückrollen + dezenter Fehlerhinweis. Grundsatz fürs ganze ERP,
  einmal als Pattern festgelegt.

## 6. Undo statt Vorab-Dialog (unkritische Aktionen)

- Unkritische destruktive Aktionen (Notiz löschen, Status ändern): „Rückgängig"-Toast
  (~5 Sek) statt Bestätigungsdialog → weniger Reibung, trotzdem sicher.
- GoBD-/beziehungsrelevante Aktionen: KEIN Undo-Toast, sondern Storno/Versionierung +
  Konsequenz-Dialog (siehe 55).

## 7. Empty States

Jede Liste hat einen sinnvollen Leerzustand: kurze Erklärung + primäre Aktion, z.B.
„Noch keine Belege. [Beleg hochladen]". Prägt stark, wie fertig das ERP wirkt. Pflicht je
Liste.

## 8. Audit-Timeline in der Detailansicht

Die Status-/Änderungshistorie (Akteur + Timestamp, ohnehin GoBD-erfasst) wird in der
Detailansicht als Timeline sichtbar gemacht: „wer hat wann was geändert". Daten sind da —
Anzeige ist Pflicht. Auch praktisch fürs Debuggen („warum steht das so").

## 9. Tastatur-Navigation (Hochfrequenz-Listen)

Für täglich durchgeklickte Listen (Belege, Buchungen, Fristen): Pfeiltasten durch Zeilen,
Enter öffnet Detail, `E` Bearbeiten, `D` Duplizieren, Leertaste Auswahl (Bulk). Nur für
Hochfrequenz-Listen nötig, nicht überall.

## 10. Mobile / Touch (390px Pflicht)

- Hover existiert auf Touch nicht → Aktionen mobil über permanent sichtbaren Kebab oder
  Long-Press erreichbar machen. Werkzeuge dürfen mobil NIE unerreichbar sein.
- Detailansicht-Pflichtelemente (AktenzeichenBadge, DmsButton, Drucken) bleiben mobil
  erreichbar (ggf. in Kebab/Sheet).

## Detailansicht — Pflichtelemente (aus Design System V104)

AktenzeichenBadge + DmsButton + Drucken; Reports print-layout.tsx A4; Adresse über
adresse-block.tsx; Anrede Herr/Frau/Firma/Keine. (Siehe `001_erp_400_design.md` Pflichtliste.)
