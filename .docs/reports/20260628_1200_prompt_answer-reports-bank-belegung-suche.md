# Antworten Claude Code — Reports Bank/Belegung/Suche (2026-06-28 12:00 MESZ)

Drei Reports geprüft, alle sauber gebaut, alle grün (318/326/332). Sehr gutes Parken statt Raten
(Beds24, Whitelist-Entitäten). Antworten auf die Rückfragen, nach Modul:

## A) Bank-Abgleich (Report 1000) — 002_fibu
1. **Kontoinhaber-Feld:** Ja, `bank_konten` ein explizites `inhaber`-Textfeld geben (echter
   Inhabername fürs Vorfilter-Matching). `bezeichnung` ist ein Label und unzuverlässig fürs
   Namens-Matching. `inhaber` NULLable, Vorfilter nutzt `inhaber` falls gesetzt, sonst Fallback
   `bezeichnung` + `firmen.name`. (Kleine Migration, additiv.)
2. **Spec-Nachzug 002_fibu:** macht Konzept-Claude (s.u., v0.12.0).
- Migration 022 ist eingespielt+verifiziert ✓ — kein offener SQL-Stop hier.

## B) Belegungs-Engine (Report 1100) — 001_erp
**SQL-Stop:** `023_belegung_sperren.sql` einspielen (Max).
1. **Beds24 V2 ausgehender Block:** Ja, `lib/integrations/beds24.ts` (ausgehend) neu bauen —
   ABER als EIGENER Folge-Auftrag, nicht jetzt nachschieben. Endpoint: Beds24 V2 `POST
   /bookings` mit Block-Typ bzw. Calendar-API (`/inventory/rooms/calendar` zum Sperren von
   Tagen). Auth: V2 nutzt API-Key (token) im Header `token` + `propKey`. Mapping: neues Feld
   `einheiten.beds24_room_id` (+ ggf. `beds24_prop_id`) — additive Migration. Recherche/Spec
   dafür mache ich (Konzept-Claude) separat, dann Bau-Prompt.
2. **Webhook (eingehend) ↔ Block (ausgehend) Loop-Schutz:** Ja, nötig. Wenn ERP einen Block nach
   Beds24 pusht und Beds24 daraufhin einen Webhook zurückschickt, darf das ERP daraus keine neue
   Buchung/Sperre ableiten. Lösung: ausgehende Blocks mit Quelle-Markierung (`quelle=erp`), beim
   eingehenden Webhook prüfen ob es ein Echo des eigenen Blocks ist (idempotent über extern_id/
   Zeitraum) → ignorieren. In die Beds24-Spec.
3. **Initial-Sync:** Ja, bestehende offene MV/Buchungen rückwirkend nach Beds24 blocken — aber als
   bewusster, einmaliger, idempotenter Sync-Lauf (kein Auto-bei-jedem-Start), im Beds24-Auftrag.
4. **MV-Ende inklusiv?** WICHTIG: MV ist **inklusiv** bis `mietende` (anders als KZV-Check-out).
   Bei einem Mietvertrag ist der letzte Miettag belegt, der Mieter zieht erst am Folgetag aus.
   → Im Loader `bis = mietende + 1 Tag` setzen (halboffen normalisiert). KZV bleibt wie ist
   (Check-out-Tag frei). Bitte so umsetzen.
5. **Spec-Nachzug 001_erp:** macht Konzept-Claude (s.u., v5.3.0).

## C) Suche (Report 1130) — 006_suche
**SQL-Stop:** `024_suche_trigram.sql` einspielen (Max).
1. **Whitelist-Ergänzung:** Bitte verifiziere selbst gegen das reale Schema (nicht raten) — meine
   Vermutung: rechnungen→`belege`? lieferanten→`fibu_lieferanten`? nachrichten→noch keine (kommt
   erst mit Modul 007 `kom_nachrichten`). Nimm nur auf, was real existiert + Textspalten hat;
   `nachrichten` SPÄTER (wenn 007 gebaut ist, dann `kom_nachrichten` als Such-Entität). Rest im
   nächsten Report bestätigen.
2. **Filter-Leiste als Nächstes:** Ja, FiBu/Bank zuerst (große Tabellen) bestätigt. Vorgänge ✓.
3. **similarity()-RPC:** SPÄTER. ILIKE + gin_trgm_ops reicht für Stufe 1 voll aus. Echtes
   Trigram-Ranking via RPC erst, wenn die Treffer-Qualität real stört (Roadmap). Nicht jetzt.
4. **`/buchungen/{id}` Route:** Falls die Detailseite nicht existiert, auf die Liste routen
   (`/finanzen/...` bzw. Buchungsliste) — bitte prüfen, kein toter Link.
5. **RLS-Automattest:** Bitte als Lücke offen lassen für jetzt; wenn ihr 2 Test-User-Fixtures
   habt, im nächsten Durchlauf einen Cross-Mandant-Test ergänzen. Wichtig genug, um es nicht zu
   vergessen — aber kein Blocker.
6. **Spec-Nachzug 006_suche:** macht Konzept-Claude (s.u., v0.2.0 → gebauter Stand).

## Offene SQL-Stops für Max (zusammengefasst)
- `023_belegung_sperren.sql` (Belegung)
- `024_suche_trigram.sql` (Suche)
- (`022_bank_einstellungen.sql` bereits eingespielt ✓)
