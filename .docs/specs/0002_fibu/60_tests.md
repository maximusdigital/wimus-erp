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
