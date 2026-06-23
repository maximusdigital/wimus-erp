# Tests (Testing-Spec 50, V100)

Teststrategie: kein Over-Engineering. Nur testen was bricht – kritische
Geschäftslogik + Auth/RLS + API-Kontrakte + E2E Happy Paths.

## Struktur

| Pfad                    | Inhalt                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `tests/unit/lib/`       | Businesslogik: citytax, afa, mahnwesen, aktenzeichen …       |
| `tests/unit/utils/`     | Formatter, Datumsberechnungen, Validierungen                 |
| `tests/integration/auth/` | Login, MFA, RLS-Isolation, Middleware-Redirects            |
| `tests/integration/api/`  | Beds24-Webhook, API-Routes, Supabase-Queries               |
| `tests/integration/db/`   | pgTAP: Trigger, RLS-Policies, FK-Constraints (SQL-Editor)   |
| `tests/e2e/`            | Playwright: auth, objekte, buchung-kzv, gaestemappe, vorgang |
| `tests/fixtures/`       | Seed-Daten, Mock-Objekte, Test-Buchungen                     |

## Befehle

| Script                  | Zweck                                  |
| ----------------------- | -------------------------------------- |
| `npm test`              | Vitest Watch-Mode (Development)        |
| `npm run test:run`      | Vitest einmalig (CI / vor Commit)      |
| `npm run test:coverage` | Coverage (min. 70 % Businesslogik)     |
| `npm run test:e2e`      | Playwright E2E (headless)              |
| `npm run test:e2e:ui`   | Playwright mit UI (lokales Debugging)  |

pgTAP-Tests laufen direkt im Supabase SQL-Editor (`SELECT * FROM runtests();`),
nicht über Vitest – siehe `tests/integration/db/`.
