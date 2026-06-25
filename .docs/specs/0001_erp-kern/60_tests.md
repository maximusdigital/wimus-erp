---
gehoert_zu: 0001
dokument: Tests
geaendert: 2026-06-23
quelle: 20260623_WIMUS_IT_ERP_50_Testing_Docs_V101.docx
---

# 0001 — Tests

> Version & Status des Moduls stehen in `00_konzept.md`.

## Projektspezifika

- Projektstruktur: `app/**` im Root (kein `src/`). Pfade/Globs entsprechend.
- Tailwind v4 — `tailwindcss-animate` NICHT installieren (`tw-animate-css` vorhanden).
- Playwright: `@playwright/test` bringt Runner mit — kein separates playwright-Package.
- In package.json: vitest ^4, @testing-library/react, @playwright/test, supertest.
- Fehlt noch: @vitest/ui, @vitest/coverage-v8, vitest.config.ts, playwright.config.ts,
  tests/-Ordner, npm-Scripts.

## Grundprinzip

Kein Over-Engineering. Nur testen was bricht. Keine 100%-Coverage-Pflicht. Fokus:
kritische Geschäftslogik + Auth/RLS + API-Kontrakte + E2E Happy Paths. Alle Tests via
Claude Code automatisierbar (npm-basiert). Lokal Windows (headed) + headless Coolify (CI).

## Test-Stack

| Tool | Zweck | Status |
|------|-------|--------|
| Vitest | Unit + Integration, ESM-native | ⚠️ @vitest/ui + coverage fehlen |
| Testing Library | React-Komponenten, Formulare, State | ✅ vorhanden |
| Playwright | E2E Happy Paths | ✅ vorhanden, Browser installieren |
| supertest | Next.js API Routes, Webhooks | ✅ vorhanden |
| pgTAP | PostgreSQL Trigger + RLS direkt | ⚠️ aktivieren (CREATE EXTENSION pgtap) |

Setup einmalig: `npm install -D @vitest/ui @vitest/coverage-v8`; `npx playwright install
chromium`; `CREATE EXTENSION IF NOT EXISTS pgtap;`.

## npm Scripts

test (vitest watch), test:run (vitest run — CI/vor Commit), test:coverage (wöchentlich),
test:e2e (playwright), test:e2e:ui (Debug lokal), test:api (vitest run
tests/integration/api).

## Konfiguration

