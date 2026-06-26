---
id: 0001
titel: ERP-Kern
status: in_arbeit          # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 5.0.0             # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: erp-kern
erstellt: 2026-06-23
geaendert: 2026-06-25
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
- Stack produktiv: Next.js 16 / Supabase self-hosted / n8n / Coolify / amoCRM / Beds24+Pricelabs
- ~130 Tabellen im Schema `wimus`, idempotente Migrationen 001–005

## In Arbeit

- Phase 2 Finanzen & Kommunikation: OP-Management, CAMT, Mahnwesen, Invoice Ninja, Zammad

## Ideen / als Nächstes

- Phasen 3–12 (KZV-Vollautomatik, Vorgänge, DMS, KI-Agenten, Reporting/Bank, Akquise,
  HR, Portale, Steuer/Compliance, Telefon-KI) — siehe Meilenstein-Tabelle / `10_architektur.md`
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
- 2026-06-23: Channel-Routing mit Lock-Mechanik (KI/MA), Kollisionsstrategie
  erst_ki_dann_mensch, Eskalation bei Konfidenz < 0.70.
- 2026-06-25: Modulübergreifende UI-Konventionen (Abschnitt „UI-Konventionen" in
  `40_design.md`): Row-Klick → Detail, Hover-Aktionen Muster A + optionaler Kebab,
  wiederverwendbare `<RowActions>`, Duplizieren = Volldatensatz ohne Unique-Felder,
  Bulk-Aktionen, Inline-Edit nur wo zulässig, Optimistic UI, Undo, Empty States,
  Audit-Timeline, Tastatur-Nav, Touch.
- 2026-06-25: Datenintegrität als Abschnitt in `20_datenmodell.md`: zweistufige
  Dublettenprüfung (DB-UNIQUE + UI-Vorabprüfung) mit Block/Warnung-Matrix; drei getrennte
  Sperr-Typen (Beziehung/Status-GoBD/Concurrency-Lock); Propagation in vier Verhalten
  (Sperren/Propagieren/Versionieren/Warnen); Feld-Edit-Stufen inline/detail/gesperrt;
  Audit-Pflicht. Generalisiert vorhandene Muster (konversation_locks, Akteure,
  gueltig_ab-Versionierung).

## Offene Punkte

- OP-1: Gesamtkonzept-/Nordstern-Dokument existierte bisher nicht separat — durch dieses
  `00_konzept.md` jetzt abgedeckt.
- OP-2: CLAUDE.md wird in Spec referenziert, liegt aber nicht als migrierte Datei vor —
  gehört ins Repo, nicht in die Specs.
- OP-3: Migrations-SQL (001–005) als `.txt` referenziert; liegt separat, nicht in Specs.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 5.0.2 | 2026-06-24 | freigegeben | V502 Spez+Datenmodell: BK-Kerne, Fristen, Forderungen, Mietrecht, OCR, Verwaltungsverträge |
| 5.0.1 | 2026-06-24 | freigegeben | V501 Architektur: 12 Phasen, Channel-Routing, 27 Module, 13 Agenten |
| 1.0.4 | 2026-06-24 | freigegeben | V104 Design System: Dashboard-Konzepte, Tremor je Seite |
| 1.0.1 | 2026-06-23 | freigegeben | V101 Testing: Teststrategie, Stack, Testfälle |

> Migriert aus den Word-Bestandsdokumenten (Stand 23./24.06.2026) ins neue Spec-System.
> Versionsnummer übernimmt höchste Bestands-Version (V502 → 5.0.0-Linie).
