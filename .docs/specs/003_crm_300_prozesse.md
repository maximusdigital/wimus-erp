---
gehoert_zu: 0003
dokument: Prozesse
geaendert: 2026-06-27
---

# 0003 — Prozesse

> Version & Status des Moduls stehen in `003_crm_000_konzept.md`.

## 1. Lead-Triage

1. Lead entsteht (manuell erfasst oder via Kanal/Agent 1) → status=neu, Quelle gesetzt.
2. In der Lead-Inbox (Liste, sortiert nach Eingang/Quelle) sichten.
3. Entscheidung:
   - **Qualifizieren** → Konvertierung (siehe 2). Lead status=konvertiert, `deal_id` gesetzt.
   - **Verwerfen** → status=verworfen + `verworfen_grund` (kein Bedarf, Spam, Dublette,
     unrealistisch). Bleibt für Auswertung erhalten, verschwindet aus der aktiven Inbox.
4. Kein Stage-Handling für Leads — bewusst nur Eingang + Triage.

## 2. Lead → Deal konvertieren

- Mandant/Einheit (`firma_id`) wählen — Pflicht (wer von uns macht das Geschäft).
- Kontakt: bestehenden `kontakt_id` übernehmen oder neuen Kontakt (0001) anlegen
  (Dublettenprüfung). Optional `organisation_id` (externe Firma) verknüpfen.
- Ziel-Pipeline + Start-Stage wählen.
- Optional Objekt/Einheit verknüpfen (z.B. Anfrage zu konkretem Objekt).
- Deal entsteht (status=offen), `in_stage_seit`=jetzt.

## 3. Deal durch die Pipeline (Kanban)

- Drag-and-Drop in nächste Stage → `deal_stage_historie` schreibt Übergang + Verweildauer
  in der alten Stage; `in_stage_seit` neu gesetzt.
- Jeder Stage-Eintritt kann die **Stage-Automatik** (Channel-Routing 3.2) auslösen:
  `pipeline_phase_aktionen` (bei_eintritt / nach_x_tagen) → `aktion_channels` → n8n parallel.
- **Stalled-Erkennung:** Tage-in-Stage ≥ `pipeline_stages.stalled_tage` → Warnung/Markierung
  auf der Karte (passt zu Fristen-/Alerting-Denken des Kerns).

## 4. Aktivitäten am Deal

- Typen: anruf/email/meeting/aufgabe/frist/notiz, mit `faellig_am`.
- „Nächste Aktion" = nächste offene Aktivität → prominent auf Deal-Karte & in Detailansicht.
- Anruf-Aktivität: SIP-Hook (`sip_referenz`) für späteren click-to-call (sipgate). Im MVP
  nur Hook/Feld, keine echte Telefonie.

## 5. Abschluss

- **Gewonnen:** status=gewonnen (Endstage). Folgeprozess je Pipeline möglich, z.B.
  Ankauf-Deal gewonnen → Objektanlage (0001) anstoßen; Mieter-Deal gewonnen → Vertrag.
- **Verloren:** status=verloren + `verloren_grund_id`. Basis für Stage-Leck-Analyse
  (welche Stage verliert, woran).

## 6. amoCRM-Ablösung (einmalig, OP-1)

amoCRM-Pipelines/Stages/Deals/Custom-Fields exportieren → auf 0003-Modell mappen → Import
→ Stage-Automatik-Bezug (Channel-Routing) von amoCRM-Phasen auf `pipeline_stages` umstellen
→ amoCRM stilllegen. Stichtag + Feld-Mapping festzulegen.

## 7. Querbezug

- Kontakte/Objekte: aus Kern (0001), nicht neu.
- Dubletten/Sperren/Audit: Kern-Datenintegrität (0001) gilt; Deal-/Lead-Spezifika in
  `003_crm_200_datenmodell.md` Abschnitt Datenintegrität.
- KI-Vorqualifizierung (Agent 1) und Insights/Forecast: später, nicht MVP.
