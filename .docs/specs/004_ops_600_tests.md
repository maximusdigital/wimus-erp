---
gehoert_zu: 0004
dokument: Tests
geaendert: 2026-06-27
---

# 0004 — Tests

> Version & Status stehen in `004_ops_000_konzept.md`. Test-Stack siehe Kern
> `001_erp_600_tests.md` (Vitest, Playwright, supertest, pgTAP).

## Priorität 1 — Engine-Kernlogik (Unit, rein/DB-frei in `lib/ops/`)

### Status-Flow
- Erlaubte Übergänge: offen→zugewiesen→in_arbeit→(wartet_extern)→erledigt→abgenommen;
  abgebrochen aus offenen Status. Unerlaubter Sprung → abgelehnt.
- Abgeschlossener Vorgang (erledigt/abgenommen/abgebrochen) → kein Drag/Statuswechsel ohne
  explizite Reaktivierung (Verlauf-Eintrag).
- `statusUebergang(vorgang, neu)` liefert Verlauf-Eintrag {von, nach, am} + Patch.

### Eskalation
- `istEskaliert(prioritaet, faellig_am, jetzt)`: notfall sofort; sonst bei Überfälligkeit.

### Typ-Zuordnung
- Vorgang `typ` bestimmt genau eine Zusatztabelle; `vorgang_<typ>` 1:1.
- Schaden-Schwere → `abwicklungsstufe` (Staffel <50/…/>10.000).

### Zuweisung
- intern (Akteur) XOR extern (Organisation/Handwerker) je Zuweisung sinnvoll befüllt.
- externe Zuweisung setzt Auftrag-Status `beauftragt` + `auftrag_versendet_am` (Hook).

## Priorität 1 — Integration / DB (pgTAP)
- RLS: Mandant A sieht keine Vorgänge/Zuweisungen/Fotos von B.
- FK `vorgang_<typ>.vorgang_id` → vorgaenge; PK verhindert Doppel-Zusatz.
- `forderungen.vorgang_id` Verknüpfung bei Schaden.

## E2E (Happy Path)
- Vorgang anlegen (Typ Schaden) → Akteur zuweisen → in_arbeit → Foto + Checkliste →
  erledigt → Forderung verknüpft. Plantafel: Karte zwei Spalten weiterziehen → Verlauf wächst.

## Offen / später
- KI-Prüf-Loop (Schwellen/Versuche), Foto-Capture, Benachrichtigungs-Zustellung — Hooks, daher
  jetzt nur Feld-/Status-Tests, keine End-to-End-Lieferung.
