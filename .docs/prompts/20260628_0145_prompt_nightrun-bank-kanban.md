# Nachtlauf-Auftrag Claude Code (2026-06-28) — beide Aufgaben durcharbeiten

Zwei Aufgaben in einem Lauf. **Autonom durcharbeiten** (Arbeitsweise s. Aufgabe A unten gilt
für beide), Blocker parken, am Ende Report(s) mit 4 Punkten je Thema, Namens­konvention
`JJJJMMTT_UHRZEIT_grobangabe.md`.

Reihenfolge: erst (B) Kanban-Nacharbeiten (klein, entblockt die Boards), dann (A) Bank-Abgleich.

---

# AUFGABE B — Kanban-Nacharbeiten (Antworten auf deinen Report)

Dein Kanban-/Schaden-Report ist geprüft, sauber abgearbeitet. Antworten auf deine 3 Rückfragen:

1. **Cross-Spalten-Drag = 2 Requests (Status + Reorder):** So lassen. Robust schlägt sparsam —
   keine Sonderfall-Optimierung („Reorder nur innerhalb Spalte").
2. **Tremor-Restnennung `003_crm_400` Section 7:** auf „shadcn-charts" angleichen, aber
   **gebündelt beim nächsten CRM-Touch** — kein eigener Lauf. Rein kosmetisch.
3. **E2E + Drag-Smoke:** Ja — ABER erst nachdem Migration `020_board_sort.sql` eingespielt ist.
   Reihenfolge: 020 einspielen (SQL-Editor) → E2E-Grobtests → kurzer Drag-Smoke (eine Karte
   verschieben + Reihenfolge prüfen).

**Blocker:** `020_board_sort.sql` muss in Supabase eingespielt werden (Spalte board_sort). Bis
dahin werfen `/vorgaenge/plantafel` und `/crm` einen Fehler. Falls noch nicht eingespielt: NICHT
erzwingen — E2E parken und im Report vermerken.

---

# AUFGABE A — Bank-Abgleich (FiBu 0002)


Voller Abgleich: WISO-CSV-Import → mehrstufiger Match → OP-Abgleich gegen `forderungen`.
Prozess: Git-Sicherung, gegen realen FiBu-Stand bauen, Tests grün, Report danach.

## WICHTIG — vorhandenes wiederverwenden, NICHT neu bauen

Vor dem Bau prüfen und nutzen (Code = Wahrheit):
- **K1 = Objekt-Kürzel.** K1 (IS17/ThS97/AS125…) ist bereits die Objekt-Kennung im System
  (FiBu `kontierungsregeln`, `objekt_tags`, `belege.k1`). **KEIN neues `kuerzel`-Feld anlegen.**
  Der Bank-Abgleich matcht gegen K1. **Vorhandenen Parser nutzen:**
  `lib/utils/verwendungszweck.ts` (`parseVerwendungszweck`) zieht aus dem Verwendungszweck bereits
  Objektkürzel(=K1)/Wohnung/Zimmer (Format `BHS16W3Z1`, passt auf Suffix wie `ThS97Z1`). NICHT
  neu bauen. → Ermittle zusätzlich, wie das Kürzel real auf objekt_id/einheit_id aufgelöst wird
  (Tabelle/Mapping). Falls die Kürzel→objekt/einheit-Zuordnung noch fehlt, im Report als
  Rückfrage melden (nicht raten).
- **Fuzzy-Matching über geprüfte Lib — und `lieferant-match.ts` JETZT explizit umstellen.**
  Grundsatz: fertige, getestete Libraries vor Eigenbau. Eine etablierte, gepflegte Fuzzy-Lib
  wählen (z.B. `fuzzball`/`string-similarity`) und als einzige String-Distanz-Engine im System
  etablieren:
  1. **`lib/fibu/lieferant-match.ts` umstellen:** handgeschriebene Distanzberechnung durch die
     Lib ersetzen. Domänen-Logik (Normalisierung „Nachname, Vorname" ↔ „Vorname Nachname",
     Alias-Auflösung, Mapping auf `firma_id`) BLEIBT — nur die Distanz kommt aus der Lib.
     Bestehende Tests grün halten/anpassen.
  2. **Bank-Abgleich nutzt dieselbe Lib + dieselbe Normalisierung** für den Mieter-Namens-Match.
  Ergebnis: genau EINE Fuzzy-Implementierung im ganzen ERP, keine zwei parallelen.
- **OP-Abgleich gegen `forderungen`.** Sollstellung Miete liegt als `forderungen` (typ=miete)
  vor (Phase 2, getestet: `forderungen.test.ts`, `mahnlauf.test.ts`). Einnahme → offene
  `forderung` schließen/reduzieren. KEIN neues OP-Modell. Mahnlauf-Mechanik (`istMahnfaehig`/
  `naechsteMahnung`) bleibt unberührt; Zahlungseingang stoppt Mahnung.
- **Namenskollision beachten:** `wimus.buchungen` = KZV (Beds24), `fibu_buchungen` = FiBu.
  Neue Tabelle daher `bank_umsaetze` (eindeutig), nicht `buchungen`.

## Echtes Exportformat (KSK Ludwigsburg, fix)

- Encoding **CP1252/ISO-8859-1**, Trennzeichen **`;`**, Zeilenende **CRLF**.
- Header (6 Spalten, fest): `Wertstellung;Empfänger/Auftraggeber;Verwendungszweck;Kategorie;Betrag;Stand`
- Datum `TT.MM.JJJJ HH:MM:SS` · Betrag deutsch `-1128,87` (Komma, Minus=Ausgabe) · Stand=Saldo.
- `papaparse` (vorhanden) + CP1252→UTF8-Dekodierung. **Keine Partner-IBAN im Export** → Match
  über Name, nicht IBAN.

## Datenmodell (Schema wimus)

- **bank_konten**: mandant_id, bezeichnung, iban, bank, aktiv.
- **bank_umsaetze**: mandant_id, bank_konto_id, wertstellung DATE, empfaenger TEXT,
  verwendungszweck TEXT, kategorie_wiso TEXT (informativ), betrag NUMERIC(12,2), saldo NUMERIC,
  richtung ENUM(einnahme/ausgabe) aus Vorzeichen, import_hash TEXT UNIQUE
  (mandant+konto+datum+betrag+zweck → Dublettenschutz), import_am,
  erkanntes_k1 TEXT NULL, objekt_id FK NULL, einheit_id FK NULL, mietvertrag_id FK NULL,
  match_methode TEXT NULL (k1/name/betrag/manuell), match_confidence NUMERIC(3,2) NULL,
  zuordnung_status ENUM(offen/zugeordnet/teilweise/manuell/ignoriert),
  forderung_id FK NULL (→ forderungen), zugeordnet_am, zugeordnet_von_akteur_id FK NULL.
- RLS mandant_isolation (wie ganzes wimus-Schema), Touch-Trigger, idempotent.

## Match-Engine (mehrstufig)

0. **Vorfilter „kein Mietabgleich":** eigene Umbuchungen aussortieren (Verwendungszweck/
   Empfänger enthält „Geldtransit"/„GT KSK"/„KSKLB-KSKLB"; oder Empfänger = eigener
   Kontoinhaber). → zuordnung_status=ignoriert. Liste konfigurierbar.
