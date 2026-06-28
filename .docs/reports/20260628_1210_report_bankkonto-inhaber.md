# Report — bank_konten.inhaber (Vorfilter), 2026-06-28 12:10 MESZ

> „check" ohne neuen Prompt: Umsetzung einer **Spec-Entscheidung**, die meine Bank-Report-
> Rückfrage #1 beantwortet. Sicherung: Tag `sicherung/vor-bankkonto-inhaber-20260628-1210`.
> Build + **334 Tests grün**. **Keine Spec-Edits. SQL offen: Migration 025.**

## 1. Gebaut

- **Migration 025:** `bank_konten.inhaber TEXT` (additiv, idempotent) — echter Kontoinhabername
  (separat von `bezeichnung` = nur Label).
- **Import-Vorfilter** (`/api/fibu/bank/import`): eigene Umbuchungen jetzt über
  `firmen.name` + `bank_konten.bezeichnung` + **`bank_konten.inhaber`** erkannt (kontoinhaber-Liste).
- **Konten-API** (`POST /api/fibu/bank/konten`): akzeptiert `inhaber`.

## 2. Abweichungen

- Spec `002_fibu_200` markierte `bank_konten.inhaber` als „geplant, additiv" (Antwort auf meine
  Report-Rückfrage „Kontoinhaber-Feld?"). Diese Umsetzung bringt Code = entschiedene Spec.

## 3. Offen

- **SQL-Stop:** `025_bank_konto_inhaber.sql` einspielen.
- **Konto-Anlage-UI:** Bankkonten werden bisher nur per API angelegt (kein Formular im Cockpit) —
  das `inhaber`-Feld ist API-seitig da; eine kleine Konto-Verwaltung im Cockpit wäre der nächste
  Schritt (kein Blocker, da der Import auch ohne Konto läuft).

## 4. Rückfragen / geprüft

- Übrige „noch offen"-Punkte in den Specs (Inline-Edit/Bulk/Undo, EXTF-116-Spalten, BWA, pgTAP-RLS,
  Innenumsatz-Eliminierung, Korrektur-Regelvorschlag) sind als **Backlog** markiert — keine
  entschiedenen, abgrenzbaren Bau-Aufträge → nicht angefasst (warten auf Prompt).
- Keine offenen Prompts in `.docs/prompts/`.
