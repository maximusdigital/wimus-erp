# Report — Belegungs-Engine + Sperren (Kern 0001), 2026-06-28 11:00 MESZ

> Prompt `20260628_1715_prompt_occupancy-beds24-sync.md`. **Keine Spec-Edits** (Spec-Nachzug
> = Konzept-Claude). Sicherung: Tag `sicherung/vor-belegung-engine-20260628-1100`.
> Build + **326 Unit-Tests grün**. **SQL offen: Migration 023.**

## 1. Gebaut (echte Tabellen/Felder/Dateien)

**Engine (rein, Pflicht-Tests):** `lib/belegung/verfuegbarkeit.ts` —
`istVerfuegbar(von,bis,belegungen,ausser?)` / `findeKollisionen` / `ueberlappt`
(halboffene Intervalle `von1<bis2 ∧ von2<bis1`; `bis=null` = offenes Ende; `ausser` nimmt
eigenen Eintrag beim Bearbeiten aus). **+8 Unit-Tests** (kein Overlap, Rand-Tag/Check-out frei,
offenes Ende, Multi-Quellen, ausser).

**Loader:** `lib/belegung/laden.ts` — lädt die 3 Quellen einer Einheit über den **RLS-gebundenen
Server-Client** (KEINE Service-Role): `buchungen` (checkin/checkout), `mietvertraege`
(mietbeginn/mietende), `belegung_sperren` → mappt auf `Belegung[]`.

**Migration 023** `belegung_sperren`: mandant_id, einheit_id, von DATE, bis DATE (NULL=offen),
grund ENUM (renovierung/eigennutzung/leerstand_gewollt/sonstiges), notiz, **beds24_geblockt**
BOOL (Hook), created_by_akteur_id; RLS `mandant_isolation`, Touch-Trigger, idempotent,
CHECK(bis≥von).

**API:** `/api/belegung/pruefen` (POST → istVerfuegbar über alle Quellen),
`/api/belegung/sperren` (GET/POST), `/api/belegung/sperren/[id]` (DELETE).

**UI:** `/belegung` (`belegung-cockpit.tsx`) — Verfügbarkeits-Prüfer (Einheit + Zeitraum →
frei/Kollisionsliste je Quelle) + Sperren-CRUD; Sidebar-Eintrag „Belegung".

**Vorab-Check beim Anlegen (Punkt 3, WARNT — kein Hard-Block):** wiederverwendbare
`belegung-hinweis.tsx` inline in **Buchungs-Form** (KZV) **und Vertrags-Form** (MV) — zeigt bei
Datumswahl frei/Kollision(en); Mensch entscheidet „trotzdem anlegen".

## 2. Abweichungen (Auftrag ↔ Realität)

- **`lib/integrations/beds24.ts` existiert NICHT** (Auftrag: „nutzt vorhandene…"). Es gibt nur den
  *eingehenden* Beds24-Webhook-Skeleton; ein *ausgehender* API-Client fehlt komplett.
- **Kein `einheiten→beds24 roomId/propId`-Mapping** im Schema (`einheiten` hat kein beds24-Feld;
  nur `buchungen.beds24_id` existiert). → **Beds24-Block (Punkt 4) komplett geparkt** (Feld
  `beds24_geblockt` ist als Hook angelegt, aber kein Live-Call). Wie vom Prompt vorgesehen: nicht geraten.
- **MV-Ende-Semantik:** Engine ist einheitlich halboffen (KZV-Check-out-Tag frei). Damit wird der
  `mietende`-Tag als frei behandelt. Falls ein MV bis `mietende` **inklusive** belegt, im Loader
  `bis = mietende + 1 Tag` setzen (s. Rückfragen).
- Vorab-Check ist bewusst **weich** (Warnung), wie gefordert — kein Speicher-Block.

## 3. Offen

- **SQL-Stop:** `023_belegung_sperren.sql` einspielen. Bis dahin werfen `/belegung` + die
  Vorab-Checks Fehler (Tabelle fehlt).
- **Beds24-Block** (Punkt 4) vollständig offen: API-Client, Calendar-Block-Endpoint, Mapping,
  Fehler-Retry (n8n) — abhängig von den Rückfragen.
- **`ausser` im Edit-Flow** nicht durchgereicht (Anlege-Flow hat kein Selbst; beim Bearbeiten
  einer bestehenden Buchung/MV würde der Hinweis sich selbst als Kollision zeigen) — Engine kann
  es (Param vorhanden), nur die Form-Verdrahtung fehlt.
- Optionaler **Belegungs-Kalender je Einheit** (alle 3 Quellen farblich) — geparkt (Zeit).

## 4. Rückfragen

1. **Beds24 V2:** korrekter Calendar-/Availability-Block-Endpoint + Auth, und wie ist
   Einheit→roomId/propId zu hinterlegen (neues Feld an `einheiten`?). Soll ich
   `lib/integrations/beds24.ts` (ausgehend) neu bauen?
2. **Eingehender Beds24-Webhook** (Doppelbuchungs-Vermeidung) ↔ ausgehender Block: kollidieren die,
   oder sauberer Loop-Schutz nötig?
3. **Initial-Sync:** bestehende offene MV/Buchungen rückwirkend nach Beds24 blocken?
4. **MV-Ende inklusiv?** `mietende` als letzter belegter Tag (Loader `+1`) oder halboffen wie KZV?
5. **Spec-Nachzug (001_erp 000/200/300):** `belegung_sperren` + Belegungs-Engine + Vorab-Check
   in den Kern-Specs nachziehen (Konzept-Claude) — der Prompt nannte das als Pflicht, fällt aber
   unter die neue Spec-Arbeitsteilung.
