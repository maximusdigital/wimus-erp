# Antworten auf Kanban-/Schaden-Report (2026-06-28)

Report geprüft — sauber abgearbeitet. dnd-kit-Konflikt, Emoji-Icons (#7), Kern-Verweis (#5),
Schaden-Übernahme (Richtungs-Kostenträger + Idempotenz) alle korrekt erledigt. Abgelöste
Native-DnD-Entscheidung richtig behandelt (markiert, nicht gelöscht).

## Antworten auf die 3 Rückfragen

1. **Cross-Spalten-Drag = 2 Requests (Status + Reorder):** So lassen. Robust schlägt sparsam —
   Statuswechsel + neue Position sind zwei echte Änderungen. Keine Sonderfall-Optimierung
   („Reorder nur innerhalb Spalte") einbauen; bei dem Volumen unnötig.

2. **Tremor-Restnennung `003_crm_400` Section 7:** Ja, auf „shadcn-charts" angleichen — aber
   gebündelt beim **nächsten CRM-Touch**, kein eigener Lauf dafür. Rein kosmetisch (Charts sind
   real schon Recharts/shadcn-charts).

3. **E2E + Drag-Smoke nach Migration 020:** Ja, sinnvoll. ABER erst **nachdem 020 eingespielt**
   ist (sonst fehlt board_sort). Reihenfolge: 020 einspielen → E2E-Grobtests → kurzer
   Drag-Smoke (eine Karte verschieben + Reihenfolge prüfen).

## Wichtig (Blocker)

- **Migration `020_board_sort.sql` einspielen** (Supabase SQL-Editor). Bis dahin werfen
  `/vorgaenge/plantafel` und `/crm` einen Fehler (Spalte board_sort fehlt). Korrekt geparkt —
  das ist der einzige offene Schritt vor E2E.

## Spec-Nachzug (macht Konzept-Claude)

Sobald Max die aktuellen Specs hochlädt, zieht Konzept-Claude nach:
- 003_crm: Decision-Log (Native-DnD abgelöst → @dnd-kit/sortable), board_sort ins Datenmodell,
  Tech-Basis 400, Migration; Historie + Version.
- 004_ops: board_sort (200/500), Lucide-Icons (400), Schaden-Übernahme-Verfeinerung (200/300);
  Historie.
- 001_erp: Verweis-Reduktion 300/400 bestätigen; Historie.
