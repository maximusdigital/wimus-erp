# Bau-Auftrag: Modul 009 (historie) — Audit-Log + Aktivitäts-Historie (2026-06-28 17:30 MESZ)

Voller Arbeitszyklus (CLAUDE.md, „check"). Vorab-Spec: `009_historie_000/200/300` in `.docs/specs/`.
Zwei Ebenen in einem Modul. Entscheidungen getroffen: Audit per DB-Trigger, Whitelist kritischer
Tabellen, beide Ebenen + Timeline zusammen.

## Scope
1. **Audit-Log (DB-Trigger, Whitelist):** generische `audit_trigger()` + `audit_log`-Tabelle
   (append-only, alt/neu-JSONB, geänderte Felder, Akteur via Session-Var `wimus.akteur_id`).
   Trigger NUR auf Whitelist kritischer Tabellen (Verträge/Finanzen/Zugang/Kontakte — reale
   Existenz + mandant_id/id verifizieren). `changed_keys`-Hilfsfunktion.
2. **Akteur-Setzung:** Server-Client/API-Route setzt je Request `SET LOCAL wimus.akteur_id`. Real
   prüfen, ob/wie das im bestehenden Supabase-Server-Client geht; sonst Fallback dokumentieren.
3. **Aktivitäts-Historie:** `aktivitaeten` + `aktivitaet_bezug` (n:m, analog kom_nachricht_bezug
   aus 0007 — Bezug primär + über Hierarchie abgeleitet). Service `lib/historie/` (protokolliere/
   feed/audit/akteur/types).
4. **protokolliere-API:** EINE Funktion, die Module rufen; Bezug-Ableitung (Mieter→Einheit→Objekt)
   zentral. Erste Lieferanten verdrahten: FiBu (Zahlung/Mahnung), Kommunikation (Nachricht),
   Verträge (angelegt) — Rest im Report als Folge.
5. **UI Pipedrive-Timeline:** EINE Timeline-Komponente, zentral `/historie` (globaler Feed) +
   dezentral Reiter „Historie" je Entität (Ebenen-Umschalter). Fertige Feed-Komponente bevorzugen
   (Shadcn/Design-Tokens), kein Pipedrive-Klon. Audit-Ansicht `/einstellungen/audit` separat
   (nüchterne Tabelle, nur berechtigte Rollen).

## HARTE Anforderungen
- **Audit nicht umgehbar** (DB-Trigger, nicht app-seitig). Trigger robust: Logging-Fehler darf die
  eigentliche DB-Operation NIE abbrechen.
- **protokolliere() blockiert nie** den auslösenden Vorgang (Logging-Fehler separat).
- **RLS mandant_isolation** überall; Audit-Log nur für berechtigte Rollen lesbar; dezentrale Sicht
  „inkl. untergeordnete" = Verwalter-Sicht (Datenschutz wie 0007).
- **Keine n Eigenbau-Logs:** Module rufen protokolliere(), bauen keine eigene Historie. System-/
  Error-Log bleibt Infra (NICHT hier). Vorhandene Einzel-Historien prüfen (einbinden statt doppeln).
- **append-only** audit_log (kein UPDATE/DELETE außer Retention).

## Migrationen
Nach Migrations-Regel (CLAUDE.md): `.sql` in supabase/migrations/, dann SQL zur Freigabe zeigen,
nach Ja über /pg/query einspielen + verifizieren. Trigger-Migration idempotent (DROP TRIGGER IF
EXISTS dann CREATE). Bei großen Daten-Migrationen Trigger-Last bedenken.

## Empfehlung Reihenfolge
Audit-Fundament (Trigger + Tabelle + Akteur) zuerst, dann aktivitaeten + protokolliere + erste
Lieferanten, dann Timeline-UI. Falls zu groß für einen Lauf: sauber bis zu einem Punkt + Rest
im Report parken.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_historie.md` — 4 Punkte. Besonders: reale Whitelist,
Akteur-Session-Var-Lösung, welche Lieferanten verdrahtet, Retention-Vorschlag.
