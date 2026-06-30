# Bau-Auftrag: FiBu als Historie-Lieferant (2026-06-29 11:30 MESZ)

Voller Arbeitszyklus (CLAUDE.md, „check"). Backlog #14, erster bestätigter Historie-Folge-Auftrag.
Modul 009 (historie) ist gebaut + live (Migration 028); `protokolliere()` steht. Hier werden NUR
die FiBu-Aufrufe verdrahtet — keine neue Infrastruktur, keine Migration.

## Scope: drei FiBu-Aktivitäten an die Historie andocken
Über `protokolliere(typ, modul='fibu', titel, payload, primaerBezug)` (Service `lib/historie/`,
nicht-blockierend) — analog zu `nachricht_empfangen`/`nachricht_gesendet` (007) und
`vertrag_angelegt` (Verträge). Reihenfolge nach Nutzen:

1. **`zahlung_eingegangen`** — beim Zuordnen einer Zahlung zu einer Forderung/OP.
   Realer Andockpunkt: `lib/fibu/op-abgleich.ts` (OP-Abgleich) bzw. `lib/fibu/bank-match.ts`
   (Bank-Match) — dort, wo eine Zahlung einem Mietvertrag/einer Forderung zugeordnet wird.
   primaerBezug = der zugeordnete Mietvertrag/Mieter (Hierarchie Mieter→Einheit→Objekt wird vom
   Service abgeleitet). payload z.B. {betrag, datum, forderung_id, quelle: 'bank'|'manuell'}.

2. **`mahnung_versandt`** — beim Auslösen/Versenden einer Mahnung.
   Realer Andockpunkt: `lib/utils/mahnlauf.ts` / `lib/utils/mahnwesen.ts`.
   primaerBezug = Mietvertrag/Mieter der Mahnung. payload z.B. {mahnstufe, betrag, forderung_id}.

3. **`beleg_verbucht`** — wenn ein Beleg verbucht/kontiert ist.
   Realer Andockpunkt: `lib/fibu/beleg-pipeline.ts`.
   primaerBezug = Objekt/Einheit des Belegs (falls vorhanden), sonst nur Mandant. payload z.B.
   {beleg_id, betrag, konto, art}.

## HARTE Anforderungen
- **Nicht-blockierend:** `protokolliere()`-Fehler darf den FiBu-Vorgang (Zahlung/Mahnung/Beleg)
  NIE abbrechen (wie bei den 007-Lieferanten). Logging-Fehler schlucken/separat behandeln.
- **Nichts doppeln:** den bestehenden `protokolliere()`-Service + Bezug-Ableitung nutzen, KEINE
  zweite Historie-Logik in der FiBu bauen. Helper aus `lib/historie/` referenzieren.
- **Reale Felder verifizieren:** vor dem Andocken prüfen, welche IDs/Felder an der jeweiligen
  Stelle real verfügbar sind (mietvertrag_id, forderung_id, objekt/einheit). Nicht raten — wenn
  ein Bezug an einer Stelle real nicht greifbar ist, im Report als Frage parken.
- **RLS/mandant_id:** Aktivitäten erben den Mandanten wie gehabt.
- Keine Migration (aktivitaeten/aktivitaet_bezug existieren seit 028). Falls doch ein Feld fehlt:
  NICHT raten, im Report parken.

## Komplexität
NORMAL → voller Pfad (mehrere Dateien, neues Verhalten an Modul-Grenzen). Review-Subagent (Schritt 5)
prüft besonders: keine doppelte Historie-Logik, nicht-blockierend, reale Bezüge.

## Tests
- Unit je Lieferant: Vorgang ausgelöst → `protokolliere` mit korrektem typ/modul/primaerBezug
  aufgerufen (Mock), Bezug-Ableitung greift. Nicht-blockierend: protokolliere wirft → FiBu-Vorgang
  läuft trotzdem grün.

## Hinweis (Sichtbarkeit)
Die Aktivitäten erscheinen im zentralen Feed `/historie` + im dezentralen HistorieTab — letzterer
ist aber noch in keine Detailseite eingehängt (Backlog #14, eigener Stufe-2-Schritt). D.h. nach
diesem Bau sind die FiBu-Aktivitäten im zentralen Feed sichtbar; die dezentrale Anzeige kommt mit
dem HistorieTab-Einbau. Das ist ok — hier nur die Lieferanten verdrahten.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_fibu-historie-lieferant.md` — 4 Punkte. Besonders: welche
der 3 Lieferanten real verdrahtet (mit echten Andockpunkten/Feldern), welche Bezüge je Stelle real
greifbar waren, was ggf. geparkt wurde.
