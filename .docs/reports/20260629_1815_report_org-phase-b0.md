# Report: Org Phase B0 — Migration geschrieben, NICHT angewandt (#21) — 2026-06-29 18:15 MESZ

Auftrag: `.docs/prompts/20260629_1810_prompt_org-phase-b0.md`. Erster schreibender Phase-B-Schritt.
**TOR aktiv → Migration nur GESCHRIEBEN + verifiziert, NICHT gegen Live angewandt** (Backup-OK und
firmen.typ-Zuordnung fehlen). Commit `ea58f99`. Tests 407 grün, Build grün. Review-Subagent: **FREIGABE**.

## 1) Gebaut (mit echten Tabellen/Feldern)

`supabase/migrations/029_org_phase_b0.sql` (nächste freie Nummer: höchste war 028 → 029). Idempotent,
`search_path wimus`. Enthält NUR **entschiedene** Schritte, fasst KEINE Bestandsdaten an:

1. **`alter table wimus.projekte drop column if exists marke;`** — `marke` real **0/7 befüllt**
   (vor dem Schreiben erneut per read-only SELECT verifiziert: `total 7, mit_marke 0`) → kein Inhalt verloren.
2. **`firmen.typ`-CHECK auf die NEUE Werteliste** (aus `_NOTE_b0-firmen-typ-offen.md`, Max 18:30):
   ```sql
   alter table wimus.firmen drop constraint if exists firmen_typ_check;
   alter table wimus.firmen
     add constraint firmen_typ_check
     check (typ is null or typ in ('privat','Einzelunternehmung','GbR','GmbH'));
   ```
   Ersetzt die alte Liste (`privat/operativ/vvGmbH/GbR/holding/sonstige`). Alle 3 firmen haben typ
   NULL (verifiziert) → Umstellung sicher, NULL bleibt erlaubt.

**Reale Objekte:** `wimus.projekte` (Spalte marke), `wimus.firmen` (Constraint firmen_typ_check,
3 Zeilen MMP/WIM/VVG, typ NULL).

## 2) Abweichungen

- **Gegenüber dem Prompt-Vorschlag** (firmen.typ = privat/operativ/vvGmbH per gezieltem UPDATE):
  Die neuere NOTE (`_NOTE_b0-firmen-typ-offen.md`, 18:30 > Prompt 18:10) **ändert die typ-Liste** auf
  `privat/Einzelunternehmung/GbR/GmbH` und macht damit eine **CHECK-Constraint-Anpassung** nötig
  (nicht nur ein UPDATE). Ich bin der neueren NOTE gefolgt (Liste umgestellt) und habe die
  **per-Firma-typ-Werte NICHT gesetzt** — die Zuordnung ist von Max ausdrücklich vertagt (NOTE #3).
  Geparkt als auskommentierter Platzhalter (`‹?›`) + Header-Hinweis. Nichts geraten.
- **Tracking-Inkonsistenz (Hinweis an Konzept-Claude):** Migration 004 (Tracking) deklariert die ALTE
  inline-CHECK `typ in ('privat','operativ','vvGmbH','GbR','holding','sonstige')`. Nach 029 weicht
  die reale Constraint davon ab. Auf einer frischen DB würde 004 die alte, 029 die neue Liste setzen
  (029 gewinnt, da später) — funktional ok, aber 004s Inline-Kommentar ist dann historisch. Konzept-
  Claude entscheidet, ob 004 nachgezogen wird (CC fasst Migrationen anderer nicht eigenmächtig an).

## 3) Offen

- **Migration NICHT angewandt** (Tor): wartet auf Max-Doppelfreigabe. Nach Freigabe: über /pg/query
  einspielen (exakte SQL s. Abschnitt 1), dann verifizieren (marke-Spalte = 0 Treffer; firmen_typ_check
  = neue Liste).
- **`firmen.taetigkeit` / Steuersatz-Struktur** (vom Review als Beobachtung markiert): in der NOTE als
  Überlegung erwähnt, aber bewusst NICHT in B0 — Attribut-/Tätigkeits-Steuermodell ist per Spec 021
  nach **B4** verschoben. Hier geparkt, damit es nicht verloren geht.
- `projekte.pfad` bleibt NULL → Backlog #23 (nicht spekulativ füllen).
- B1/B2 (gesellschaft→firma No-Op, objekte firma_id/projekt_id-Backfill ~10 Zeilen) = separate Aufträge.

## 4) Rückfragen — Freigaben für die Anwendung von 029

1. **DB-Backup bestätigt?** (Pflicht vor jedem Phase-B-Schreibschritt.) → dann darf 029 angewandt werden.
2. **firmen.typ-Zuordnung je Firma** (für den Folge-UPDATE, NICHT in 029): bitte aus der neuen Liste
   (`privat / Einzelunternehmung / GbR / GmbH`) zuordnen:
   - **MMP** „Maxim Moser (privat)" → ?  (privat? Einzelunternehmung?)
   - **WIM** „WIMUS GmbH" → GmbH?
   - **VVG** „WIMUS vvGmbH" → GmbH? (vvGmbH = GmbH-Variante)
   Sobald bestätigt, liefere ich den UPDATE (idempotent, `where … and typ is null`) als Nachtrag.
3. **CHECK-Liste final?** Falls `operativ`/`holding`/`sonstige` doch noch gebraucht werden (z.B. für
   spätere Firmen), bitte vor Anwendung sagen — die neue Liste entfernt sie.

> Stand: Datei committet (`ea58f99`), **noch nicht angewandt** — auf Freigabe wartend.
