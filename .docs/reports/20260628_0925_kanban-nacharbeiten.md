# Report — Kanban-Nacharbeiten (Aufgabe B), 2026-06-28 09:25

> Antworten aus dem Nachtlauf-Auftrag umgesetzt/quittiert.

## 1. Gebaut / erledigt

- **Cross-Spalten-Drag = 2 Requests (Status + Reorder):** so gelassen (Antwort 1, „robust schlägt
  sparsam"). Keine Sonderfall-Optimierung. Keine Code-Änderung nötig.
- **E2E-Grobtests:** Migration `020_board_sort.sql` ist eingespielt → eingeloggte Grobtests
  **25/25 grün**, inkl. `/vorgaenge/plantafel` (board_sort-Query live). `/crm`-Board rendert
  fehlerfrei (DndContext/SortableContext mounten sauber, separat geprüft).

## 2. Abweichungen

- Keine. Verhalten entspricht der Spec.

## 3. Offen

- **Drag-Smoke (Karte verschieben + Reihenfolge prüfen):** geparkt — die DB hat aktuell **0 echte
  Vorgänge und 0 Deals**, ohne ≥2 Karten in einer Spalte ist Drag-Reorder nicht real testbar.
  Code-seitig grün (Build + 314 Unit-Tests + Render-Mount). → Auf Wunsch seede ich 2–3 Wegwerf-
  Karten, mache den Drag-Smoke und räume auf.
- **Tremor-Restnennung `003_crm_400` Section 7:** bewusst NICHT angefasst — laut Antwort 2 erst
  **gebündelt beim nächsten CRM-Touch** auf „shadcn-charts" angleichen (rein kosmetisch).

## 4. Rückfragen

1. **Drag-Smoke jetzt mit Seed-Daten** (2–3 Wegwerf-Vorgänge/Deals, verschieben, prüfen,
   aufräumen) — soll ich, oder reicht der grüne Render-/Unit-Stand bis echte Daten da sind?
