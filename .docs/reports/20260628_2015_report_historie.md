# Report: Modul 009 (historie) — Audit-Log + Aktivitäts-Historie (2026-06-28 20:15 MESZ)

Auftrag: `20260628_1730_prompt_historie-modul-aufbau.md` · Spec `009_historie_000/200/300`
Commits: `741d1d7` (Code) · Migration 028 eingespielt via `/pg/query` + verifiziert.
Safety-Tag: `pre-modul009-historie` (`ab35250`). Tests 382 grün, build grün.

## 1. Gebaut — mit echten Tabellen/Feldern

**Migration `028_historie.sql`** (additiv/idempotent, eingespielt + verifiziert):
- `changed_keys(old,new)` + `audit_trigger()` (SECURITY DEFINER, **EXCEPTION-gekapselt** →
  Logging-Fehler bricht die DB-Operation nie ab).
- `audit_log` (append-only, BIGINT-Identity) + 2 Indizes. **Grant = nur SELECT** für
  `authenticated` (kein App-Schreibpfad; schreibt ausschließlich der Trigger).
- **Audit-Trigger auf 10 Whitelist-Tabellen** (real verifiziert, alle mit `id`+`mandant_id`):
  `mietvertraege, kontakte, organisationen, forderungen, mahnungen, buchungen, belege,
  bank_umsaetze, belegung_sperren, fibu_buchungen`.
- `aktivitaeten` + `aktivitaet_bezug` (n:m, `quelle` primaer|abgeleitet) + Indizes + RLS
  `mandant_isolation`.

**Verifikation (über `/pg/query`):**
```
Tabellen   : audit_log ✓  aktivitaeten ✓  aktivitaet_bezug ✓
Funktionen : audit_trigger ✓  changed_keys ✓
Trigger    : 10/10 auf der Whitelist ✓
audit_log  : authenticated = SELECT only ✓ (append-only)
```

**Service `lib/historie/`** (Module rufen NUR `protokolliere()`):
- `bezug.ts` reine Bezug-Ableitung (0007-Muster), `protokolliere.ts` (schreibt `aktivitaeten`
  + leitet Bezüge über Hierarchie ab: Mietvertrag→Mieter/Einheit→Objekt, Buchung/Mahnung/
  Forderung→Mietvertrag…), `feed.ts` (zentral + dezentral via `quelle`), `audit.ts` (lesen),
  `akteur.ts`, `stil.ts` (Typ/Modul→Icon/Farbe + Zeit-Gruppierung), `index.ts`.

**UI:** EINE Timeline-Komponente (Pipedrive-Stil, Typ-Icon+Token-Farbe, Zeit-Gruppierung,
Modul-Filter, expandierbare Karten) — zentral `/historie`, dezentral `<HistorieTab>`
(Ebenen-Umschalter „nur diese Ebene / inkl. untergeordnete"), Audit-Tabelle
`/einstellungen/audit` (nüchtern). Sidebar-Eintrag „Historie" + Hub-Eintrag „Audit-Log".

**Lieferant verdrahtet:** `vertrag_angelegt` (api/vertraege POST, nicht-blockierend).

**Tests:** `tests/unit/lib/historie.test.ts` (7): leiteBezuege (Dedup/Quelle), Stil (Farbe/Icon),
Zeit-Gruppierung.

## 2. Abweichungen / Designentscheidungen

- **Akteur-Session-Var (zentraler Realitäts-Befund):** `SET LOCAL wimus.akteur_id` ist über
  supabase-js/PostgREST **nicht** pro Request setzbar (HTTP, keine App-seitige Transaktion/
  Session). Lösung: der Trigger liest die Reihenfolge **`wimus.akteur_id` → `request.jwt.claims`
  ->>'sub' → NULL(=direkt)**. `request.jwt.claims` setzt PostgREST je authentifiziertem Request
  automatisch → Audit kennt den auth-User **ohne** App-Code. Verifiziert: bei Service-Role ist
  die Claim leer (→ würde `direkt`), bei normalem User-Request trägt sie `sub`.
- **akteur_id ohne harte FK:** Der erfasste „Wer" ist die **auth-User-UUID** (`auth.users`),
  nicht zwingend eine `wimus.akteure`-Zeile → `akteur_id uuid` ohne FK (eine FK auf akteure
  würde auth-User-IDs ablehnen). Mapping auth-User→akteur ist Folge-Punkt.
- **Append-only** über Grant (nur SELECT) statt Trigger-Verbot — schlanker, gleicher Effekt.
- **Whitelist** = 10 statt der Spec-Kandidatenliste: „Zugang/Schloss-Tabellen" existieren real
  noch nicht (TTLock extern, Phase 3) → weggelassen; `fibu_buchungen` ergänzt (FiBu-Finanzen).

## 3. Offen (Folge-Aufträge, geparkt)

1. **Weitere Lieferanten verdrahten:** FiBu (`zahlung_eingegangen`, `mahnung_versandt`,
   `beleg_verbucht`), Kommunikation (`nachricht_gesendet/empfangen`), Belegung
   (`sperre_gesetzt`, `buchung_angelegt`). Service steht, nur die Aufrufe fehlen.
2. **Historie-Reiter in Detailseiten einbauen:** `<HistorieTab bezugTyp=… bezugId=…>` ist fertig
   und API-gestützt, aber noch in keine `objekte/[id]` / `einheiten/[id]` / `kontakte/[id]` /
   `vorgaenge/[id]`-Seite eingehängt.
3. **Strikte Rollen-Restriktion Audit-Ansicht:** aktuell nur Mandanten-RLS + authentifiziert;
   „nur Verwalter/Admin" braucht den Rollen-Layer (kein einfacher Helper vorhanden) → eigener
   Schritt. App-Hinweis steht auf der Seite.
4. **audit_log_id-Verknüpfung:** `aktivitaeten.audit_log_id` existiert, wird aber noch nicht
   befüllt (Aktivität↔Audit-Eintrag koppeln) — optional, Roadmap.

## 4. Rückfragen / Entscheidungsbedarf

- **Retention-Vorschlag (DSGVO ↔ Audit-Pflicht):** Default-Aufbewahrung `audit_log` **10 Jahre**
  (analog GoBD/handelsrechtlicher Aufbewahrung), danach Retention-Job (append-only-Ausnahme).
  Aktivitäts-Historie (`aktivitaeten`) als fachliche Sicht: **unbegrenzt** behalten, da
  kuratiert/klein. Personenbezug in `audit_log.alt/neu` (JSONB) ist das DSGVO-Spannungsfeld →
  bei Lösch-Ersuchen ggf. gezielte Anonymisierung der betroffenen Datensatz-IDs statt Komplett-
  Löschung (Audit-Integrität). Bitte Default 10 J. bestätigen oder anpassen — dann baue ich den
  Retention-Job als eigenen Schritt.
- **Lieferanten-Priorität:** Reihenfolge der nächsten Verdrahtung (Vorschlag: FiBu Zahlung/Mahnung
  zuerst, dann Kommunikation) — ok so?
