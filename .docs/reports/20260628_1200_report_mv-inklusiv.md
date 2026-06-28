# Report — Belegung MV-Ende inklusiv (Reconciliation), 2026-06-28 12:00 MESZ

> „check" ohne neuen Prompt: Reconciliation des ausgelieferten Codes auf eine **Spec-Antwort**
> aus dem Belegungs-Report. Sicherung: Tag `sicherung/vor-mv-inklusiv-20260628-1200`.
> Build + **334 Tests grün**. Kein SQL nötig. **Keine Spec-Edits.**

## 1. Gebaut

- `lib/belegung/laden.ts`: Mietvertrag belegt jetzt **bis `mietende` einschließlich** — in der
  halboffenen Engine `[von, bis)` umgesetzt als `bis = mietende + 1 Tag` (`naechsterTag`,
  monatswechsel-sicher). KZV-Checkout bleibt unverändert frei (halboffen). +2 Unit-Tests
  (`naechsterTag`, Buchung am MV-Ende-Tag kollidiert / Folgetag frei).

## 2. Abweichungen (warum diese Änderung)

- Mein Belegungs-Report (Rückfrage „MV-Ende inklusiv?") wurde in der Spec entschieden:
  `001_erp_000_konzept` (2026-06-28) → **„MV-Ende INKLUSIV (Loader bis=mietende+1) vs.
  KZV-Checkout frei"**. Mein erster Build war halboffen (mietende-Tag frei) → diese
  Reconciliation bringt Code = Spec.

## 3. Offen

- Nichts Neues. Belegung sonst unverändert; Beds24-Block weiterhin geparkt (eigener Auftrag,
  s. 001_erp „In Arbeit").

## 4. Rückfragen / geprüft

- **Modul 006 (Suche):** Konzept-Claude hat in `006_suche_200` meinen Stufe-1-Stand bestätigt
  (6 Entitäten), `rechnungen`/`lieferanten`/`nachrichten` bewusst auf „später/offen" bzw. „wartet
  auf Modul 007 (`kom_nachrichten`)", `similarity()` weiter deferred → **kein Code-Task**, nichts
  zu tun. Nur dokumentiert.
- Keine weiteren offenen Prompts in `.docs/prompts/`.
