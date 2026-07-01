# Report: 029 gesplittet (nur firmen.typ CHECK) + ANGEWANDT (#21 B0) — 2026-06-29 21:15 MESZ

Auftrag: `.docs/prompts/20260629_2105_prompt_029-split-anwenden.md`. Voller Zyklus inkl. Anwendung.
Commit `69d4e17`. Tests 407 grün, Build grün. Review-Subagent: **FREIGABE**.
Über `/pg/query` eingespielt (Backup bestätigt weggesichert, Guardrail: SQL gezeigt).

## 1) Reduzierte Migration 029

`supabase/migrations/029_org_phase_b0.sql` auf den **abhängigkeitsfreien** Teil reduziert (Inhalts-
änderung + normaler Commit, keine Nummernänderung, kein force-push). **Gesamter wirksamer Inhalt:**

```sql
set search_path to wimus, public;
alter table wimus.firmen drop constraint if exists firmen_typ_check;
alter table wimus.firmen
  add constraint firmen_typ_check
  check (typ is null or typ in ('privat','Einzelunternehmung','GbR','GmbH'));
```

Der `projekte.marke`-Drop wurde **entfernt** und in den Header als **Phase-D-Punkt** dokumentiert
(Grund: untracked View `v_projekt_effektiv` + `projekt-form.tsx`-Feld — eigener getesteter Schritt).
Keine firmen.typ-Werte gesetzt (UI). Idempotent.

## 2) Anwenden + Verifikation (live)

- **Re-Check vorher** (read-only): `firmen_typ_check` = alte Liste (`privat/operativ/vvGmbH/GbR/holding/sonstige`).
- **Angewandt** über `db-apply.mjs 029` (BEGIN…COMMIT) → HTTP 200, erfolgreich.
- **Verifiziert** (read-only):
  - `firmen_typ_check` NACHHER = **neue Liste**: `CHECK ((typ IS NULL) OR typ IN ('privat','Einzelunternehmung','GbR','GmbH'))`. ✅
  - `firmen.typ`: MMP/VVG/WIM weiterhin **NULL** (Werte kommen über UI). ✅
  - `projekte.marke`: Spalte **existiert weiterhin** (1) → korrekt nach Phase D verschoben, nicht angefasst. ✅

## 3) Abweichungen

- Keine. Genau der Split wie beauftragt; marke-Drop bewusst nicht enthalten.
- Review-Finding (KLEIN): Verifikations-Kommentar nutzt `firmen.kuerzel` — Spalte existiert real
  (MMP/WIM/VVG, im Vorlauf bestätigt), Query lief korrekt.

## 4) Status / nächste Schritte

- **029 angewandt ✅** — neue firmen.typ-CHECK-Liste live, B0 (der ausführbare Teil) abgeschlossen.
- **Phase D:** `projekte.marke`-Drop = eigener Schritt — View `v_projekt_effektiv` droppen + ohne
  `marke` neu anlegen + erstmals tracken (sie ist untracked) + `marke`-Feld aus `projekt-form.tsx`
  entfernen (App-Change mit Tests). Von Konzept-Claude zu terminieren.
- **B1:** No-Op (gesellschaften leer).
- **B2:** `objekte.firma_id` + `einheiten`/objekte `projekt_id`-Backfill (~10 Objekte, mit
  Max-Gegenprüfung der Zuordnung) — eigener Auftrag.
- firmen.typ-Werte (MMP/WIM/VVG) pflegt Max über die UI (CHECK erlaubt jetzt die passende Liste).
