---
gehoert_zu: 0004
dokument: Design
geaendert: 2026-06-26
---

# 0004 — Design

> Version & Status des Moduls stehen in `004_ops_000_konzept.md`.
> Folgt Kern-Design-System (`001_erp_400_design.md`). Charts: shadcn-charts.

## 1. Vorgangs-Liste & Detail

- **Liste:** Tabelle/Board nach Status (offen/beauftragt/in_arbeit/erledigt). Spalten:
  Aktenzeichen, Titel, Typ, Priorität (Farbe: Notfall rot), Objekt/Einheit, Zugewiesen,
  Fällig. Filter nach Typ/Priorität/Status/Objekt. RowActions (Kern).
- **Detail:** Kopf mit Aktenzeichen + Status + Priorität + Gewonnen/Erledigt-Aktion.
  Verlauf/Audit-Timeline (`vorgang_verlauf`). Anhänge (Fotos/Rechnungen, DMS). Zuweisung
  (intern/Handwerker). Kosten (Angebot/Rechnung) + Kostenträger. Verknüpfung Forderung/Beleg.

## 2. Mobile PWA (Reinigungskraft / Hausmeister)

> Offline-fähig, Kamera-Integration, großflächige Touch-Bedienung (Bestand-Anforderung).

- **Heutige Einsätze** (Tagesplan, KpiCard minimal, Liste).
- **Reinigungs-Flow:** Vorher-Fotos → Inventar-Checkliste → Schaden melden (Foto+Kategorie+
  Schwere) → Reinigung → Nachher-Fotos → abschließen. Schritt-für-Schritt, offline puffern.
- **Zählerstand-Foto** mit OCR-Vorschlag (Claude Vision), manuelle Korrektur.

## 3. Übergabe-UI (Tablet)

- Protokoll-Assistent (Einzug/Auszug/Wechsel): Zähler → Schlüssel → Rauchmelder → Checkliste
  je Raum (Status + Pflichtfoto) → Unterschriften-Pad.
- **Auszug-Abgleich:** Split-View Einzugsfoto ↔ Auszugsfoto je Position; Abweichung markieren
  → Schadensvorschlag → Kautionsabrechnung anstoßen.

## 4. Einsatzplanung (Plantafel)

- Drag&Drop-Plantafel (Ressourcen × Zeit), wie Kanban-Engine (dnd-kit). Akteure als Zeilen,
  Tage/Stunden als Spalten, Vorgänge/Reinigungen als Karten.
- Tagesplan-Mobilansicht je Akteur.

## 5. Wartungs-/Facility-Übersicht

- Wartungsobjekte mit nächster Prüfung (Ampel: fällig/bald/ok). shadcn-charts: Timeline.
- Müllabfuhr-Kalender je Objekt.

## UI-Konventionen (betriebsspezifisch)

> Basis: Kern „UI-Konventionen" in `001_erp_400_design.md`.

- **Primäraktion Vorgang:** Status weiterschalten / zuweisen. Notfall optisch hervorgehoben.
- **Mobile zuerst** für Reinigung/Hausmeister (Touch 390px, offline, Kamera).
- **Pflichtfoto-Erzwingung** in Übergabe/Reinigung (Position ohne Foto = nicht abschließbar).
- **Audit-Timeline** je Vorgang (Verlauf).
