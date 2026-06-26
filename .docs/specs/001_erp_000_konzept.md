---
id: 0001
titel: ERP-Kern
status: in_arbeit          # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 5.0.0             # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: erp-kern
erstellt: 2026-06-23
geaendert: 2026-06-26
abhaengt_von: []
---

# 0001 — ERP-Kern

## Worum geht's

Das WIMUS-ERP ist die zentrale Schaltzentrale für die Immobilienverwaltung der
WIMUS-Gruppe (ca. 27 Einheiten, Raum Stuttgart/Ludwigsburg/Kornwestheim) über vier
Marken: WIMUS Hausverwaltung, ALFA APARTMENTS (KZV/Kurzzeit), ALFA CAMPUS (WG/LZV),
ALFA DEVELOPMENT (Ankauf/Bau). Ein tightly-integriertes, weitgehend automatisiertes
System von Buchungs-Ingestion über CRM-Pipeline bis Hausverwaltung und Compliance.

Der Kern liefert das Fundament: dreistufige Org-Hierarchie (Workspace → Firma → Projekt),
universelles Akteure-Modell (Mensch + KI gleichberechtigt als Rollenträger), die drei
vereinheitlichten Betriebskosten-Kerne (Kostenverteilung, Fristen, Forderungen), eine
Mistral-OCR-Pipeline für alle Dokumente, Channel-Routing und das Dashboard-/Reporting-System.

Fachmodule (z.B. FiBu-Belegerkennung 0002) setzen auf diesem Kern auf und verweisen darauf.

## Steht (gebaut & läuft)

- Phase 0 Fundament: CLAUDE.md, DB-Schema, Auth+MFA, Mandanten, RLS, Seed
- Phase 1 Core Immobilien: Objekte, Einheiten, Kontakte, Verträge, Dashboard
- Cutover public→wimus abgeschlossen (App läuft auf `wimus`); Org-Modell Workspace→Firma→Projekt
- Phase 2 (nativer Teil, getestet): Forderungsmanagement, Fristen/Termine, Mahnlauf
  (5-stufig), Betriebskosten-Abrechnung (Kostenverteilung/Umlageschlüssel, A4-Druck)
- Eingeloggte Playwright-Grobtests über alle Hauptseiten (Pflicht nach jedem Umbau)
- Stack produktiv: Next.js 16 / Supabase self-hosted / n8n / Coolify / amoCRM / Beds24+Pricelabs
- ~130 Tabellen im Schema `wimus`, idempotente Migrationen (aktuell bis 011)

## In Arbeit