vitest.config.ts: environment jsdom, globals true, setupFiles ./tests/setup.ts, include
tests/unit + tests/integration, coverage v8 (app/** + lib/**, thresholds lines 70), alias
@ → Root. playwright.config.ts: testDir ./tests/e2e, fullyParallel, retries CI 2,
baseURL localhost:3000, headed lokal/headless CI, Projects Desktop Chrome + Mobile
iPhone 13 (390px), webServer npm run dev.

## Ordnerstruktur

tests/setup.ts; tests/unit/lib/ (citytax, afa, mahnwesen, aktenzeichen, mietanpassung);
tests/unit/utils/ (formatter, datums); tests/integration/auth/ (login, mfa, rls,
middleware); tests/integration/api/ (beds24-webhook, citytax-api, ttlock);
tests/integration/db/ (pgTAP: trigger.sql, rls-policies.sql, fk-constraints.sql);
tests/e2e/ (auth, objekte, buchung-kzv, gaestemappe, vorgang); tests/fixtures/ (seed-data,
mock-buchung, mock-objekt).

## Testfälle Priorität 1 (Auswahl)

CityTax: Stuttgart 2P/3N → 18,00; Ludwigsburg 3P/2N → 12,00; Kinder <18 ausgenommen;
Nullfall 0P → 0,00; Quartalsexport CSV. AfA: 2% von 300.000 → 6.000/Jahr; 3% → 9.000;
Restbuchwert nach 5×AfA; IST vs PLAN. Mahnwesen 5-stufig: Stufe 1 keine Gebühren etc.

> Bezug FiBu (0002): Validierungsregeln des FiBu-Moduls (netto+ust≈brutto, IBAN-Prüfsumme,
> Kontierungs-Lookup) ergänzen diese Testbasis und gehören in `0002_fibu/60_tests.md`.

---

## Cutover public → wimus — Abnahme-Testfälle (Branch `cutover/wimus`)

> Stand 2026-06-25. Die App liest/schreibt die Geschäftsentitäten jetzt im
> `wimus`-Schema (Default-Schema der Supabase-Clients = `wimus`). `user_mandanten`
> (Auth-Mapping) und `asset_register` (Inventar, P5) bleiben bewusst in `public`.

### Migrierte Entitäten + Spalten-Mapping (verifiziert)

| Entität | public → wimus | Runnable Test |
|---------|----------------|---------------|
| objekte | `ort→stadt`, `objekttyp→typ`; entfernt bezeichnung/wohnflaeche_qm/notiz | `tests/unit/lib/validations/objekt.test.ts` |
| einheiten | `einheitstyp→typ`, `wohnflaeche_qm→flaeche`, `zimmer_anzahl→zimmer`; status→`aktiv`; kein mandant_id | `tests/unit/lib/validations/einheit-vertrag.test.ts` |
| kontakte | `typ`→6×`ist_*` + `kontakt_typ`; `firma→firmenname`; `telefon→festnetz/mobil`; `ort→stadt` | `tests/unit/lib/validations/kontakt.test.ts` |
| vertraege → **mietvertraege** | `vertragsart→vertragstyp`, `beginn→mietbeginn`, `ende→mietende`; ohne objekt_id (→ via Einheit) | `tests/unit/lib/validations/einheit-vertrag.test.ts` |
| buchungen_kzv → **buchungen** | `betrag→betrag_brutto`, `city_tax→citytax_betrag`; ohne objekt_id/nuki_code | `tests/unit/lib/validations/buchung.test.ts`, `tests/integration/api/beds24-webhook.test.ts` |
| mahnungen | `vertrag_id→mietvertrag_id`, `gesamt→gesamtforderung` | `tests/unit/lib/validations/finanzen.test.ts`, `tests/unit/lib/mahnwesen.test.ts` |
| kautionen | `vertrag_id→mietvertrag_id`; bank/iban→bankkonto/zinsen | `tests/unit/lib/validations/finanzen.test.ts` |
| vorgaenge | Spec-Modell: ohne titel/beschreibung/faellig_am; +handwerker/kosten/leistungsdatum/aktenzeichen/massnahme_typ | `tests/unit/lib/validations/vorgang-asset.test.ts` |

### Abnahmekriterien (durchgeführt)

- **AK-1 Unit/Integration:** `npm run test:run` → **127 Tests grün** (17 Dateien),
  inkl. Beds24-Webhook (401/400/422/200/500, CityTax+Keybox, Storno, Default-Mandant)
  jetzt gegen `wimus.buchungen`.
- **AK-2 Build:** `npm run build` → grün (alle Routen, Typecheck).
- **AK-3 UI-Smoke (Playwright Preview):** 36 Routen (Liste/Neu/Detail/Bearbeiten je
  Entität + Einstellungen) → **alle HTTP 200, 0 Konsolenfehler**.
- **AK-4 RLS/Daten als echter User (`info@wimus.de`):** Login (password grant) →
  `wimus.objekte` liefert **10/10** mit korrekt gemappten Spalten (stadt/typ/status),
  `wimus.mandanten` 4/4. RLS (Migration 008, mandant_isolation) greift.
- **AK-5 Embed-Validierung als User (200):** mietvertraege/buchungen/mahnungen/
  kautionen (`vertrag:mietvertraege(aktenzeichen)`) + vorgaenge
  (`kontakte!handwerker_id`/`!gemeldet_von`) gegen das echte wimus-Schema geprüft.

### Offen / nicht im Cutover

- Inventar/Assets (`asset_register`) bleibt `public` bis P5 (QR+OCR+AfA).
- Tremor-Charts (Design V104) durch React-19-Peerkonflikt blockiert (custom KpiCard aktiv).
- pgTAP (RLS/Trigger DB-seitig) im Supabase-SQL-Editor — separat.

---

## Phase 2 — Forderungsmanagement (wimus.forderungen)

Runnable: `tests/unit/lib/forderungen.test.ts` (11 Tests).

### Abnahme-Testfälle (durchgeführt)
- **Schadens-Eskalation nach Betrag** (Spec 30_prozesse 3): <50 → Stufe 1 (Kaution
  direkt); 50–500 → Stufe 2 (Kaution+Mahnung); 500–5.000 → Stufe 3 (Kaution+
  Versicherung); 5.000–10.000 → Stufe 4 (Versicherung+Mahnbescheid); >10.000 →
  Stufe 5 (Anwalt). Grenzwerte 50/500/5000/10000 springen jeweils hoch.
- **Offener Betrag**: betrag − bezahlt_betrag.
- **Kaution-Verrechnungstopf**: Rest positiv → Rückzahlung; Rest negativ →
  Nachforderung; exakt aufgehend → 0/0.
- **CRUD**: /finanzen/forderungen Liste/Neu/Detail/Bearbeiten; API mandant_id
  serverseitig; kontakt_id Pflicht.
- **Embed-Validierung als User (200)**: `forderungen` mit
  `kontakt:kontakte!kontakt_id(...)` (FK-Disambiguierung wegen mehrerer
  kontakte-FKs: kontakt_id + gutachter_id) + `mietvertrag:mietvertraege(aktenzeichen)`.
- Build grün, Gesamt-Suite 138 Tests grün.

---

## Phase 2 — Fristenmanagement (wimus.fristen)

Runnable: `tests/unit/lib/fristen.test.ts` (10 Tests).

### Abnahme-Testfälle (durchgeführt)
- **tageBisFaellig**: zukünftig positiv, überfällig negativ, kein Datum → null.
- **fristAmpel**: erledigt→erledigt; überfällig/≤7T→rot; ≤30T→gelb; >30T→grün.
- **erinnerungFaellig**: trifft, wenn Resttage in `erinnerung_tage_vorher` (z.B. [30,14,7,1]).
- **fristInsertSchema**: "30, 14, 7, 1" → number[]; ungültiger frist_typ abgelehnt.
- **CRUD**: /fristen Liste (Ampel-Punkt) + Neu/Detail/Bearbeiten; Sidebar aktiv.
- **RLS als User (200)**: `wimus.fristen` lesbar.
- Build + 148 Tests grün.

---

## Phase 2 — Betriebskosten-Kerne (Rechenlogik + BK-Arten)

Runnable: `tests/unit/lib/bk.test.ts` (13 Tests).

### Abnahme-Testfälle (durchgeführt)
- **Verbrauchs-Umrechnung kWh**: Gas (m³×Brennwert×Zustandszahl), Heizöl (L×9,8),
  Pellets (kg×4,8), kWh direkt.
- **Warmwasser**: 18% der Heizkosten (HKVO §9), Prozent konfigurierbar.
- **HKVO-Töpfe**: 70% Verbrauch / 30% Fläche (konfigurierbar).
- **Umlageschlüssel-Verteilung** `verteileKosten`: flaeche/einheit/individuell;
  intern_abgerechnet (KZV) trägt 0; Rundungsrest beim letzten Zahler → Summe exakt.
- **BK-Arten-Katalog**: /einstellungen/bk-arten CRUD (Kategorie, BetrKV, Umlageschlüssel,
  HKVO, umlagefähig); RLS als User validiert (200).
- Build + 161 Tests grün.

> Offen (nächster Schritt): Abrechnungseinheiten + Kostenverteilungs-Lauf
> (kostenverteilung_positionen → bk_abrechnungen) nutzen `verteileKosten`.

---

## Phase 2 — BK-Abrechnungslauf (Workflow)

Runnable: `tests/unit/lib/bk-abrechnung.test.ts` (5 Tests).

### Abnahme-Testfälle (durchgeführt)
- **erstelleAbrechnung**: verteilt Positionen je Schlüssel über die Mitglieder,
  summiert Kostenanteil je Mietvertrag; Summe geht exakt auf (kostenGesamt).
- **Saldo** = Vorauszahlung − Kostenanteil (Guthaben positiv / Nachzahlung negativ).
- **Standard-Schlüssel** greift, wenn die Position keinen hat.
- **intern_abgerechnet (KZV)** trägt 0.
- **Workflow-UI** `/betriebskosten`: Abrechnungseinheiten + Mitglieder, Kostenpositionen,
  Abrechnungs-Vorschau (read-only, nutzt erstelleAbrechnung). Embeds als User
  validiert (200): abrechnungseinheiten/objekt, mitglieder/einheit+mietvertrag!fk,
  kostenverteilung_positionen/bk_art.
- Build + 166 Tests grün. Offen: Speichern in bk_abrechnungen + Nebenkostenspiegel-PDF.

---

## Phase 2 — BK-Abrechnung: Speichern + Nebenkostenspiegel

Runnable: `tests/unit/lib/betriebskosten-run.test.ts` (4 Tests).

### Abnahme-Testfälle (durchgeführt)
- **periodeRange**: Jahr "2025" → 01.01.–31.12.; ungültiges Format → null/null.
- **isUmlageschluessel**: erkennt gültige Schlüssel.
- **Save-API** `POST /api/betriebskosten/[id]/abrechnung`: rechnet serverseitig neu
  (gemeinsamer Helper `ladeAbrechnungslauf`), schreibt je Mietvertrag eine Zeile in
  `bk_abrechnungen` (Status entwurf, nebenkostenspiegel-JSON), idempotent (löscht
  vorherige Entwürfe). Build-clean.
- **Druckansicht** `/betriebskosten/[id]/abrechnung/druck`: A4 PrintLayout,
  Nebenkostenspiegel je Mietvertrag (Positionen → Kostenanteil → abzgl. VZ → Saldo).
- **UI-Smoke**: 10/10 neue Phase-2/BK-Routen rendern, 0 Konsolenfehler.
- Build + 169 Tests grün.

> Hinweis: Save-Happy-Path braucht reale Daten (einheiten/mietvertraege/Mitglieder/
> Positionen); aktuell sind nur objekte/mandanten in wimus migriert.
