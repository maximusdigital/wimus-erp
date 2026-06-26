---
gehoert_zu: 0003
dokument: Tests
geaendert: 2026-06-26
---

# 0003 — Tests

> Version & Status des Moduls stehen in `00_konzept.md`.
> Test-Stack siehe Kern 0001 `60_tests.md` (Vitest, Playwright, supertest, pgTAP).

## Priorität 1 — Kernlogik (Unit)

### Lead-Triage & Konvertierung
- Lead verwerfen → status=verworfen + Grund; bleibt erhalten, raus aus aktiver Inbox.
- Lead qualifizieren → erzeugt Deal, verknüpft Kontakt, Lead status=konvertiert + deal_id.
- Deal-Anlage ohne `firma_id` (Mandant) → abgelehnt (Pflichtfeld).
- Konvertierung mit Organisation → `organisation_id` am Deal gesetzt; Kontakt optional.
- Konvertierter Lead → nicht erneut konvertierbar (gesperrt).

### Stage-Übergang & Historie
- Drag in nächste Stage → `deal_stage_historie`-Eintrag + Verweildauer alte Stage korrekt.
- `in_stage_seit` neu gesetzt; Tage-in-Stage = heute − in_stage_seit.
- Stalled: Tage-in-Stage ≥ stalled_tage → Warn-Flag.

### Abschluss
- Gewonnen → Endstage, status=gewonnen.
- Verloren → status=verloren + Grund (Pflicht).
- Abgeschlossener Deal → Stage nicht mehr per Drag änderbar (Sperre).

### Verknüpfung (Mandant/Kontakt/Organisation)
- Deal trägt `firma_id` (INNEN) ≠ `organisation_id` (AUSSEN) — beide getrennt befüllbar.
- RLS: Deal nur sichtbar für berechtigte Einheit (firma_id).
- Organisation mit n Ansprechpartnern: Deal an Organisation, Kontakt aus deren Personen.

### Custom Fields (UI-konfigurierbar)
- Pflichtfeld (`pflicht=true`) leer → Deal-Speichern abgelehnt.
- Feld nur `anzeige_detail` → erscheint nicht im Neu-Formular.
- Feld je Pipeline (`pipeline_id` gesetzt) → nur in dieser Pipeline sichtbar.
- Wert landet in `deals.custom_values` JSONB unter Field-ID.

### Wahrscheinlichkeit/Forecast (Basis)
- erwarteter Wert = wert × stage.wahrscheinlichkeit (für späteren Forecast).

## Priorität 1 — Integration

- Stage-Wechsel triggert Stage-Automatik (Channel-Routing 3.2): `pipeline_phase_aktionen`
  bei_eintritt → Aktion geloggt.
- Konvertierung legt Kontakt an mit Dublettenprüfung (Kern-Datenintegrität).

## Priorität 1 — DB (pgTAP)

- RLS: Mandant A sieht keine Deals/Leads von Mandant B.
- UNIQUE (pipeline_id, sortierung) greift; nur eine Default-Pipeline je Marke.
- FK deals → pipelines/stages/kontakte.

## E2E (Happy Path)

- Lead anlegen → qualifizieren → Deal im Kanban → durch 2 Stages draggen → Aktivität
  anlegen → gewonnen markieren.

## Migration (amoCRM)

- Mapping-Test: amoCRM-Beispiel-Deal → korrektes 0003-Deal-Mapping (Stage, Wert, Kontakt,
  Organisation, firma_id, Custom-Fields).
- amoCRM „Companies" → `organisationen` (AUSSEN), NICHT `firmen` (INNEN).
- Robot-/Booking-Auto-Kontakte werden beim Import bereinigt/markiert.
