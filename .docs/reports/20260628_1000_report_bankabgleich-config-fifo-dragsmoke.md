# Report — Bank-Abgleich Ausbau (Config/FIFO/Vorfilter) + Kanban-Drag-Smoke, 2026-06-28 10:00

> Umsetzung der Antworten zum 0925-Report. **Keine Spec-Edits** (Spec-Nachzug macht
> Konzept-Claude, s.u.). Build + **318 Unit-Tests grün**. Sicherung: Tag
> `sicherung/vor-bankabgleich-20260628-0252`.
>
> **Nachtrag 2026-06-28 ~10:15 — Migration 022 eingespielt + verifiziert:** Settings-Round-Trip
> grün (Schwellen GET/PUT persistiert + zurückgesetzt, Ignorier-Muster POST/GET/DELETE), Render
> `/finanzen/bank` sauber, Kanban-Drag-Reorder per Seed-Smoke bestätigt (board_sort 0/1). Der
> Punkt „SQL offen: 022" unter §3 ist damit erledigt.

## 1. Gebaut (echte Dateien/Felder)

**Punkt 1 — Vorfilter eigene Umbuchungen (BEIDES):**
- **Auto-Quelle:** Import-Route lädt eigene Namen aus `firmen.name` + `bank_konten.bezeichnung`
  → `kontoinhaber` (Empfänger = eigener Name → ignoriert).
- **Pflegbare Liste:** Migration 022 `bank_ignorier_muster` (mandant_id, muster, aktiv) +
  API `/api/fibu/bank/ignorier` (GET/POST) und `…/[id]` (DELETE) + Settings-UI im Cockpit.
- Default-Muster (Geldtransit/GT KSK/KSKLB/Umbuchung) greifen jetzt **immer** und werden um die
  Mandanten-Muster ergänzt (`bank-match.ts`).

**Punkt 2 — FIFO-Kaskade + Guthaben (Kontokorrent):**
- `lib/fibu/op-abgleich.ts` → neue reine Funktion `verteileEinnahme(betrag, forderungen[])`:
  verteilt eine Einnahme über mehrere offene Forderungen (älteste zuerst); Überzahlung bedient
  die nächste, Rest → Guthaben. **+4 Unit-Tests.**
- Import- und Zuordnen-Route nutzen die Kaskade (mehrere Forderungen werden aktualisiert,
  `bezahlt_betrag`/`status`/`bezahlt_am`); In-Memory-Stand für Folgezeilen desselben Imports
  wird mitgeführt (kein Doppelverbuchen).

**Punkt 3 — Confidence-Schwellen zentral konfigurierbar:**
- Migration 022 `bank_einstellungen` (mandant_id PK, auto_schwelle/pruefen_schwelle/name_min,
  Defaults 0.90/0.75/0.82). Import-Route lädt sie → `ctx.schwellen` (Fallback = Code-Defaults).
- API `/api/fibu/bank/einstellungen` (GET/PUT-Upsert) + Settings-UI (Zahlenfelder + Speichern).
- „Ohne Code-Änderung justierbar" erfüllt (DB-Zeile statt Hardcode); Defaults wie Beleg-Gating-Muster.

**Kanban — Drag-Smoke (Punkt aus Kanban-Report):**
- Verifiziert mit **echten Seed-Daten**: 2 Wegwerf-Vorgänge angelegt → reales Pointer-Drag auf
  `/vorgaenge/plantafel` → `board_sort` persistiert distinkt (**0 / 1**) → Vorgänge wieder gelöscht.
  Bestätigt die End-to-End-Persistenz der manuellen Reihenfolge. (Throwaway-Test, nicht committet.)

**Qualität:** `npm run build` grün (Bank-Routen inkl. einstellungen/ignorier registriert),
`npm run test:run` **318 grün** (4 neue Kaskaden-Tests).

## 2. Abweichungen

- **Eigene-Namen-Quelle:** Es gibt kein dediziertes „Kontoinhaber"-Feld an `bank_konten`. Ich
  nutze `bank_konten.bezeichnung` (Konto-Label) + `firmen.name`. Falls die Bezeichnung nicht dem
  echten Inhabernamen entspricht, wäre ein `inhaber`-Feld sinnvoll (s. Rückfragen).
- **Schwellen-Speicher:** Beleg-Gating hält Defaults im Code (per Param überschreibbar). Für Bank
  habe ich bewusst eine **DB-Zeile** gewählt (Anforderung „ohne Code-Änderung justierbar") — also
  „analog" im Verhalten (Defaults + überschreibbar), aber persistent.

## 3. Offen

- **SQL-Stop:** `022_bank_einstellungen.sql` einspielen (nach 021). Bis dahin nutzen Import/Settings
  die Code-Defaults nicht aus der DB (Settings-UI wirft beim Speichern Fehler, Tabellen fehlen).
- Echte WISO-Exporte zum Schärfen der Schwellen/Muster (kommt von Max).
- Lerneffekt manuell bestätigter Absender→Vertrag-Zuordnung (künftig auto) = Phase 2.

## 4. Rückfragen / Für Spec-Nachzug (Konzept-Claude)

1. **Kontoinhaber-Feld:** Soll `bank_konten` ein explizites `inhaber`-Textfeld bekommen (echter
   Name fürs Vorfilter-Matching), oder reicht `bezeichnung` + `firmen.name`?
2. **Spec-Nachzug 002_fibu** (durch Konzept-Claude): Migration 022 (`bank_einstellungen` +
   `bank_ignorier_muster`), FIFO-Kaskade (`verteileEinnahme`), Auto-Namen-Vorfilter, konfigurierbare
   Schwellen — von „Spec vorab/0.11.0" auf diesen gebauten Stand nachziehen.
3. **001_erp:** unverändert relevant — Belegungs-/Vorgangs-Engine bleibt separat; K1 = bestehendes
   `objekte.kuerzel` (kein neues Feld), wie gebaut.
