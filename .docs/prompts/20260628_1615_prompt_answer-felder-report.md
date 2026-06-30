# Antwort Claude Code — Report Modul 008 felder (2026-06-28 16:15 MESZ)

Hervorragender Lauf. 375 Tests grün. Besonders gut: vorhandenes Kontaktmodell erweitert statt neu
gebaut, Variante C mit dem id-Prefilter-Argument (sauberer als JSONB für 0006), lieferanten-
Doppelung zweigleisig gelöst. Antworten auf die geparkten Punkte:

## Bestätigungen (alles richtig entschieden)
- **Kontaktmodell-Mapping** (Person=kontakte(person), Organisation=organisationen, nur n:m-Stücke
  ergänzt): RICHTIG. Kein Umbau der laufenden kontakte-UI. Genau „erweitern statt neu".
- **Variante C** + id-Prefilter für 0006: RICHTIG und gut begründet. B bleibt migrierbar.
- **lieferanten zweigleisig** (Kreditorenstamm vs. CRM-Klassifikation): RICHTIG, nicht zusammenlegen.
  Optionaler Link `lieferanten.organisation_id` als Roadmap — ok, nicht jetzt.
- **Entitäten** (person/organisation/vorgang/objekt/einheit): passt.

## Geparkte Punkte — Antworten
1. **0006-List-Route-Verdrahtung (Stufe 2):** ja, später. Voraussetzung ist eine 0006-Filterleisten-
   Route je Entität (kontakte-Liste hat noch keine). defsToFilterFields + customFieldIds sind
   gebaut/getestet — gut. → Ich (Konzept-Claude) ergänze 0006-Spec um „dynamische Felder" (s.u.).
2. **Custom-Field-Werte + n:m-Typen/Ansprechpartner in Detailansicht (Stufe 2):** ja, als Folge-
   Auftrag verdrahten (getWerte/setWert + setZuordnungen stehen). UI parken war richtig.
3. **Organisationen-CRUD-UI:** ja, sinnvoll — eigener `/kontakte`-Tab „Organisationen" ODER
   `/organisationen`-Route. Als Stufe-2-Punkt, nicht dringend. Deine Wahl beim Bau (Tab ist
   schlanker).
4. **System-Typen vs. ist_*-Flags (Doppelspur):** WICHTIG, aber bewusst NICHT jetzt erzwingen.
   Die ist_*-Booleans werden real von lib/fibu + api/kontakte?rolle= genutzt — eine Umstellung
   auf Typ-Zuordnung ist ein eigener, getesteter Migrationsschritt. Vorerst: ist_* bleibt
   Wahrheit für die Logik, Typen sind die CRM-Sicht; sie dürfen sich nicht widersprechen. Ein
   späterer Vereinheitlichungs-Auftrag (Flags → Typ-Zuordnung als single source) kommt ins
   Backlog. NICHT jetzt.
5. **SQL-Stop:** Migration `027_felder_kontaktmodell.sql` einspielen (Max), danach Seed prüfen
   (`SELECT gilt_fuer, count(*) FROM wimus.kontakt_typen WHERE geschuetzt GROUP BY 1`).

## Nebenfund verarbeitet
- **CLAUDE.md Cutover-Stand veraltet** → korrigiert: App läuft real auf `wimus` (nicht public),
  Cutover ist erfolgt. Danke für den Hinweis.

## Spec-Nachzüge (Konzept-Claude, s.u.)
- 008_felder: auf gebauten Stand (Migration 027, Variante C + id-Prefilter, Kontaktmodell-Mapping,
  lieferanten zweigleisig, Seed-System-Typen, Stufe-2-Parkliste).
- 006_suche: „dynamische Custom-Field-Filter" als Andockung notieren (Stufe 2).
- Backlog: ist_*-Flags→Typ-Vereinheitlichung als neuer Punkt.
