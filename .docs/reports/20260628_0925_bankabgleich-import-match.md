# Report — Bank-Abgleich (FiBu 0002), 2026-06-28 09:25

> Nachtlauf Aufgabe A. Sicherung: Tag `sicherung/vor-bankabgleich-20260628-0252`.
> Build + 314 Tests grün. **SQL offen: Migration 021** (Stop-Punkt, DB-Port zu).

## 1. Gebaut (echte Dateien/Felder)

**Migration 021** (`021_bank_abgleich.sql`, additiv/idempotent, RLS + Touch-Trigger):
- `bank_konten` (mandant_id, bezeichnung, iban, bank, aktiv).
- `bank_umsaetze` (wertstellung, empfaenger, verwendungszweck, kategorie_wiso, betrag, saldo,
  richtung, **import_hash UNIQUE** = Dublettenschutz, erkanntes_k1, objekt_id/einheit_id/
  mietvertrag_id, match_methode, match_confidence, zuordnung_status, forderung_id, …).

**Eine Fuzzy-Engine im ganzen ERP** (`lib/fibu/fuzzy.ts`, `fuzzball.token_set_ratio`):
- `lieferant-match.ts` von handgeschriebener Distanz auf die Lib umgestellt — **Domänen-Logik
  (Normalisierung/Alias/exakt-vor-fuzzy) bleibt**, bestehende 5 Tests grün.
- Bank-Namensmatch nutzt dieselbe Engine + Personen-Varianten („Nachname, Vorname" ↔ „Vorname Nachname").

**Match-Engine + Parser + OP (rein, getestet, +16 Tests):**
- `bank-csv.ts` — KSK/WISO-Parser (deutsches Datum/Betrag, `;`, papaparse; CP1252-Decode in der API).
- `bank-match.ts` — Vorfilter (Geldtransit/eigene Umbuchung) → K1 (über vorhandenen
  `parseVerwendungszweck` + `objekte.kuerzel`/`einheiten.verwendungszweck_code`) → Name (Fuzzy)
  → Betrag-Bestätiger → Confidence-Routing (auto/pruefen/klaeren). Ausgaben: nur K1-Objektbezug.
- `op-abgleich.ts` — Einnahme → offene `forderung` (typ=miete): voll/teil/über (Guthaben).

**API:** `/api/fibu/bank/import` (multipart, CP1252→UTF8, Match, OP-Update, Dublettenschutz),
`/api/fibu/bank/umsaetze/[id]/zuordnen` (manuell, OP-Abgleich), `/api/fibu/bank/konten` (GET/POST).

**UI:** `/finanzen/bank` (`components/fibu/bank-cockpit.tsx`) — Import (Konto-Auswahl + CSV),
Import-Summary, Status-Filter, Umsatz-Tabelle mit Confidence-Badges, Klär-Zuordnung (Vertrag
wählen → OP) + Ignorieren. Verlinkt von der Finanzen-Übersicht.

**Qualität:** `npm run build` grün (3 Bank-Routen registriert), `npm run test:run` **314 grün**.

## 2. Abweichungen (Auftrag ↔ Realität)

- **`papaparse` war NICHT installiert** (Auftrag: „vorhanden"). → `papaparse` + `@types/papaparse`
  + `fuzzball` installiert.
- **K1→objekt/einheit-Auflösung war NICHT offen** (Auftrag fürchtete Lücke): `objekte.kuerzel`
  (varchar unique) und `einheiten.verwendungszweck_code` existieren real und werden überall in
  Selects genutzt → saubere Auflösung. Token `BHS16W3Z1` → Objekt `BHS16` via `parseVerwendungszweck`;
  volle Einheit-Codes → Einheit direkt. **Kein Raten, kein Blocker.**
- OP-Abgleich nutzt vorhandenes `offenerBetrag()` + `forderungen`-Felder (betrag/bezahlt_betrag/
  status/bezahlt_am) 1:1 — kein neues Modell, Mahnlauf unberührt.

## 3. Offen (bewusst)

- **SQL-Stop:** `021_bank_abgleich.sql` einspielen (Supabase SQL-Editor). Bis dahin wirft
  `/finanzen/bank` einen Fehler (Tabellen fehlen); Import/Zuordnen erst danach testbar.
- **Eigene Kontoinhaber-Namen** für den Vorfilter sind konfigurierbar (`kontoinhaber`), aktuell
  leer (nur Muster Geldtransit/GT KSK/KSKLB greifen). Pflege/Quelle offen (s. Rückfragen).
- **Ausgaben:** K1-Objektbezug gesetzt, aber Beleg-Verknüpfung (OCR-Beleg ↔ Umsatz) später.
- **Lerneffekt** (manuell bestätigte Absender→Vertrag dauerhaft merken → künftig auto) = Phase 2.
- **Andere Banken** (anderes CSV-Layout) → Parser-Variante später; aktuell KSK-Ludwigsburg fix.
- Kein automatisierter E2E des Imports (DB leer, braucht Echtdaten + eingespielte 021).

## 4. Rückfragen

1. **Vorfilter eigene Umbuchungen per Name:** Soll ich die eigenen Kontoinhaber-/Firmen-Namen
   (für „Empfänger = eigener Kontoinhaber → ignoriert") aus `firmen`/`bank_konten` ziehen, oder
   möchtest du eine pflegbare Ignorier-Liste je Mandant (Settings)?
2. **Mehrere offene Miete-Forderungen je Vertrag:** Ich verrechne die **älteste zuerst** (FIFO).
   Passt das, oder soll bei Überzahlung automatisch die nächste Forderung mitbedient werden?
3. **Confidence-Schwellen** (auto ≥0.90 / pruefen ≥0.75, Name-Min 0.82) als Default gesetzt —
   so lassen oder zentral konfigurierbar (analog Beleg-Gating)?
4. Nach Einspielen von 021: 2–3 echte WISO-Exporte zum Schärfen der Schwellen/Vorfilter-Muster?
