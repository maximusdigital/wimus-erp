---
id: 0003
titel: CRM-Pipelines (Leads & Deals, Kanban)
status: in_arbeit          # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.2.0             # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: crm-pipelines
erstellt: 2026-06-26
geaendert: 2026-06-27
abhaengt_von: [0001]
---

# 0003 — CRM-Pipelines (Leads & Deals, Kanban)

## Worum geht's

ERP-eigenes, visuelles Vertriebs-Pipeline-Management nach Vorbild amoCRM/Pipedrive:
Leads sammeln und qualifizieren, daraus Deals machen, Deals per Drag-and-Drop durch
anpassbare Stages eines Kanban-Boards schieben. Bewusst schlank — der Kanban-Kern plus
Aktivitäten-Layer plus Stage-Automatik, ohne Marketing-/Telefonie-/KI-Ballast.

Löst **amoCRM ab** (Deals migrieren ins ERP). **UI-Vorbild: Pipedrive** (klarer als amoCRM). Dockt an die bestehende Stage-Automatik des
Kerns an (Channel-Routing 3.2: `pipeline_phase_aktionen` / `aktion_channels`). Nutzt
vorhandene Kontakte/Objekte (0001), erfindet sie nicht neu.

Typische Pipelines bei WIMUS: Eigentümer-Akquise, Ankauf (ALFA DEVELOPMENT),
Mieter-Gewinnung (ALFA CAMPUS/LZV), KZV-Anfragen (ALFA APARTMENTS).

## Steht (gebaut & läuft)

- **MVP nativ implementiert (2026-06-27, Migrationen 012/013):**
  - Datenmodell `crm_pipelines`, `crm_pipeline_stages`, `crm_verloren_gruende`,
    `crm_custom_field_definitionen`, `crm_deals`, `crm_deal_stage_historie`,
    `crm_deal_aktivitaeten`, `crm_leads` (Schema `wimus`, RLS `mandant_isolation`).
  - Kern-Erweiterung `organisationen` + `kontakte.organisation_id` (Migration 012).
  - **Deal-Kanban** `/crm` (native HTML5-DnD + Stage-Dropdown je Karte, Pipeline-Umschalter,
    **Mandanten-/Einheit-Filter**, **Ansicht-Umschalter Kanban/Liste**, Summe/Anzahl,
    Stalled-Warnung, Tage-in-Stage). Forecast-Ansicht später (Reporting).
  - **Lead-Inbox** `/crm/leads` (Liste, Konvertieren-Dialog, Verwerfen + Grund).
  - **Deal-Detail** `/crm/deals/[id]` (Stage-Fortschritt, Zusammenfassung + gewichteter Wert,
    Custom-Fields, Aktivitäten anlegen/abhaken, Verlauf aus Stage-Historie, Gewonnen/Verloren).
  - **Aktivitäten-Übersicht** `/crm/aktivitaeten` (über alle Deals, Filter, überfällig/heute).
  - **Pipeline-/Stage-Verwaltung** `/crm/pipelines` + **Datenfelder** `/crm/datenfelder`.
  - API unter `/api/crm/*`; reine Logik in `lib/crm/` (stage/lead/deal) mit 14 Unit-Tests.
  - Seed: je Mandant Default-Pipeline „Akquise" (6 Stages) + Standard-Verloren-Gründe.
- Stage-Automatik-Mechanik im Kern vorhanden (Channel-Routing 3.2) — Andocken an
  `crm_pipeline_stages` offen (Kern-FK).
- amoCRM (TB24) aktuell produktiv — wird durch dieses Modul abgelöst.

## In Arbeit

- amoCRM-Datenmigration (OP-1) · Andocken Stage-Automatik an `crm_pipeline_stages` (50_migration §3)
- Bulk-Aktionen Lead-Inbox · Insights/Forecast-Ansicht (Reporting-Phase)

## Ideen / als Nächstes

- Pipeline-Insights (Conversion je Stage, Forecast, Durchlaufzeit) → Reporting-Phase
- KI-Vorqualifizierung von Leads über Posteingang-Agent (Agent 1)
- SIP-Telefonie-Integration (sipgate, TB09) am Anruf-Hook — später

## Entscheidungen (warum es so ist)

- 2026-06-26: **amoCRM wird abgelöst**, Deals migrieren ins ERP. Grund: eine Wahrheit,
  keine Doppelpflege/Sync-Last. Migration der Bestands-Deals als eigener Schritt.
