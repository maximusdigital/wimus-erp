# Report: Live-DDL Org-Hierarchie extrahiert (Phase A von #21) — 2026-06-29 15:35 MESZ

Auftrag: `.docs/prompts/20260629_1510_prompt_org-ddl-extraktion.md`. **Reiner Lese-/Extraktions-
Auftrag** — keine Schema-Änderung, keine Migration, kein Schreibzugriff. Alle Abfragen SELECT
(read-only) über `/pg/query`; kein Bestätigungs-Guardrail nötig (gilt nur für Schreibzugriffe).

## 1) Gebaut (extrahiert, mit echten Tabellen/Feldern)

Roh-DDL der drei Org-Tabellen `wimus.workspaces`, `wimus.firmen`, `wimus.projekte` (+ Abhängigkeiten)
in **`.docs/_NOTE_org-hierarchie-live-ddl.md`** abgelegt (2451 Zeilen, je Abschnitt roh als JSON,
nicht interpretiert). 10 SELECT-Abfragen ausgeführt:

| Abschnitt | Inhalt | Ergebnis |
|-----------|--------|----------|
| 1 Spalten | information_schema.columns | **115 Zeilen** — workspaces 19, firmen 49, projekte 47 |
| 2 Constraints | PK/FK/UNIQUE/CHECK | 27 Zeilen |
| 3 Indizes | pg_indexes | (vollständig in NOTE) |
| 4 RLS-Policies | pg_policies | je Tabelle **1** Policy `p_org_read` |
| 4b RLS aktiv? | pg_class | alle drei `relrowsecurity=true`, force=false |
| 5 Trigger | information_schema.triggers | je Tabelle `trg_*_updated_at` → `wimus.set_updated_at()` |
| 6a FK ausgehend | von den drei → andere | s.u. |
| 6b FK eingehend | Fachtabellen → die drei | s.u. (viele) |
| 6c/6d | abhängige Tabelle **außerhalb** (akteure) | Spalten + Constraints gezogen |

**FK ausgehend (6a):**
- `firmen.workspace_id → workspaces`, `firmen.mutter_firma_id → firmen` (Selbst-FK, Holding)
- `projekte.workspace_id → workspaces`, `projekte.firma_id → firmen`,
  `projekte.parent_projekt_id → projekte` (Selbst-FK, Baum), `projekte.projektmanager_id → akteure`

**RLS (4/4b):** Alle drei aktiv. Genau **eine** Policy je Tabelle: `p_org_read` (cmd=SELECT,
roles `{anon,authenticated}`, qual=`true`, with_check=null). **Keine INSERT/UPDATE/DELETE-Policy**
→ Schreiben nur über Service-Role; Lesen offen. (Kein `mandant_isolation`-Muster — Org-Tabellen
folgen dem neuen Workspace/Firma/Projekt-Modell, nicht dem alten mandant_id-Schema.)

**Trigger:** je Tabelle `BEFORE UPDATE` → `wimus.set_updated_at()`.

## 2) Abweichungen

- Keine. Auftrag war read-only; nichts am Schema verändert, nichts erzwungen.
- Hinweis Roh-Daten: In Abschnitt 2 (Constraints) erscheinen NOT-NULL-Constraints als CHECK-Zeilen
  mit Catalog-Namen (`21022_24571_1_not_null` etc.) — Postgres-Eigenheit (NOT NULL = interner
  CHECK). Die fachlich relevanten benannten CHECKs sind: `firmen_typ_check`,
  `firmen_rechtsform_typ_check`, `firmen_besteuerungsart_check`, `firmen_umsatzsteuer_typ_check`,
  `firmen_umsatzsteuer_period_check`, `projekte_typ_check`, `projekte_status_check`. Die jeweiligen
  Wertelisten stehen in `check_clause` (Abschnitt 2 der NOTE).

## 3) Offen

- **Abhängige Tabelle außerhalb der drei:** `akteure` (über `projekte.projektmanager_id → akteure`).
  Deren Spalten + Constraints sind in der NOTE (6c/6d) mit drin. **Konzept-Claude muss entscheiden,
  ob Migration 004 `akteure` mit umfasst** oder ob `akteure` in einer anderen (getrackten) Migration
  lebt und 004 nur die FK referenziert. `akteure` ist KEINE der drei Org-Tabellen — vermutlich
  eigene Migration; 004 würde dann nur den FK-Verweis brauchen.
- Migration 004 selbst NICHT geschrieben/angewandt (auftragsgemäß — macht Konzept-Claude aus der NOTE).

## 4) Rückfragen / Auffälligkeiten fürs Schema

1. **Schon breit verdrahtet (FK eingehend, 6b):** Viele Fachtabellen hängen bereits per FK an den
   Org-Tabellen — u.a. an **firmen**: belege, beteiligungen, crm_deals, crm_leads, feststellungen,
   fibu_buchungen, fibu_konten, kontierungsregeln, lieferanten, mandant_beziehungen; an **projekte**:
   abteilungen, akteur_gruppen, citytax_saetze, funnels, kommunikationskanaele, kpi_api_integrationen,
   kpi_werte, landingpages, pipelines, projekt_channels, vorlagen; an **workspaces**: akteure,
   channels. → Die Org-Hierarchie ist real bereits Anker vieler Module. Migration 004 muss diese
   Tabellen NICHT enthalten, aber Konzept-Claude sollte wissen: 004 ist Voraussetzung (FK-Ziel) für
   all diese bestehenden Verweise — Reihenfolge in der Migrationskette beachten.
2. **RLS write-offen nur via Service-Role:** Keine Schreib-Policy auf den Org-Tabellen. Falls 004
   das so festschreiben soll (gewollt?) — oder ob künftig rollenbasierte Write-Policies geplant sind
   (vgl. neues Modul `010_berechtigungen`) — bitte in der Spec klären.
3. Keine Überraschungs-Spalten festgestellt, die 006 nicht gehabt hätte (NOTE ist die Wahrheit für
   den Abgleich — firmen mit 49 Spalten ist die umfangreichste).
