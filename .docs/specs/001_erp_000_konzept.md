---
id: 0001
titel: ERP-Kern
status: in_arbeit          # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 5.1.0             # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: erp-kern
erstellt: 2026-06-23
geaendert: 2026-06-27
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
- Schema `wimus`, idempotente Migrationen **001–016** (Stand 2026-06-27). Getrackt als
  `.sql` ist aktuell ~110 Tabellen (002 Vollschema + 005 BK/Fristen + 010–016 FiBu/CRM/
  Reporting); das V501-Fundament (Org-Hierarchie/Akteure/Channels/KPI, ~50 Tab.) ist
  großteils live, aber noch nicht als Migration getrackt (siehe OP fehlende Migration 004).

## In Arbeit

- Phase 2 Finanzen (extern): OP-Management, CAMT/finAPI, Invoice Ninja, Zammad
  (nativer Teil Mahnwesen/Forderungen/Fristen/BK steht, s. „Steht")
- Modulübergreifende UI-Konventionen + Datenintegrität (001_erp_400_design/20_datenmodell) als
  Konvention dokumentiert. **`<RowActions>` umgesetzt + in den Hauptlisten ausgerollt
  (2026-06-27).** Code-Umsetzung von Inline-Edit/Undo-Toast/Audit-Timeline/Bulk-Aktionen +
  UI-Dublettenprüfung/Sperren/Audit-Log noch offen — Backlog

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
- 2026-06-27: **Vorgänge ziehen nach Modul 004 (ops).** Vom Umfang her eigenes Modul; Kern
  hält nur die Bezugspunkte (`forderungen.vorgang_id`, `fristen`→Vorgang, `akteure` als Träger,
  `ocr_verarbeitungen`/`portal_nachrichten`→`vorgang_id`). Vorgangs-Datenmodell/Prozesse/UI
  vollständig in `004_ops_*`. Nichts doppelt.
- 2026-06-27: **`akteure` (Mensch + KI) als Kern-Erweiterung** (Migration 017), ersetzt das
  ungenutzte `ma_profile`. Träger von Vorgängen/KI-Agenten; Detail-Workforce-Modell in 004.

## Offene Punkte

- OP-1: Gesamtkonzept-/Nordstern-Dokument existierte bisher nicht separat — durch dieses
  `001_erp_000_konzept.md` jetzt abgedeckt.
- OP-2: CLAUDE.md wird in Spec referenziert, liegt aber nicht als migrierte Datei vor —
  gehört ins Repo, nicht in die Specs.
- ~~OP-3: „005"-Kern-DDL nicht als getrackte Migration~~ → **erledigt 2026-06-27**: Das
  vollständige, idempotente DDL (BK/Fristen/Forderungen/Mietrecht inkl. Views/Funktionen/
  Seeds) lag als lauffähiges `.txt` im Archiv und ist jetzt 1:1 als
  `supabase/migrations/005_kern_bk_fristen_forderungen.sql` im Repo (No-Op bei erneutem
  Anwenden). Damit ist die Migrationskette wieder lückenlos getrackt (005 vor RLS-009).
- ~~OP-4: `organisationen` + `kontakte.organisation_id`~~ → **erledigt 2026-06-27**: als
  Migration `012_organisationen.sql` gebaut + eingespielt (RLS, Trigger). Genutzt von CRM 0003.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 5.1.0 | 2026-06-27 | in_arbeit | Spec-Sync-Bauwelle: `organisationen` (012), `ocr_verarbeitungen` (014) gebaut; Mietanpassung-Dublette aufgelöst (016, `mietpreiserhoehungen` kanonisch); RowActions/Test-Setup als umgesetzt nachgezogen |
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
| 2026-06-27 15:00 | Vorgänge → Modul 004 ausgelagert (Kern auf Bezugspunkte reduziert); akteure (Mensch+KI) als Kern-Erweiterung 017 ergänzt | 000_konzept, 200 |
| 2026-06-27 12:30 | 3-Wege-Abgleich A-Funde: 005-Zusatztabellen enumeriert, Migrations-/Tabellenzahl korrigiert; Bugfix vorgaenge.prioritaet kritisch→notfall (DB-CHECK) | 000_konzept, 200, types/vorgang |
| 2026-06-27 01:30 | OP-3 erledigt: 005-Kern-DDL 1:1 aus Archiv als getrackte Migration 005 ins Repo | 000_konzept, 200, Migration 005 |
| 2026-06-27 01:10 | v5.1.0: ocr_verarbeitungen (014) + Mietanpassung-Dublette (016) gebaut; Test-Ordnerstruktur an Ist | 000_konzept, 200, 600 |
| 2026-06-27 00:45 | Spec-Sync: RowActions/Test-Setup/organisationen(012) als umgesetzt, Migrations-Range 001–013 | 000_konzept, 200, 400, 600 |
| 2026-06-26 14:30 | organisationen + kontakte.organisation_id (externe Firmen, für CRM 0003) | 001_erp_200_datenmodell, 001_erp_000_konzept |
| 2026-06-25 | Datenintegrität ergänzt (Dubletten/Sperren/Propagation/Audit) | 001_erp_200_datenmodell |
| 2026-06-25 | UI-Konventionen ergänzt (RowActions/Inline-Edit/Bulk/Undo/Touch) | 001_erp_400_design |
| 2026-06-25 | Migration aus 5 Word-Specs ins Spec-System (V502/V501/V104/V101) | alle |
