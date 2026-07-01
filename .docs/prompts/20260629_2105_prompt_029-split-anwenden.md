# Auftrag: 029 splitten (nur firmen.typ-CHECK-Swap) + anwenden (2026-06-29 21:05 MESZ)

Konzept-Claude-Entscheidung nach deinem Apply-Stopp (Report 2045): **029 wird auf den
abhängigkeitsfreien Teil reduziert.** Der `marke`-Drop wandert nach Phase D (er hängt an der
untracked View `v_projekt_effektiv` + `projekt-form.tsx` — das ist ein eigener, getesteter Schritt,
kein B0-Stammdaten-Schritt). Du hast beim Stopp genau richtig gehandelt (kein CASCADE geraten).

## Was zu tun ist

### 1. Migration 029 reduzieren
`supabase/migrations/029_org_phase_b0.sql` so ändern, dass sie NUR noch den firmen.typ-CHECK-Swap
enthält. Den `marke`-Drop-Block (`alter table wimus.projekte drop column if exists marke;`) HERAUS-
nehmen. Header anpassen: marke-Drop → Phase D verschoben (Grund: untracked View v_projekt_effektiv +
projekt-form.tsx-Feld), B0 = nur CHECK-Swap. Der geparkte per-Firma-UPDATE-Block bleibt raus
(typ-Werte kommen über die UI). Ergebnis-SQL (das ist der GESAMTE wirksame Inhalt):

```sql
set search_path to wimus, public;
alter table wimus.firmen drop constraint if exists firmen_typ_check;
alter table wimus.firmen
  add constraint firmen_typ_check
  check (typ is null or typ in ('privat','Einzelunternehmung','GbR','GmbH'));
```

Idempotent, unverändert in der Nummer (029 bleibt 029 — sie ist committet, aber noch NICHT
angewandt, daher ist Inhaltsänderung + neuer Commit sauber; KEIN force-push, normaler Commit).

### 2. Anwenden (Backup steht, Guardrail einhalten)
- Backup ist bestätigt weggesichert (Report 2045) → Vorstufe erfüllt.
- Re-Check read-only: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
  WHERE conrelid='wimus.firmen'::regclass AND conname='firmen_typ_check';` → zeigt noch alte Liste.
- Exakte SQL zeigen, über /pg/query anwenden.
- Verifizieren: dieselbe Abfrage → neue Liste (privat/Einzelunternehmung/GbR/GmbH). Plus:
  `SELECT kuerzel, typ FROM wimus.firmen ORDER BY kuerzel;` → typ weiter NULL (Werte kommen via UI).

### 3. NICHT tun
- marke NICHT droppen (Phase D). v_projekt_effektiv NICHT anfassen. projekt-form.tsx NICHT ändern.
- KEINE firmen.typ-Werte setzen (UI).
- Specs/Backlog NICHT ändern (Konzept-Claude-Hoheit — Spec ist schon aktualisiert).

## Zyklus
- Git-Sicherung. `npm run test:run` + `npm run build` grün. Review-Subagent (diff gegen reduzierte
  029 + Spec-B0: nur CHECK-Swap, idempotent, kein marke, kein Wert-Setzen). Commit nach grün +
  erfolgreicher Verifikation. Kein force-push.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_029-split-angewandt.md` (4 Abschnitte): reduzierte 029,
angewandte SQL, Verifikation (neue CHECK-Liste aktiv, typ NULL), Status. Nächste Schritte: B2
(objekte.firma_id + einheiten.projekt_id-Backfill, ~10 Objekte, mit Max-Gegenprüfung) als eigener
Auftrag; marke-Drop als Phase-D-Punkt notiert.

## Leitplanken
- Guardrail: SQL zeigen → anwenden. Idempotent. Bei Unsicherheit STOPP + parken.
