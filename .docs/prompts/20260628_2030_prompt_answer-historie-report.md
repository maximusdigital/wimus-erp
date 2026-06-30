# Antwort Claude Code — Report Modul 009 historie (2026-06-28 20:30 MESZ)

Sehr starker Lauf. 382 Tests grün, Migration 028 via /pg/query eingespielt+verifiziert. Besonders
der Akteur-Befund (SET LOCAL geht nicht → request.jwt.claims) ist genau das richtige Verhalten:
reale Grenze gefunden, saubere Lösung statt Workaround. Antworten:

## Bestätigungen (richtig entschieden)
- **Akteur über request.jwt.claims->>'sub'** (Fallback wimus.akteur_id → claims → NULL): RICHTIG.
  Audit kennt den auth-User ohne App-Code. Service-Role=leer→direkt ist sauber.
- **akteur_id uuid OHNE FK** (auth-User-UUID, nicht akteure-Zeile): RICHTIG. FK würde auth-IDs
  ablehnen. Mapping auth-User→akteur als Folge-Punkt ok.
- **append-only via Grant (nur SELECT)** statt Trigger-Verbot: gut, schlanker, gleicher Effekt.
- **Whitelist 10 Tabellen** (Zugang/Schloss weggelassen, da TTLock real noch nicht da;
  fibu_buchungen ergänzt): RICHTIG — nicht raten, was nicht existiert. Zugang kommt mit Phase 3.
- **EXCEPTION-gekapselter Trigger** (Logging-Fehler bricht DB-Op nie ab): genau die harte
  Anforderung erfüllt.

## Rückfragen — Antworten
1. **Retention `audit_log` Default 10 Jahre:** BESTÄTIGT (analog GoBD/§257 HGB/§147 AO —
   10 Jahre für buchungsrelevante Unterlagen passt, da die Whitelist v.a. Finanzen/Verträge
   abdeckt). Aktivitäts-Historie unbegrenzt: ok (kuratiert/klein).
   - **Präzisierung DSGVO-Spannungsfeld:** Bei Lösch-Ersuchen einer Person NICHT den Audit-Eintrag
     hart löschen (zerstört Integrität + verletzt ggf. Aufbewahrungspflicht), sondern **gezielte
     Anonymisierung/Pseudonymisierung** der personenbezogenen Felder im betroffenen alt/neu-JSONB
     (Name/Kontakt → Platzhalter), Datensatz-ID + Struktur bleiben. Genau wie du vorgeschlagen
     hast. Retention-Job als EIGENER Schritt (nicht jetzt), wenn echte Datenmengen da sind.
   - Hinweis: Retention ist rechtlich heikel — vor scharfschalten kurz mit Steuerberater/StB-Skill
     gegenchecken (welche Tabellen 10 J. vs. kürzer). Für jetzt: Default 10 J. dokumentieren, Job
     parken.
2. **Lieferanten-Priorität:** BESTÄTIGT — FiBu zuerst (zahlung_eingegangen, mahnung_versandt,
   beleg_verbucht), dann Kommunikation (nachricht_gesendet/empfangen — kommt ohnehin erst mit
   007-Bau), dann Belegung (sperre_gesetzt, buchung_angelegt). Reihenfolge nach realem Nutzen:
   Finanzen sind am wertvollsten im Zeitstrahl.

## Geparkte Folge-Punkte — Einordnung (alle ok so)
- Weitere Lieferanten verdrahten → Folge-Auftrag (s.o. Priorität).
- HistorieTab in Detailseiten einhängen → Stufe 2, zusammen mit den 008-Detail-Verdrahtungen
  sinnvoll (beide hängen an denselben Detailseiten objekte/einheiten/kontakte/vorgaenge).
- Rollen-Restriktion Audit-Ansicht (nur Verwalter/Admin) → braucht Rollen-Layer, eigener Schritt.
  WICHTIG genug vermerken: solange nur Mandanten-RLS, sieht jeder authentifizierte Nutzer des
  Mandanten das Audit-Log. Vor Echtbetrieb mit mehreren Nutzerrollen nachziehen.
- audit_log_id-Verknüpfung (Aktivität↔Audit) → optional/Roadmap, ok.

## Spec-Nachzug
009_historie auf gebauten Stand (Migration 028, request.jwt.claims-Akteur, 10 Whitelist-Tabellen,
akteur_id ohne FK, Grant-append-only, Retention 10 J. dokumentiert, Stufe-2-Parkliste).
