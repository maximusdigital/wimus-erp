---
gehoert_zu: 0002
dokument: Tests
geaendert: 2026-06-25
---

# 0002 — Tests

> Version & Status des Moduls stehen in `00_konzept.md`.
> Test-Stack siehe 0001 `60_tests.md` (Vitest, Playwright, supertest, pgTAP).

## Priorität 1 — kritische Geschäftslogik (Unit)

### Validierung (deterministisch)
- netto + ust ≈ brutto: 100,00 + 19,00 = 119,00 → ok; 100,00 + 18,00 = 119,00 → review_flag.
- ust ≈ netto × satz: netto 100 × 19% = 19,00 → ok; Abweichung > 1 Cent → review_flag.
- Datum plausibel: Zukunftsdatum → review_flag; 1970 → review_flag.
- IBAN-Prüfsumme: gültige DE-IBAN → ok; manipuliert → review_flag.

### Kontierung (Regel-Lookup)
- Gewerk „Reinigung" → Soll-Konto erwartet (deterministisch, nicht LLM).
- Lieferant-Alias „DM" → Standard-Gewerk Reinigung.
- K1 „AS125" → Haben/Bankkonto der zugehörigen Einheit.
- Fehlende Regel → review_flag = TRUE, kein Auto-Buchen.

### Gating
- Confidence hoch + Betrag < Schwelle → auto-buchbar.
- Betrag > Schwelle → immer Mensch (auch bei Confidence 1.0).
- OCR-Confidence niedrig → keine Extraktion, OCR-Queue.

### Ergebnisverteilung (Feststellungs-Vorschau)
- Quote 60/40, ganzjährig → Verteilung korrekt.
- Unterjähriger Quotenwechsel (z.B. 60/40 → 50/50 ab 01.07.) → zeitanteilig korrekt.
- GmbH → keine Verteilung.

## Priorität 1 — Integration

- E-Rechnungs-Weiche: ZUGFeRD-PDF → XML-Parse-Pfad (kein OCR), confidence 1.0.
- Unstrukturiertes PDF → OCR-Pfad.
- Idempotenz: gleicher Beleg-Hash 2× → nur 1 Buchung (ON CONFLICT).
- Einheiten-Zuordnung: Beleg mit firmeneigenem belege@ → korrekte Einheit.

## Priorität 1 — DB (pgTAP)

- RLS: Akteur Einheit A sieht keine Belege/Buchungen Einheit B.
- belege.hash UNIQUE greift.
- FK belege → ocr_verarbeitungen / einheiten / lieferanten.

## Export (Integration)

- EXTF-CSV pro Einheit: KOST1=K1, KOST2=K2 korrekt gesetzt.
- Stabile buchungs_id_extern → TaxPool-Re-Import erkennt Dublette.

## E2E (Happy Path)

- Beleg-Upload → OCR → Klassifikation → Vorschlag → Batch-Freigabe → gebucht → Export-Datei.

## Umsetzungsstand (2026-06-26)

Stammdaten-Layer + reine Kernlogik gebaut; Beleg-/Buchungs-Pipeline (OCR/Export)
folgt nach Fixierung der offenen Punkte (EXTF-Layout, Confidence-Schwellen).

**Umgesetzt (Vitest, `tests/unit/lib/fibu.test.ts`, 13 Tests grün):**
- ✅ Kontierung Regel-Lookup: Gewerk-Match, Lieferant-Match, Priorität, fehlende Regel → review_flag
  (`lib/utils/fibu.ts` `kontiere`).
- ✅ Ergebnisverteilung: 60/40 ganzjährig, unterjähriger Quotenwechsel zeitanteilig,
  Summe = Ergebnis (Rundungsrest), Verlustverteilung (`ergebnisverteilung`).
- ✅ Stabile `buchungs_id_extern` (TaxPool-Dublettenerkennung): deterministisch,
  case-/whitespace-insensitiv, betragssensitiv (`buchungsIdExtern`).

**Migration:** `supabase/migrations/010_fibu_stammdaten.sql` (Schritt 1+2 des Grobplans):
Firmen-Erweiterung (rechtsform_typ/besteuerungsart/kontenrahmen_ref), `gesellschafter`,
`beteiligungen`, `fibu_konten`, `kontierungsregeln`, `lieferanten` – je mit RLS
mandant_isolation. Annahme: Buchungskreis = `firmen` (Spec-OP). Eingespielt 2026-06-26.

**Stammdaten-UI (gebaut, `/fibu/*`):** CRUD für Gesellschafter (+ Beteiligungen je Firma
mit Quote/Gültigkeit im Detail), Kontierungsregeln (Match/Soll-Konto/USt/Priorität/Scope)
und Lieferanten (Alias/USt-ID/IBAN/Standard-Kontierung). Muster wie Fristen (Shadcn +
react-hook-form/zod, Desktop-Tabelle + Mobile-Karten). API `app/api/fibu/*`. Schema/RLS/
Embeds live gegen wimus verifiziert; `next build` grün.

**Belegprüfung & Gating (Vitest, `tests/unit/lib/fibu-beleg.test.ts`, 14 Tests):**
- ✅ `pruefeBeleg`: netto+USt≈brutto, USt≈netto×Satz (7 %/19 %), Datum plausibel
  (Zukunft/1970 → review_flag), 1-Cent-Toleranz (`lib/utils/fibu-beleg.ts`).
- ✅ `ibanGueltig`: ISO-13616 mod-97 (gültige DE-IBAN ok, manipuliert → false).
- ✅ `gating`: Confidence + Betrag → auto-buchbar vs. review; Betrag über Schwelle
  immer Mensch. Standardannahme (OP-2): confidence ≥ 0.95 UND brutto ≤ 200 €
  (überschreibbar).

**E-Rechnungs-Weiche (Vitest, `tests/unit/lib/erechnung.test.ts`, 13 Tests):**
- ✅ `istErechnung`/`parseErechnung`: CII (ZUGFeRD/XRechnung) + UBL (XRechnung)
  deterministisch geparst (Belegnummer/Datum/netto/USt/brutto/Lieferant/USt-ID),
  confidence 1.0; unstrukturiert → null → OCR-Pfad (`lib/utils/erechnung.ts`).
  Dependency-frei (Local-Name-Extraktion, kein XML-Parser-Dep).

**EXTF-Export (Vitest, `tests/unit/lib/extf.test.ts`, 8 Tests):**
- ✅ `extfBuchungsstapel`: DATEV-EXTF (Header 700/21 "Buchungsstapel" + Spaltenzeile
  + Buchungen), Betrag deutsch, S/H, Konto/Gegenkonto, Belegdatum TTMM, KOST1=K1/
  KOST2=K2, stabile BuchungsID, CSV-Escape, CRLF (`lib/utils/extf.ts`). OP-1 offen:
  volles 116-Spalten-Layout – hier konsistenter, per Spaltennamen importierbarer Kern.

**Weitere FiBu-UI (`/fibu/*`, e2e-geprüft):** Kontenrahmen (`fibu_konten`) CRUD;
Feststellungs-Vorschau (firma + Periode + Ergebnis → `ergebnisverteilung`, zeitanteilig,
Summenkontrolle). 22/22 eingeloggte Playwright-Grobtests grün.

**Offen (echte Anbindung/Entscheidung nötig):** Belege-/Buchungs-DDL (Schritt 3,
OCR-abhängig, 0001) + Belege-/Buchungs-UI; Export-Anbindung an echte Buchungen;
pgTAP-RLS. Volles EXTF-Spaltenlayout (OP-1).
