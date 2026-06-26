---
gehoert_zu: 0003
dokument: Architektur
geaendert: 2026-06-26
---

# 0003 — Architektur

> Version & Status des Moduls stehen in `00_konzept.md`.
> Baut auf 0001 (Kontakte, Objekte, Akteure-Modell, Channel-Routing 3.2).

## Systemgrenzen

- **Eingang:** Lead-Inbox (manuell + später Kanäle: Web-Formular/WhatsApp/Telefon/Portal,
  via Posteingang-Agent 1 / Channel-System 0001).
- **Kern:** Leads → Konvertierung → Deals im Kanban über Stages.
- **Automatik:** Stage-Wechsel triggert bestehende Kern-Mechanik (Channel-Routing 3.2:
  `pipeline_phase_aktionen` / `aktion_channels`, n8n parallel).
- **Telefonie:** Anruf-Aktivität trägt SIP-Hook (sipgate, TB09) — Integration später.
- **Ablösung:** amoCRM (TB24) → Deals werden migriert (OP-1).

## Verknüpfungsmodell (nichts doppelt pflegen)

Ein Deal verbindet drei bestehende Kern-Entitäten, statt eigene zu führen:

- **`firma_id`** → `firmen` (Mandant/Einheit, INNEN): wer von uns macht das Geschäft.
  Pflicht. Steuert RLS + spätere Buchung. Analog Pipedrives Deal-Feld „Pipeline".
- **`kontakt_id`** → `kontakte` (Person, AUSSEN): Ansprechpartner.
- **`organisation_id`** → `organisationen` (externe Firma, AUSSEN, Kern-Erweiterung B):
  Geschäftspartner mit mehreren Ansprechpartnern.

Wichtig: externe Firma (`organisationen`) ≠ eigener Mandant (`firmen`). amoCRM vermischt das
in „Companies"; wir trennen INNEN/AUSSEN bewusst. `organisationen` + `kontakte.organisation_id`
sind Kern-Erweiterung (0001), dieses Modul setzt sie voraus.

**Mandanten-Filter im Board:** oben analog Pipedrives Pipeline-Umschalter — wahlweise eine
Einheit isoliert oder mandantenübergreifend. RLS begrenzt auf berechtigte Einheiten.

## Funktionszuschnitt (Schichten)

| Schicht | Inhalt | im MVP? |
|---------|--------|---------|
| Lead-Inbox | Anfragen sammeln, Quelle, Triage (qualifizieren/verwerfen) | ✅ |
| Lead→Deal-Konvertierung | erzeugt Deal, verknüpft Kontakt/Objekt | ✅ |
| Pipelines + Stages | mehrere Pipelines, anpassbare Stages, Wahrscheinlichkeit | ✅ |
| Deal-Kanban | Drag-and-Drop, Deal-Karte (Wert/Kontakt/Tage-in-Stage/letzte Aktivität) | ✅ |
| Custom Fields | UI-konfigurierbar (Feldtyp, Pflicht/Wichtig, je Pipeline) — Vorbild Pipedrive | ✅ |
| Aktivitäten | Anruf/E-Mail/Termin/Aufgabe am Deal, „nächste Aktion" | ✅ |
| Stalled-Erkennung | Tage-in-Stage, Warnung bei Stillstand | ✅ |
| Verloren-Gründe | Grund bei „verloren" (Basis fürs Stage-Leck-Lernen) | ✅ |
| Stage-Automatik | Andocken an Channel-Routing 3.2 | ✅ |
| SIP click-to-call | Hook am Anruf, sipgate später | Hook ✅ / Integration später |
| Insights/Forecast | Conversion je Stage, Forecast, Durchlaufzeit | später (Reporting) |
| KI-Vorqualifizierung | Agent 1 sortiert Leads vor | später |

**Bewusst NICHT (Skip):** E-Mail-Marketing/Campaigns, eingebaute CRM-Telefonie/E-Mail-Sync,
KI-Sales-Assistant/Win-Probability, Marketplace-Integrationen, schwergewichtiger
Lead-Scoring-Funnel.

## Lead-Flow

1. Anfrage kommt rein (manuell erfasst oder via Kanal/Agent 1) → `leads` (status=neu).
2. Triage in der Lead-Inbox (Liste): sichten → **qualifizieren** oder **verwerfen** (+ Grund).
3. Qualifizieren → **Konvertierung**: erzeugt `deals`-Eintrag, verknüpft Kontakt (0001),
   optional Objekt/Einheit; Lead status=konvertiert.

## Deal-Flow

1. Deal liegt in einer Pipeline auf einer Stage.
2. Drag-and-Drop in nächste Stage → `deal_stage_historie`-Eintrag (für Tage-in-Stage + Audit)
   → triggert ggf. Stage-Automatik (Channel-Routing 3.2).
3. Aktivitäten (Anruf/Termin/Aufgabe) hängen am Deal; „nächste Aktion" sichtbar auf der Karte.
4. Abschluss: gewonnen (→ ggf. Folgeprozess, z.B. Ankauf-Deal → Objektanlage) oder
   verloren (+ Grund).

## Andocken an Stage-Automatik (Kern 0001, Channel-Routing 3.2)

Die bestehende Mechanik (`pipeline_phase_aktionen` Trigger `bei_eintritt`/`nach_x_tagen`,
`aktion_channels` 0..n, n8n `Promise.all`, View `v_faellige_phase_aktionen` täglich 06:00)
bleibt unverändert. Dieses Modul liefert das Datenmodell darunter (Pipelines/Stages/Deals),
auf das sich die Phasen-Aktionen beziehen.

## Bezug zu Kern-Akteuren

- Agent 1 (Posteingang): kann Leads vorqualifizieren/zuordnen (später).
- Akteure-Modell: Deal-Owner ist ein Akteur (Mensch/KI); Aktivitäten tragen Akteur + Timestamp.
