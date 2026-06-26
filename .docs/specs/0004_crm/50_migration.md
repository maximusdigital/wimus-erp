---
gehoert_zu: 0003
dokument: Migration
geaendert: 2026-06-26
---

# 0003 — Migration

> Version & Status des Moduls stehen in `00_konzept.md`.
> SQL als Download/`.txt`, idempotent (IF NOT EXISTS, ON CONFLICT DO NOTHING). Setzt
> Kern-Schema (0001) voraus. **Setzt Kern-Erweiterung voraus:** `organisationen` +
> `kontakte.organisation_id` (externe Firmen, Variante B) müssen im Kern existieren (OP-6).

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
