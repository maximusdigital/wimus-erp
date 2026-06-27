---
gehoert_zu: 0004
dokument: Design
geaendert: 2026-06-27
---

# 0004 — Design

> Version & Status stehen in `004_ops_000_konzept.md`. Folgt Kern-Design-System
> (`001_erp_400_design.md`): Shadcn + Recharts, Token-Farben, 4px-Grid, deutsche Labels,
> Mobile 390px. RowActions/StatusBadge/PriorityBadge aus dem Kern wiederverwenden.

## 1. Plantafel (Vorgangs-Kanban)

- Spalten = Status (offen/zugewiesen/in_arbeit/wartet_extern/erledigt/abgenommen), Karten =
  Vorgänge, **Drag&Drop → Statuswechsel** (native HTML5-DnD wie CRM-Board, kein dnd-kit) +
  Verlauf-Eintrag. Abgeschlossene Spalten sperren Drag (Reaktivieren explizit).
- Karte: Aktenzeichen, Typ-Icon, Titel (aus Typ+Bezug), Objekt/Einheit, Priorität-Badge,
  Owner-Akteur, nächste Fälligkeit, Eskalations-Warnsymbol.
- Filter oben: Typ, Objekt/Einheit, Akteur („meine Aufträge"), Priorität.

## 2. Vorgangs-Detail (Engine + Typ)

- Kopf: Aktenzeichen + PriorityBadge + StatusBadge, Gewonnen-/Abschluss-Aktionen
  (Erledigt/Abnehmen/Abbrechen), Kebab.
- **Verlauf-Timeline** (aus `vorgang_verlauf`): Statuswechsel + Feldänderungen + Zuweisung +
  Benachrichtigung, je mit Akteur + Zeit.
- **Zuweisungen**: intern (Akteur) + extern (Organisation/Handwerker) anlegen, Auftrag
  versenden (Hook-Button), Status je Zuweisung.
- **Fotos**: Vorher/Nachher-Galerie (Referenzen), Upload-Hook.
- **Typ-Panel** (nur für den Typ sichtbar): Reinigung (Turnaround/Inventar/buchung) · Übergabe
  (Zähler/Schlüssel/Signatur/Einzug↔Auszug) · Wartung (Frist/Protokoll) · Reparatur (Angebot/
  Abnahme/Gewährleistung) · Schaden (Kategorie/Schwere/Abwicklungsstufe/Versicherung/Forderung).
- **Checkliste** (falls Vorlage für Typ): Positionen abarbeiten (foto/checkbox/text/zahl),
  KI-Prüfung als Hook.
- Kosten + Kostenträger → Forderung verknüpfen.

## 3. Typ-Sichten (Filter, kein eigenes Modell)

- „Reinigung heute" (Typ=reinigung, leistungsdatum=heute), „Offene Schäden", „Wartung fällig",
  „Meine Aufträge" (Owner/Zuweisung = aktiver Akteur). Alles als Listen-Filter auf die Engine.

## 4. Akteure-Verwaltung

- Stammdaten-Liste Akteure (Mensch/KI/extern), Bereich/Fähigkeiten/Verfügbarkeit; Zuordnung
  in der Vorgangs-Zuweisung.

## 5. Mobile (390px / PWA-Vorbereitung)

- Tagesplan-Liste (heutige Vorgänge des Akteurs), Karten statt Tabelle, Foto-Button prominent.
  Voll-PWA (offline) später.

## UI-Konventionen (004-spezifisch)

- Primäraktion Vorgang: Status weiterschalten / Zuweisen. Kebab: Duplizieren, Drucken, DMS.
  Destruktiv: Abbrechen (+ Grund), Löschen (soft).
- Typ-Icon-Map: schaden ⚠ · reparatur 🔧 · reinigung 🧹 · uebergabe 🔑 · wartung 🛠 · anfrage ✉.
- Charts (Workforce-/Auslastungssicht, später): Recharts.
