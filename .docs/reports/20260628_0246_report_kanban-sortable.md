# Stand-Report — Kanban auf @dnd-kit/sortable + Schaden-Übernahme (2026-06-28)

> Betrifft Modul **004 ops** (Plantafel) und **003 crm** (Deal-Board) sowie Kern-Verweise.
> Sicherung: Tag `sicherung/vor-festschreiben-004-20260628-0125`. **SQL offen: Migration 020.**

## 1. Gebaut (echte Dateien/Felder)

**Schaden-Übernahme (004, verfeinert):**
- Kostenträger automatisch aus Übergabe-Richtung (Auszug→`mieter`, Einzug→`vermieter`,
  Override via `kostentraeger`); Idempotenz: `vorgang_foto.ki_analyse.schaeden[index].uebernommen`
  + `folge_vorgang_id`, erneute Übernahme → 409. `app/api/vorgaenge/[id]/schaden-uebernehmen`
  umgebaut (`{fotoId,index}`), `lib/validations/foto-analyse.ts` + UI `vorgang-fotos.tsx`.

**Kanban auf @dnd-kit/sortable (003 + 004):**
- Dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (React 19 / Next 16
  webpack kompatibel, saubere Peer-Deps).
- Gemeinsamer Multi-Container-Sortable-Hook `lib/hooks/use-kanban-dnd.ts` (Cross-Container-Move
  + Reorder, persistiert genau einmal je Drop).
- `components/vorgaenge/plantafel-board.tsx` + `components/crm/kanban-board.tsx` neu mit
  `SortableContext`/`useSortable`/`DragOverlay`, PointerSensor (Distanz 8 → Link/Dropdown
  klickbar), Dropdown-Fallback (Mobile/a11y) bleibt.
- **Manuelle Reihenfolge persistent:** `vorgaenge.board_sort` + `crm_deals.board_sort`
  (Migration **020**, additiv). Reorder-Endpoints `/api/vorgaenge/reorder` + `/api/crm/deals/reorder`
  (board_sort = Position). Page-Queries (`plantafel`, `crm`) ordern board_sort zuerst.
- **Typ-Icons** (#7) auf Lucide-Set umgesetzt (Plantafel-Karte): AlertTriangle/Wrench/Sparkles/
  KeyRound/Hammer/Mail/FileX/CircleDot — keine Emoji mehr.

**Kern-Verweis (#5):** `001_erp_300` Schadens-Staffel + `001_erp_400` RowActions-Zeile auf
Verweis → 004 reduziert; Datenmodell war bereits ausgelagert. Kein doppelter Vorgangs-Inhalt.

**Qualität:** `npm run build` grün (beide Reorder-Routen registriert), `npm run test:run` 298 grün.
**E2E bewusst noch nicht gelaufen** — `/plantafel` + `/crm` fragen `board_sort` ab, das erst nach
Migration 020 existiert.

## 2. Abweichungen (behoben)

- CRM-Spec 0003 schrieb „native HTML5-DnD, KEINE dnd-kit" — driftete gegen die jetzige
  Entscheidung. Decision-Log **ergänzt** (alte Entscheidung als ABGELÖST markiert, nicht
  gelöscht), Tech-Basis 400 + Datenmodell 200 (board_sort) + Migration 500 nachgezogen.
- 004-Spec sagte „native HTML5-DnD wie CRM" → auf @dnd-kit/sortable aktualisiert.

## 3. Offen / Hinweise

- **SQL-Stop:** Migration `020_board_sort.sql` muss eingespielt werden (Supabase SQL-Editor).
  Bis dahin werfen `/vorgaenge/plantafel` und `/crm` einen Fehler (Spalte fehlt). Danach E2E.
- **StrictMode/Dev:** der Reorder-Persist läuft einmal je Drop (itemsRef, kein Updater-Seiteneffekt).
- **Forecast/Insights 0003** referenziert in `003_crm_400` noch „Tremor" (Section 7, später) —
  kosmetische Inkonsistenz (Charts sind real Recharts/shadcn-charts); nicht in diesem Scope.
- Bestehende offene 004-Punkte unverändert: Forderung/Kaution-Auto-Verknüpfung, OP-6-Drop,
  Modellgüte-Vorbehalt KI-Schwellen.

## 4. Rückfragen / Entscheidungen

1. **Cross-Spalten-Drag schreibt 2 Requests** (Status/Stage + Reorder). Ok so, oder Reorder
   nur bei reinem Innerhalb-Spalten-Move? (Aktuell: immer Reorder der Zielspalte — robust.)
2. **Tremor-Restnennung** in `003_crm_400` Section 7 (Insights, später) auf „shadcn-charts"
   angleichen — beim nächsten CRM-Touch miterledigen?
3. Nach Einspielen von 020: soll ich die eingeloggten E2E-Grobtests laufen lassen und einen
   kurzen Drag-Smoke (eine Karte verschieben + Reihenfolge) ergänzen?