- 2026-06-26: **Lead vs. Deal getrennt, aber leichtgewichtig.** Lead = schlanke Inbox
  (Liste, kein Kanban) für unqualifizierte Anfragen; Deal = volles Kanban. Grund: hält das
  Board sauber (Anfragen wie „Wohnung frei?" vermüllen sonst die Pipeline), ohne zweites
  Schwergewicht-System.
- 2026-06-26: **Funktionszuschnitt minimal** (MVP = Kanban-Kern + Aktivitäten +
  Stage-Automatik). Bewusst NICHT im MVP: E-Mail-Marketing/Campaigns, eingebaute CRM-
  Telefonie/E-Mail-Sync, KI-Sales-Assistant/Win-Probability, Marketplace-Integrationen,
  Lead-Scoring-Funnel. Grund: teils nicht gebraucht, teils anderswo gelöst (sipgate,
  GreenAPI, SEO/Sales-Skills, geplante KI-Controlling-Ebene).
- 2026-06-26: **SIP nur als Hook vorgesehen, nicht nachgebaut.** Anruf-Aktivität kann eine
  sipgate-Referenz tragen (click-to-call); echte Telefonie-Integration ist späterer,
  abgegrenzter Baustein.
- 2026-06-26: **Pipelines docken an bestehende Kern-Automatik an** (Channel-Routing 3.2)
  statt neue Automatik zu bauen. Grund: Mechanik existiert, braucht nur das Datenmodell.
- 2026-06-26: **Verknüpfungsmodell statt Doppelpflege.** Ein Deal verweist auf `firma_id`
  (Mandant/Einheit, INNEN, Kern), `kontakt_id` (Person, AUSSEN, Kern) und `organisation_id`
  (externe Firma, AUSSEN, Kern). CRM hält keinen eigenen Kontakt-/Firmenstamm. Grund:
  „nichts doppelt pflegen".
- 2026-06-26: **Externe Firmen relational (Variante B) — Kern-Erweiterung.** `organisationen`
  + `kontakte.organisation_id` (mehrere Ansprechpartner je Firma). Wichtig: externe Firma
  (Geschäftspartner) ≠ Mandant/`firmen` (eigener Buchungskreis). amoCRM vermischt beides in
  „Companies" — wir trennen es bewusst. Definition gehört in Kern (0001), nicht ins CRM-Modul.
- 2026-06-26: **Mandanten-Integration wie Pipedrive-Pipeline-Feld.** Einheit/Mandant ist ein
  Pflichtfeld am Deal (`firma_id`, analog Pipedrives Deal-Feld „Pipeline"). Mandanten-Filter
  oben im Board (analog Pipeline-Umschalter) → einzelne Einheit oder übergreifende Sicht. RLS
  filtert nach berechtigten Einheiten.
- 2026-06-26: **Custom Fields UI-konfigurierbar (Vorbild Pipedrive Bild 8–10).**
  `custom_field_definitionen` mit Feldtyp, Anzeige-Position (Neu/Detail), Qualitätsregeln
  Pflicht/Wichtig, optional je Pipeline. Werte in `*.custom_values` JSONB. Pflege über UI.
- 2026-06-26: **Pipedrive als UI-Vorbild** (statt amoCRM): Deal-Detail mit Stage-
  Fortschrittsbalken + Tage-in-Stage + Gewonnen/Verloren, Aktivitäts-Tabs (E-Mail+Messaging
  am Deal vereint), eigenständige Aktivitäten-Liste, Verlauf/Audit-Timeline.
- 2026-06-26: **Unified Inbox gehört in den Kern**, nicht ins CRM (hängt an `kontakte` +
  Channel-System). Deal-Detail zeigt Nachrichten via `nachricht_id`, dupliziert sie nicht.
  Damit löst der Kern amoCRMs Trennung imBox/Mail auf („besser machen").
- 2026-06-27 (Impl.): **Tabellen-Prefix `crm_`.** Migration 002 enthält ungenutzte v5-Stubs
  `deals`/`pipelines`/`pipeline_phasen`/`custom_field_definitionen`/`interessenten` (anderes
  Modell, kein Code). Prefix `crm_` vermeidet Kollision ohne destruktiven DROP — analog
  `fibu_buchungen` ≠ `buchungen` (KZV).
- 2026-06-27 (Impl.): **Kanban via native HTML5-DnD statt dnd-kit.** Keine neue Dependency
  unter React 19 / Next 16 (webpack); konsistent mit der bestehenden Plantafel. A11y/Mobile
  über Stage-Dropdown je Karte (Spec verlangt ohnehin „kein Drag erzwingen" auf 390px).
- 2026-06-27 (Impl.): **Zeitstempel `created_at`/`updated_at`** (Kern-Konvention + Touch-
  Trigger) statt der Grobspec-Begriffe `erstellt_am`/`geaendert_am`. Domänen-Zeitfelder
  (`in_stage_seit`, `faellig_am`, `abgeschlossen_am`) bleiben.
- 2026-06-27 (Impl.): **`owner_akteur_id`/`akteur_id` als bare UUID ohne FK** (wie
  `fibu_buchungen.akteur_id`) — Akteure-Modell wird nicht hart referenziert.
- 2026-06-27 (Impl.): **Reaktivierung** eines abgeschlossenen Deals = expliziter PATCH
  `status=offen` (+ Grund/Abschlussdatum leeren); Drag bleibt für gewonnen/verloren gesperrt.

## Offene Punkte

- OP-1: amoCRM-Migration — welche Felder/Pipelines/Deals übernehmen, Mapping, Stichtag.
- OP-2: Welche Standard-Pipelines + Stages initial seeden (je Marke/Prozess)?
- OP-3: Custom-Fields je Pipeline — fix definiert oder frei konfigurierbar in der UI?
- OP-4: Lead-Quellen-Anbindung (Web-Formular/WhatsApp/Telefon/Portal) — welche zuerst?
- OP-5: Verknüpfung Deal → Objekt/Einheit/Vertrag (z.B. Ankauf-Deal → späteres Objekt).
- ~~OP-6: Kern-Erweiterung organisationen~~ → **erledigt 2026-06-27**: `organisationen` +
  `kontakte.organisation_id` als Migration 012 gebaut + eingespielt (RLS, Trigger).
- ~~OP-2: Standard-Pipelines/Stages seeden~~ → **erledigt 2026-06-27**: Seed je Mandant
  (Default-Pipeline „Akquise" mit 6 Stages + 6 Standard-Verloren-Gründe) in Migration 013.
- OP-7: **Unified Inbox im Kern** (Messaging + Mail zusammengeführt) — Deal-Aktivitäten
  referenzieren `nachricht_id`. Konzeption im Kern, nicht hier.
- OP-8: Mandanten-Zuordnung eines Leads/Deals automatisch ableiten (aus Quelle/Kanal/Objekt)
  vs. manuell setzen.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 0.1.0 | 2026-06-26 | in_arbeit | Grobspec: Lead-Inbox + Deal-Kanban, Verknüpfungsmodell (Mandant/Kontakt/Organisation), Custom Fields UI-konfigurierbar, Pipedrive-UI-Vorbilder, amoCRM-Ablösung, Andocken an Stage-Automatik |
| 0.2.0 | 2026-06-27 | in_arbeit | MVP nativ implementiert: Migrationen 012 (organisationen) + 013 (crm_-Tabellen + Seed), Kanban/Lead-Inbox/Deal-Detail/Aktivitäten/Pipeline-+Datenfelder-Verwaltung, `/api/crm/*`, `lib/crm/*` + 14 Unit-Tests. Build + 259 Tests grün. |

## Änderungshistorie

> Laufendes Protokoll aller Änderungen am Modul (neueste oben). Vorgang ≤ 100 Zeichen.

| Datum/Zeit | Vorgang | Betroffen |
|------------|---------|-----------|
| 2026-06-27 01:35 | Board: Mandanten-/Einheit-Filter + Ansicht-Umschalter Kanban/Liste ergänzt | 000_konzept, Code |
| 2026-06-27 00:30 | MVP implementiert (Mig. 012/013, API, UI, lib+Tests); Spec nachgezogen | alle + Code |
| 2026-06-26 15:30 | Kanban-Tech-Basis ergänzt (dnd-kit, Shadcn-Vorlage, memo-Pattern) | 003_crm_400_design |
| 2026-06-26 15:00 | Verknüpfungsmodell + Pipedrive-UI + Custom Fields eingearbeitet | 000,100,200,300,400,500 |
| 2026-06-26 14:00 | Grobspec 0003 erstellt (Lead-Inbox + Deal-Kanban, amoCRM-Ablösung) | alle |
