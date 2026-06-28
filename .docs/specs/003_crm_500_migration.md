---
gehoert_zu: 0003
dokument: Migration
geaendert: 2026-06-28
---

# 0003 — Migration

> Version & Status des Moduls stehen in `003_crm_000_konzept.md`.
> SQL als Download/`.txt`, idempotent (IF NOT EXISTS, ON CONFLICT DO NOTHING). Setzt
> Kern-Schema (0001) voraus. **Setzt Kern-Erweiterung voraus:** `organisationen` +
> `kontakte.organisation_id` (externe Firmen, Variante B) müssen im Kern existieren (OP-6).
>
> **Umgesetzt (2026-06-27):** `supabase/migrations/012_organisationen.sql` (Schritt 0:
> organisationen + kontakte.organisation_id) und `013_crm_pipelines.sql` (Schritte 1, 2, 4:
> alle `crm_`-Tabellen + RLS + Seed je Mandant) eingespielt. Schritt 3 (Stage-Automatik-Bezug
> Channel-Routing → `crm_pipeline_stages`) und Schritt amoCRM-Import (OP-1) noch offen.
>
> **Nachgezogen (2026-06-28):** `020_board_sort.sql` (modulübergreifend mit 004) — additiv
> `crm_deals.board_sort` INT NOT NULL DEFAULT 0 + Index für die manuelle Kanban-Reihenfolge
> (@dnd-kit/sortable, Reorder-Endpoint `/api/crm/deals/reorder`).

## Migrationsreihenfolge (Grobplan)

1. **Pipeline-Struktur:** `pipelines`, `pipeline_stages`, `verloren_gruende`. — Fundament.
2. **Deals & Leads:** `deals` (FK pipelines/stages + Kern: firma_id Pflicht/kontakt_id/
   organisation_id/objekt_id), `leads` (FK kontakte/organisation, deal_id NULL→deals),
   `deal_stage_historie`, `deal_aktivitaeten` (FK nachricht_id → Kern-Inbox optional),
   `custom_field_definitionen`. — Hängt an 1 + Kern.
3. **Stage-Automatik-Bezug:** bestehende Kern-Tabellen `pipeline_phase_aktionen`/
   `aktion_channels` (Channel-Routing 3.2) auf `pipeline_stages.id` referenzieren
   (FK ergänzen / Mapping aus amoCRM-Phasen).
4. **Seed:** Standard-Pipelines + Stages je Marke (OP-2), Standard-Verloren-Gründe —
   `ON CONFLICT DO NOTHING`.

## Idempotenz-Notizen

- CREATE TABLE mit `IF NOT EXISTS`; ENUMs via DO-Block (duplicate_object abfangen).
- UNIQUE: (pipeline_id, sortierung) auf `pipeline_stages`; partielles UNIQUE für
  default_pipeline je Marke.
- Seeds idempotent.

## RLS

Policies pro Tabelle nach `mandant_id`. Owner/Akteur-Sichtbarkeit über Akteure-Modell (0001).

## amoCRM-Migration (OP-1, einmalig)

amoCRM-Export (Pipelines/Stages/Deals/Custom-Fields/Aktivitäten) → Mapping-Skript → Import
nach obigem Modell. Stichtag + Feld-Mapping + Custom-Fields-Übernahme festzulegen. Danach
Channel-Routing-Bezug umstellen, amoCRM stilllegen.

## Offen

- OP-3 Custom-Fields: JSONB-Schema je Pipeline vs. eigene Felder-Tabelle — vor Migration klären.
