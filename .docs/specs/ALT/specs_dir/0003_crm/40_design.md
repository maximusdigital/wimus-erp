---
gehoert_zu: 0003
dokument: Design
geaendert: 2026-06-26
---

# 0003 — Design

> Version & Status des Moduls stehen in `00_konzept.md`.
> Folgt Kern-Design-System (0001 `40_design.md`): Shadcn + Tremor, Token-Farben, 4px-Grid,
> deutsche Labels, Mobile 390px. UI-Vorbilder: Pipedrive (siehe Hinweise je Abschnitt).

## 1. Kanban-Board (Deal-Pipeline)

- Spalten = Stages, Karten = Deals, Drag-and-Drop (dnd-kit) zwischen Stages.
- **Oben (wie Pipedrive):** Pipeline-Umschalter (Dropdown, mehrere Pipelines je Marke) +
  **Mandanten-Filter** (Einheit einzeln / mehrere / alle — eigene Ergänzung ggü. Pipedrive),
  Summe + Anzahl Deals, Ansicht-Umschalter Kanban/Liste/Forecast, „+ Deal", Sortierung.
- **Spaltenkopf:** Stage-Name, Anzahl Deals, Summe Wert.
- **Deal-Karte:** Titel, Kontakt/Organisation, Wert, Tage-in-Stage, nächste Aktion,
  Owner-Avatar; Stalled → Warn-Symbol (wie Pipedrive ⚠ auf der Karte).
- Mobile (390px): Stage-Auswahl + Kartenliste (kein Drag erzwingen).

> **Tech-Basis Kanban:** dnd-kit (2026-Standard, A11y/Tastatur/Touch out of the box).
> Visuelle Vorlage: `Georgegriff/react-dnd-kit-tailwind-shadcn-ui` (GitHub) — exakt unser
> Stack (React + dnd-kit + Tailwind + shadcn/ui), barrierefreies Board als Startpunkt.
> Alternative höhere Abstraktion: hello-pangea/dnd (gepflegter react-beautiful-dnd-Fork).
> **Performance-Pflicht:** Kanban-State NICHT komplett auf Top-Ebene halten (sonst rendert
> jede Karte bei jedem Drag neu) → React.memo + stabile IDs; bei 500+ Karten Spalten-State
> separat (z.B. zustand-Slice je Spalte).

## 2. Deal-Detailansicht (stark an Pipedrive Bild 4–7)

- **Kopfzeile:** Deal-Titel, Owner + Follower, Buttons **Gewonnen** (grün) / **Verloren**
  (rot), Kebab.
- **Stage-Fortschrittsbalken horizontal** mit **Tage-in-Stage je Phase** (aktuelle Stage
  hervorgehoben grün, künftige grau). Breadcrumb „Pipeline → aktuelle Stage".
- **Aktivitäts-Tab-Leiste:** Notizen · Aktivität · Anruf · E-Mail · Dateien · Dokumente ·
  (Rechnung optional). E-Mail/Messaging hier am Deal vereint (zeigt Kern-Inbox-Nachrichten
  via `nachricht_id`, dupliziert nicht).
- **Linke Spalte (aufklappbar):** Zusammenfassung (Wert, Label, Abschlusstermin), Custom
  Fields (mit Pflicht/Wichtig-Markierung), Kontakt, Organisation, Objekt/Einheit.
- **Verlauf/Audit-Timeline unten:** Stage-Wechsel + Änderungen mit Akteur + Zeit
  („Phase X → Y · Max Moser · Zeit") — speist sich aus `deal_stage_historie` + Audit (Kern).
- Anruf-Button: SIP-Hook (sipgate), im MVP Platzhalter bis Telefonie-Integration.

## 3. Aktivitäten-Liste (eigene Ansicht, Pipedrive Bild 1)

- Tabelle aller Aktivitäten über alle Deals: Erledigt-Haken, Betreff (mit Typ-Icon:
  Anruf/Meeting/Aufgabe/Frist/E-Mail), Deal, Kontakt, E-Mail, Telefon, Organisation,
  Fälligkeitsdatum, Owner.
- Filter-Leiste: Alle/Anruf/Meeting/Aufgabe/Frist/E-Mail + Zeit (To-Do/Überfällig/Heute/
  Morgen/Diese Woche/Nächste Woche/Zeitraum).
- Farbcodierung: überfällig rot, heute grün (wie Pipedrive).
- „Was muss ich heute tun"-Sicht.

## 4. Lead-Inbox (schlanke Liste, Pipedrive Bild 3)

- Liste (kein Kanban): Titel, nächste Aktivität, Labels, Quelle, Lead erstellt, Besitzer.
- Filter: Quelle, Labels, Status.
- RowActions (Kern): Primär „Zu Deal konvertieren"; Sekundär „Kontakt/Organisation
  öffnen/anlegen"; Destruktiv „Verwerfen" (+ Grund). Bulk: mehrere verwerfen/zuordnen.

## 5. Pipeline-/Stage-Verwaltung

- CRUD Pipelines (Name, Marke, Default) + Stages (Name, Reihenfolge per Drag,
  Wahrscheinlichkeit, Stalled-Schwelle, Gewonnen/Verloren-Flag).
- Verloren-Gründe als Stammdaten-CRUD.

## 6. Custom-Fields-Verwaltung (Vorbild Pipedrive Bild 8–10)

- Einstellungen-Seite „Datenfelder", Tabs nach Entität: **Lead/Deal**.
- Tabelle der Felder: Name, Feldtyp, Spalten „Hinzufügen-Ansicht" / „Detailansicht" /
  „Qualitätsregeln" (Häkchen).
- „Feld hinzufügen"-Dialog (wie Bild 8): Feldname, Feldtyp (Dropdown), Positionen der Anzeige
  (Checkboxen: Neu-Formular / Detailansicht), Qualitätsregeln-Toggles **Erforderlich** +
  **Wichtig**. Optional je Pipeline oder global.
- Ergebnis: definierte Felder erscheinen automatisch in Deal-/Lead-Formular und Detailansicht.

## 7. Insights (später, nicht MVP)

Tremor: Conversion je Stage (Funnel/BarList), Forecast (Wert × Wahrscheinlichkeit),
Durchlaufzeit je Stage, Verloren-Gründe (DonutChart). Anschluss ans Reporting-Cockpit.

## UI-Konventionen (CRM-spezifisch)

> Basis: Kern, Abschnitt „UI-Konventionen" in `0001_erp-kern/40_design.md`. Hier nur Spezifika.

- **Primäraktion Deals:** Stage ändern (Drag) / Aktivität anlegen. Kebab: Duplizieren,
  Drucken, Kontakt öffnen. Destruktiv: Als verloren markieren (+ Grund) / Löschen (soft).
- **Primäraktion Leads:** Zu Deal konvertieren. Destruktiv: Verwerfen (+ Grund).
- **Inline-Edit:** Stage, Owner, Wert, Abschlussdatum direkt auf Karte/Liste.
- **Audit-Timeline:** Stage-Historie je Deal in der Detailansicht (Pipedrive-Verlauf-Vorbild).
