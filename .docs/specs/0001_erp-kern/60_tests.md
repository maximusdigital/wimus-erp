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