1. **K1-Match:** Verwendungszweck + Empfänger gegen K1-Kennungen (Auflösung wie im Code real,
   s.o.). K1 kann Suffix tragen (`ThS97Z1` → Objekt ThS97 + Einheit Z1). Treffer →
   objekt_id/einheit_id, match_methode=k1, hohe Confidence.
2. **Mieter-/Vertrags-Match über Absendername:** `empfaenger` gegen Namen aktiver
   Mietverträge/Mieter. String-Distanz über die **geprüfte Fuzzy-Lib** (s.o.);
   Normalisierungs-/Alias-Logik aus `lieferant-match.ts` wiederverwenden („Nachname, Vorname"
   ↔ „Vorname Nachname", Groß/Klein). Treffer → mietvertrag_id, match_methode=name.
3. **Betrag/Wiederkehr als Bestätiger:** Betrag ≈ offene Miete-Forderung des Kandidaten
   (+ optional monatliche Wiederkehr desselben Absenders) → erhöht Confidence.
4. **Confidence-Routing:** K1+Name+Betrag stimmig → auto · nur Name+Betrag → prüfen ·
   sonst → Klär-Liste. Schwellen konfigurierbar.

## OP-Abgleich (Einnahmen → forderungen)

Zugeordnete Einnahme gegen offene `forderung` (typ=miete) des Vertrags:
vollständig → Forderung beglichen · Teilzahlung → Restbetrag offen · Überzahlung → Guthaben.
Ausgaben (Minus): K1-Treffer → Objekt-Kostenbezug (Beleg-Verknüpfung später), kein OP-Abgleich.

## UI

- Import-Dialog (CSV wählen, Vorschau, Dubletten-Hinweis).
- Umsatz-Liste mit Match-Status/Confidence, Filter; RowActions-Pattern (Kern) nutzen.
- Klär-Liste: Vorschlag + manuell Vertrag/Objekt zuordnen; einmal zugeordnet = bestätigt.

## Offen / Vorbehalt (in Spec vermerken)

- K1→objekt/einheit-Auflösung: wie real gemappt? Falls unklar → Rückfrage im Report.
- K1-Liste füllt sich mit den Objekten/Einheiten — Max pflegt K1 selbst.
- Andere Banken-Konten (anderes CSV-Layout) → Parser-Variante später.
- Manuell bestätigte Absender→Vertrag-Zuordnung als Lerneffekt speichern (künftig auto) — Phase 2.

## Arbeitsweise: autonom durcharbeiten (gilt ab sofort generell)

- **Eigenständig und vollständig abschließen, ohne Zwischenrückfragen.** Du darfst über Nacht
  durchlaufen; die nötigen lokalen Rechte sind vorhanden. Arbeite alles ab, was sauber geht.
- **Nicht raten bei Blockern.** Offene Entscheidungen / Widersprüche / Spec-Lücken (z.B.
  K1→objekt/einheit-Auflösung unklar) NICHT selbst zudichten — **parken** und am Ende
  gesammelt im Report unter „Rückfragen" dokumentieren. Lieber einen Teil sauber fertig +
  Rest geparkt als etwas erzwungen.
- **Harte Leitplanken NIE umgehen, um „fertig" zu werden:** Git-Sicherung vorab; KEIN Commit
  ohne grüne Tests — rote Tests werden gemeldet, nie auskommentiert/übersprungen; Migrationen
  idempotent; nichts doppelt.

## Pflicht
Decision-Log + Änderungshistorie in FiBu-Konzept (Datum/Uhrzeit). Migrationen idempotent.
`npm run test:run` + `npm run build` grün, kein Commit bei Rot. Danach Report (4 Punkte:
Gebaut/Abweichungen/Offen/Rückfragen) als Datei `.docs/reports/JJJJMMTT_UHRZEIT_grobangabe.md`
(z.B. `20260629_0230_bankabgleich-import-match.md`).