- Phase 2 Finanzen (extern): OP-Management, CAMT/finAPI, Invoice Ninja, Zammad
  (nativer Teil Mahnwesen/Forderungen/Fristen/BK steht, s. „Steht")
- Modulübergreifende UI-Konventionen + Datenintegrität (001_erp_400_design/20_datenmodell) als
  Konvention dokumentiert, Code-Umsetzung (RowActions/Inline-Edit/Undo/Audit-Timeline,
  UI-Dublettenprüfung/Sperren/Audit-Log) noch offen — Backlog

## Ideen / als Nächstes

- Phasen 3–12 (KZV-Vollautomatik, Vorgänge, DMS, KI-Agenten, Reporting/Bank, Akquise,
  HR, Portale, Steuer/Compliance, Telefon-KI) — siehe Meilenstein-Tabelle / `001_erp_100_architektur.md`
- Gesonderte Fachmodule wo Umfang es rechtfertigt (FiBu = 0002 bereits ausgegliedert)

## Entscheidungen (warum es so ist)

- 2026-06-24: Drei vereinheitlichte BK-Kerne statt verstreuter Einzellogik — Grund: alle
  Betriebskosten (Strom/Gas/Müll/Hausmeister/WEG-extern/Grundsteuer) durch EINE
  Verteilungslogik; alle Deadlines in EINER Fristen-Tabelle; alle Forderungen in EINER
  Forderungs-Tabelle. Reduziert Komplexität drastisch.
- 2026-06-24: Universelles Akteure-Modell — ein KI-Agent kann jede MA-Rolle ausfüllen,
  ersetzt getrennte `ma_profile`/`ki_agenten`-Tabellen.
- 2026-06-24: Universelles Abrechnungseinheiten-Konzept ersetzt wg_gruppen +
  bk_umlagegruppen + Zählergruppen + Heizkreise in EINEM Konzept.
- 2026-06-24: Mistral OCR für ALLE Eingangs- und Ausgangsdokumente; Output Markdown +
  strukturiertes JSON + direkte DB-Feldbefüllung mit Confidence-Scoring.
- 2026-06-24: Tremor-Komponenten je Seite/Projekttyp verbindlich festgelegt.
- 2026-06-26: **Tremor verworfen → Recharts 3.** `@tremor/react` verlangt react@^18,
  Projekt läuft auf React 19 (Peer-Konflikt + Laufzeitrisiko). Recharts ist React-19-nativ
  (Tremor baut ohnehin darauf). Charts: `components/charts/wimus-charts.tsx` (Balken/Donut,
  WIMUS-Palette); custom `KpiCard` bleibt. „Tremor" in den Specs = Recharts-basierte Charts.
- 2026-06-23: Channel-Routing mit Lock-Mechanik (KI/MA), Kollisionsstrategie
  erst_ki_dann_mensch, Eskalation bei Konfidenz < 0.70.
- 2026-06-25: Modulübergreifende UI-Konventionen (Abschnitt „UI-Konventionen" in
  `001_erp_400_design.md`): Row-Klick → Detail, Hover-Aktionen Muster A + optionaler Kebab,
  wiederverwendbare `<RowActions>`, Duplizieren = Volldatensatz ohne Unique-Felder,
  Bulk-Aktionen, Inline-Edit nur wo zulässig, Optimistic UI, Undo, Empty States,
  Audit-Timeline, Tastatur-Nav, Touch.
- 2026-06-25: Datenintegrität als Abschnitt in `001_erp_200_datenmodell.md`: zweistufige
  Dublettenprüfung (DB-UNIQUE + UI-Vorabprüfung) mit Block/Warnung-Matrix; drei getrennte
  Sperr-Typen (Beziehung/Status-GoBD/Concurrency-Lock); Propagation in vier Verhalten
  (Sperren/Propagieren/Versionieren/Warnen); Feld-Edit-Stufen inline/detail/gesperrt;
  Audit-Pflicht. Generalisiert vorhandene Muster (konversation_locks, Akteure,
  gueltig_ab-Versionierung).
- 2026-06-26: `organisationen` (externe Geschäftsfirmen) + `kontakte.organisation_id` ins
  Datenmodell — Grund: CRM-Pipelines (0003) brauchen externe Firmen relational (mehrere
  Ansprechpartner je Firma). Bewusste Trennung INNEN (`firmen`/Mandant) vs. AUSSEN
  (`organisationen`); amoCRM vermischt beides in „Companies".

## Offene Punkte

- OP-1: Gesamtkonzept-/Nordstern-Dokument existierte bisher nicht separat — durch dieses
  `001_erp_000_konzept.md` jetzt abgedeckt.
- OP-2: CLAUDE.md wird in Spec referenziert, liegt aber nicht als migrierte Datei vor —
  gehört ins Repo, nicht in die Specs.
- OP-3: Migrations-SQL (001–005) als `.txt` referenziert; liegt separat, nicht in Specs.
- OP-4: `organisationen` + `kontakte.organisation_id` ins Datenmodell aufgenommen (für CRM
  0003); Migration im Repo noch einzuspielen.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 5.0.2 | 2026-06-24 | freigegeben | V502 Spez+Datenmodell: BK-Kerne, Fristen, Forderungen, Mietrecht, OCR, Verwaltungsverträge |
| 5.0.1 | 2026-06-24 | freigegeben | V501 Architektur: 12 Phasen, Channel-Routing, 27 Module, 13 Agenten |
| 1.0.4 | 2026-06-24 | freigegeben | V104 Design System: Dashboard-Konzepte, Tremor je Seite |
| 1.0.1 | 2026-06-23 | freigegeben | V101 Testing: Teststrategie, Stack, Testfälle |

> Migriert aus den Word-Bestandsdokumenten (Stand 23./24.06.2026) ins neue Spec-System.
> Versionsnummer übernimmt höchste Bestands-Version (V502 → 5.0.0-Linie).

## Änderungshistorie

> Laufendes Protokoll aller Änderungen am Modul (neueste oben). Vorgang ≤ 100 Zeichen.
> Frühere Einträge ohne Uhrzeit (nicht erfasst); ab 2026-06-26 mit Uhrzeit.

| Datum/Zeit | Vorgang | Betroffen |
|------------|---------|-----------|
| 2026-06-26 14:30 | organisationen + kontakte.organisation_id (externe Firmen, für CRM 0003) | 001_erp_200_datenmodell, 001_erp_000_konzept |
| 2026-06-25 | Datenintegrität ergänzt (Dubletten/Sperren/Propagation/Audit) | 001_erp_200_datenmodell |
| 2026-06-25 | UI-Konventionen ergänzt (RowActions/Inline-Edit/Bulk/Undo/Touch) | 001_erp_400_design |
| 2026-06-25 | Migration aus 5 Word-Specs ins Spec-System (V502/V501/V104/V101) | alle |
